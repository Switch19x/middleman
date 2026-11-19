'use strict';
// HTTP layer: JSON API + static frontend. No framework, no dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const S = require('./service');
const A = require('./accounts');
const { BANKS } = require('./bank');

const MAX_BODY = 4 * 1024 * 1024;
const SESSION_DAYS = 30;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

function createApp({ db, bank, thaid, demo = true, publicDir }) {
  const routes = [];
  const route = (method, pattern, handler, opts = {}) =>
    routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler, ...opts });

  // ---------- auth ----------
  function currentUser(req) {
    const token = parseCookies(req.headers.cookie).mm_session;
    if (!token) return null;
    const row = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?').get(token, Date.now());
    if (!row || row.kyc_status === 'rejected') return null;
    return { id: row.id, name: row.name, first_name: row.first_name, last_name: row.last_name, is_admin: !!row.is_admin, kyc_status: row.kyc_status };
  }
  function startSession(res, userId) {
    const token = crypto.randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)').run(token, userId, Date.now() + SESSION_DAYS * S.DAY);
    res.setHeader('Set-Cookie', `mm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  }
  const me = (u) => (u ? A.profile(db, u.id) : null);
  const login = (res, userId) => { startSession(res, userId); return { user: A.profile(db, userId) }; };

  route('GET', '/api/me', ({ user }) => ({ user: me(user), demo, banks: BANKS }), { auth: false });
  route('POST', '/api/auth/logout', ({ req, res }) => {
    const token = parseCookies(req.headers.cookie).mm_session;
    if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.setHeader('Set-Cookie', 'mm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return { ok: true };
  }, { auth: false });

  // Sign-in = identity verification with the national ID card. Two routes only:
  // 1) ThaID (DOPA's digital ID, OpenID Connect)
  route('POST', '/api/auth/thaid/start', () => thaid.start(), { auth: false });
  route('POST', '/api/auth/thaid/callback', ({ body, res }) => {
    let claims;
    try { claims = thaid.exchange(String(body.code || ''), String(body.state || '')); }
    catch (e) { throw new S.HttpError(e.status || 401, e.message); }
    return login(res, A.signInWithThaid(db, claims).userId);
  }, { auth: false, limit: 'auth' });
  // 2) Photo of the ID card + selfie, reviewed by staff; later sign-ins use ID number + PIN.
  route('POST', '/api/auth/idcard', ({ body, res }) => login(res, A.registerWithIdCard(db, body).userId), { auth: false, limit: 'auth' });
  route('POST', '/api/auth/pin', ({ body, res }) => login(res, A.signInWithPin(db, body).userId), { auth: false, limit: 'auth' });

  route('GET', '/api/health', () => ({ ok: true }), { auth: false });

  route('PUT', '/api/me/bank', ({ user, body }) => ({ user: A.setBankAccount(db, bank, user, body) }));

  // Staff queues
  route('GET', '/api/admin/kyc', ({ user }) => ({ queue: A.kycQueue(db, user) }));
  route('POST', '/api/admin/kyc/:uid', ({ user, params, body }) => A.reviewKyc(db, user, params.uid, body));
  route('GET', '/api/admin/payments', ({ user }) => ({ queue: S.paymentQueue(db, user) }));
  route('POST', '/api/admin/payments/:pid', ({ user, params, body }) => S.reviewPayment(db, user, params.pid, body));

  if (demo) {
    // Demo-only stand-ins for the outside world. Never enabled in production (DEMO=0).
    route('GET', '/api/demo/users', () => ({ users: db.prepare("SELECT id, name, is_admin FROM users WHERE is_admin = 1 OR kyc_status = 'verified' ORDER BY is_admin, created_at, id").all()
      .map((u) => ({ id: u.id, name: u.name, isAdmin: !!u.is_admin })) }), { auth: false });
    route('POST', '/api/auth/demo', ({ body, res }) => {
      const u = db.prepare('SELECT * FROM users WHERE id = ?').get(String(body.userId || ''));
      if (!u) throw new S.HttpError(404, 'ไม่พบผู้ใช้');
      return login(res, u.id);
    }, { auth: false });
    // What the ThaID app returns after the citizen consents.
    route('POST', '/api/demo/thaid/authorize', ({ body }) => {
      try { return { code: thaid.demoAuthorize(body) }; }
      catch (e) { throw new S.HttpError(e.status || 400, e.message); }
    }, { auth: false });
    // The buyer's banking app making the PromptPay transfer.
    route('POST', '/api/demo/bank/transfer', ({ user, body }) => {
      const p = db.prepare('SELECT p.*, d.buyer_id FROM payments p JOIN deals d ON d.id = p.deal_id WHERE p.id = ?').get(String(body.paymentId || ''));
      if (!p || p.buyer_id !== user.id) throw new S.HttpError(404, 'ไม่พบรายการชำระเงิน');
      const sender = body.fromOtherPerson ? 'นาย สมมติ ค***' : `${user.first_name} ${String(user.last_name || '').slice(0, 1)}***`;
      return { transRef: bank.demoTransfer({ amount: p.amount, senderName: sender }) };
    });
  }

  // ---------- deals ----------
  route('GET', '/api/deals', ({ user }) => ({ deals: S.listDeals(db, user) }));
  route('POST', '/api/deals', ({ user, body }) => S.createDeal(db, user, body));
  route('GET', '/api/deals/code/:code', ({ user, params }) => S.getDealByCode(db, user, params.code));
  route('GET', '/api/deals/:id', ({ user, params }) => S.getDeal(db, user, params.id));
  route('GET', '/api/deals/:id/ledger', ({ user, params }) => S.ledgerFor(db, user, params.id));
  route('POST', '/api/deals/:id/sign', ({ user, params, body }) => S.sign(db, user, params.id, body));
  route('POST', '/api/deals/:id/cancel', ({ user, params }) => S.cancel(db, user, params.id));
  route('POST', '/api/deals/:id/payments', ({ user, params }) => S.createPayment(db, bank, user, params.id));
  route('POST', '/api/deals/:id/payments/:pid/slip', ({ user, params, body }) => S.submitSlip(db, bank, user, params.id, params.pid, body));
  route('POST', '/api/deals/:id/ship', ({ user, params, body }) => S.ship(db, user, params.id, body));
  route('POST', '/api/deals/:id/confirm', ({ user, params, body }) => S.confirmReceipt(db, user, params.id, body));
  route('POST', '/api/deals/:id/dispute', ({ user, params, body }) => S.openDispute(db, user, params.id, body));
  route('POST', '/api/deals/:id/dispute/respond', ({ user, params, body }) => S.respondDispute(db, user, params.id, body));
  route('POST', '/api/deals/:id/dispute/accept', ({ user, params }) => S.acceptClaim(db, user, params.id));
  route('POST', '/api/deals/:id/dispute/decide', ({ user, params, body }) => S.decide(db, user, params.id, body));
  route('POST', '/api/deals/:id/messages', ({ user, params, body }) => S.postMessage(db, user, params.id, body));

  // ---------- request handling ----------
  const limiter = rateLimiter(240, 60_000);
  const authLimiter = rateLimiter(20, 15 * 60_000); // sign-in attempts per IP

  async function handleApi(req, res, url) {
    const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
    if (!r) return send(res, 404, { error: 'ไม่พบ API นี้' });
    if (req.method !== 'GET') {
      const ip = clientIp(req);
      if (!limiter(ip) || (r.limit === 'auth' && !authLimiter(ip))) return send(res, 429, { error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
      // CSRF: browsers cannot send a cross-site JSON POST without a preflight we never approve.
      if (!/^application\/json\b/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'ต้องส่งข้อมูลเป็น JSON' });
    }
    const user = currentUser(req);
    if (r.auth !== false && !user) return send(res, 401, { error: 'กรุณาเข้าสู่ระบบ' });
    let raw = '';
    let body = {};
    if (req.method !== 'GET') {
      raw = await readBody(req);
      try { body = raw ? JSON.parse(raw) : {}; } catch { return send(res, 400, { error: 'JSON ไม่ถูกต้อง' }); }
    }
    const params = r.re.exec(url.pathname).groups || {};
    const out = await r.handler({ req, res, user, body, raw, params, url });
    send(res, 200, out);
  }

  function serveStatic(req, res, url) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' });
    const rel = decodeURIComponent(url.pathname) === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = path.normalize(path.join(publicDir, rel));
    if (!file.startsWith(publicDir + path.sep)) return send(res, 403, { error: 'forbidden' });
    fs.readFile(file, (err, data) => {
      if (err) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
      else serveStatic(req, res, url);
    } catch (e) {
      if (e instanceof S.HttpError) return send(res, e.status, { error: e.message });
      if (e.status === 413) return send(res, 413, { error: 'ข้อมูลใหญ่เกินไป' });
      console.error(e);
      send(res, 500, { error: 'เกิดข้อผิดพลาดในระบบ' });
    }
  });
}

// ---------- utils ----------
function send(res, status, obj) {
  if (res.headersSent) return;
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function parseCookies(h = '') {
  return Object.fromEntries(h.split(';').map((p) => p.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
// Behind a hosting proxy (TRUST_PROXY=1) every request comes from the proxy, so use the forwarded client address.
function clientIp(req) {
  if (process.env.TRUST_PROXY === '1') {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress;
}

function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || now - h.start > windowMs) { hits.set(key, { start: now, n: 1 }); return true; }
    return ++h.n <= max;
  };
}

module.exports = { createApp };
