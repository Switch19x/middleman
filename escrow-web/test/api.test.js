'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { open } = require('../server/db');
const { createMockBank } = require('../server/bank');
const { createMockThaid } = require('../server/identity');
const { createApp } = require('../server/app');
const { seed, withCheckDigit } = require('../server/seed');

test('HTTP API end to end', async (t) => {
  const db = open(':memory:');
  const bank = createMockBank();
  seed(db, bank);
  const server = createApp({ db, bank, thaid: createMockThaid(), demo: true, publicDir: path.join(__dirname, '..', 'public') }).listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const jar = {};
  const call = async (who, method, url, body) => {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(jar[who] ? { Cookie: jar[who] } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const c = res.headers.get('set-cookie');
    if (c) jar[who] = c.split(';')[0];
    return { status: res.status, body: await res.json() };
  };

  await t.test('requires login; rejects non-JSON writes', async () => {
    assert.equal((await call('anon', 'GET', '/api/deals')).status, 401);
    const res = await fetch(base + '/api/auth/pin', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
    assert.equal(res.status, 415);
  });

  await t.test('ThaID sign-in creates a verified account; bank name must match', async () => {
    const start = await call('new', 'POST', '/api/auth/thaid/start', {});
    const pid = withCheckDigit('130000000555');
    const { code } = (await call('new', 'POST', '/api/demo/thaid/authorize', { state: start.body.state, pid, firstName: 'ใหม่', lastName: 'ทดลอง' })).body;
    assert.equal((await call('new', 'POST', '/api/auth/thaid/callback', { code, state: 'wrong' })).status, 401);
    const s2 = await call('new', 'POST', '/api/auth/thaid/start', {});
    const c2 = (await call('new', 'POST', '/api/demo/thaid/authorize', { state: s2.body.state, pid, firstName: 'ใหม่', lastName: 'ทดลอง' })).body.code;
    const me = await call('new', 'POST', '/api/auth/thaid/callback', { code: c2, state: s2.body.state });
    assert.equal(me.body.user.kycStatus, 'verified');
    assert.equal(me.body.user.canTransact, false);
    assert.equal((await call('new', 'POST', '/api/deals', {})).status, 403);
    assert.equal((await call('new', 'PUT', '/api/me/bank', { bankCode: 'BBL', accountNo: '1234567890', accountName: 'คนอื่น ทดลอง' })).status, 400);
    const ok = await call('new', 'PUT', '/api/me/bank', { bankCode: 'BBL', accountNo: '1234567890', accountName: 'ใหม่ ทดลอง' });
    assert.equal(ok.body.user.canTransact, true);
  });

  await t.test('PIN sign-in for ID-card accounts', async () => {
    const pid = withCheckDigit('350990045678');
    assert.equal((await call('mali', 'POST', '/api/auth/pin', { nationalId: pid, pin: '000000' })).status, 401);
    assert.equal((await call('mali', 'POST', '/api/auth/pin', { nationalId: pid, pin: '123456' })).body.user.id, 'u_mali');
  });

  for (const [who, id] of [['nat', 'u_nat'], ['admin', 'u_admin']]) {
    assert.equal((await call(who, 'POST', '/api/auth/demo', { userId: id })).status, 200);
  }

  await t.test('full flow over HTTP: PromptPay + slip, ship, confirm', async () => {
    const d = (await call('nat', 'POST', '/api/deals', {
      myRole: 'buyer', title: 'กีตาร์', category: 'goods', price: 5000, deliveryDays: 2,
      inspectionDays: 2, conditions: ['เสียงไม่บอด'], counterName: 'คุณมะลิ', agree: true,
    })).body;
    assert.equal((await call('mali', 'GET', '/api/deals/code/' + d.code)).body.prospective, true);
    assert.equal((await call('mali', 'POST', `/api/deals/${d.id}/sign`, { agree: true, contractHash: d.contractHash })).body.status, 'awaiting_payment');

    const pay = (await call('nat', 'POST', `/api/deals/${d.id}/payments`, {})).body;
    assert.equal(pay.amount, 5000);
    assert.match(pay.qrPayload, /^000201010212.*5802TH6304[0-9A-F]{4}$/);
    const { transRef } = (await call('nat', 'POST', '/api/demo/bank/transfer', { paymentId: pay.paymentId })).body;
    assert.equal((await call('nat', 'POST', `/api/deals/${d.id}/payments/${pay.paymentId}/slip`, { transRef })).body.status, 'funded');

    assert.equal((await call('nat', 'POST', `/api/deals/${d.id}/ship`, { carrier: 'EMS' })).status, 403);
    assert.equal((await call('mali', 'POST', `/api/deals/${d.id}/ship`, { carrier: 'EMS', tracking: 'E1' })).body.status, 'shipped');
    const done = await call('nat', 'POST', `/api/deals/${d.id}/confirm`, { checked: 1 });
    assert.equal(done.body.payout.seller, 4850);
    const ledger = (await call('mali', 'GET', `/api/deals/${d.id}/ledger`)).body;
    assert.equal(ledger.balance, 0);
    assert.equal(ledger.audit.ok, true);
    assert.equal(ledger.payouts[0].accountName, 'น.ส. มะลิ วงศ์ทอง');
  });

  await t.test('staff queues: KYC review and slip review', async () => {
    const kyc = (await call('admin', 'GET', '/api/admin/kyc')).body.queue;
    assert.equal(kyc.length, 1);
    assert.equal((await call('nat', 'GET', '/api/admin/kyc')).status, 403);
    assert.equal((await call('admin', 'POST', '/api/admin/kyc/' + kyc[0].userId, { approve: true, checked: true })).status, 200);
    const slips = (await call('admin', 'GET', '/api/admin/payments')).body.queue;
    assert.equal(slips.length, 1);
    assert.equal((await call('admin', 'POST', '/api/admin/payments/' + slips[0].id, { approve: true, checked: true })).status, 200);
  });

  await t.test('admin rules on the seeded dispute with the 5% fee', async () => {
    const disputed = (await call('admin', 'GET', '/api/deals')).body.deals.find((x) => x.status === 'disputed');
    const r = await call('admin', 'POST', `/api/deals/${disputed.id}/dispute/decide`, { buyerPercent: 100, reason: 'เลนส์มีราตามหลักฐาน', considered: true });
    assert.equal(r.body.status, 'resolved');
    assert.equal(r.body.payout.buyer, disputed.price * 0.95);
  });

  await t.test('static files are served and path traversal is blocked', async () => {
    const html = await fetch(base + '/');
    assert.equal(html.status, 200);
    assert.match(html.headers.get('content-security-policy'), /default-src 'self'/);
    assert.notEqual((await fetch(base + '/..%2fserver%2fdb.js')).status, 200);
  });
});
