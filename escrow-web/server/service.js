'use strict';
/*
 * Escrow domain logic. Every state change goes through here so the rules
 * (who may act, in which state, how money moves) live in one place.
 *
 *   pending ──sign×2──▶ awaiting_payment ──pay──▶ funded ──ship──▶ shipped ──confirm / timeout──▶ completed
 *      │                      │                     │                │
 *      └──cancel──────────────┴─▶ cancelled         └──dispute───────┴─▶ disputed ──accept / decide──▶ resolved
 */
const crypto = require('node:crypto');
const { tx } = require('./db');
const { HttpError } = require('./errors');
const A = require('./accounts');
const { senderMatches } = require('./identity');

const DAY = 86400000;
// Service fee is taken out of the contract price: 3% normally, 5% if a dispute is opened.
const FEE_RATE = 0.03;
const DISPUTE_FEE_RATE = 0.05;
const FEE_POLICY = 'fee:3%;dispute-fee:5%;deducted-from-price';
const RESPONSE_DAYS = 3;

const CATEGORIES = ['goods', 'service', 'digital'];
const DISPUTE_REASONS = {
  not_received: 'ไม่ได้รับสินค้า / งาน',
  not_as_described: 'ไม่ตรงตามที่ตกลง (ไม่ตรงปก)',
  damaged: 'สินค้าชำรุด / ใช้งานไม่ได้',
  buyer_silent: 'ผู้ซื้อได้รับแล้วแต่ไม่ยืนยัน',
  other: 'อื่น ๆ',
};
const BUYER_REASONS = ['not_received', 'not_as_described', 'damaged', 'other'];
const SELLER_REASONS = ['buyer_silent', 'other'];
const BUYER_WANTS = ['refund_full', 'refund_partial', 'return'];
const SELLER_WANTS = ['release'];

const fail = (status, msg) => { throw new HttpError(status, msg); };
const check = (cond, status, msg) => { if (!cond) fail(status, msg); };

// ---------- money ----------
const toSatang = (baht) => Math.round(Number(baht) * 100);
const toBaht = (s) => Math.round(s) / 100;
// The buyer pays exactly the contract price; the fee is deducted from it.
function fees(price) {
  const fee = Math.round(price * FEE_RATE);
  const disputeFee = Math.round(price * DISPUTE_FEE_RATE);
  return { buyerPays: price, fee, sellerGets: price - fee, disputeFee, disputePool: price - disputeFee };
}
// Split a deposit so that buyer + seller + platform fee === deposit exactly.
// The fee is charged only on the seller's share, pro rata.
// Disputed deal: 5% of the price is the fee, the rest is split by the ruling.
function splitDeposit(deposit, buyerPercent) {
  const p = Math.min(100, Math.max(0, buyerPercent)) / 100;
  const fee = Math.round(deposit * DISPUTE_FEE_RATE);
  const pool = deposit - fee;
  const buyer = Math.round(pool * p);
  return { buyer, seller: pool - buyer, fee };
}

// ---------- helpers ----------
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const id = (prefix) => prefix + crypto.randomBytes(6).toString('base64url');
const str = (v, max, field, { required = true } = {}) => {
  const s = String(v ?? '').trim();
  if (required) check(s.length > 0, 400, `กรุณาระบุ${field}`);
  check(s.length <= max, 400, `${field}ยาวเกิน ${max} ตัวอักษร`);
  return s;
};
const int = (v, min, max, field) => {
  const n = Number(v);
  check(Number.isInteger(n) && n >= min && n <= max, 400, `${field}ต้องอยู่ระหว่าง ${min}-${max}`);
  return n;
};
function evidenceList(v) {
  if (v == null) return [];
  check(Array.isArray(v) && v.length <= 8, 400, 'แนบหลักฐานได้สูงสุด 8 ไฟล์');
  return v.map((e) => {
    const name = str(e?.name, 200, 'ชื่อไฟล์');
    const src = e?.src == null ? undefined : String(e.src);
    if (src !== undefined) check(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src) && src.length < 400_000, 400, 'ไฟล์รูปไม่ถูกต้องหรือใหญ่เกินไป');
    return src ? { name, src } : { name };
  });
}
const parse = (s, fallback = null) => (s == null ? fallback : JSON.parse(s));

function contractHash(t) {
  return sha256(JSON.stringify([t.code, t.title, t.description, t.category, t.price, FEE_POLICY, t.delivery_days, t.inspection_days, t.conditions]));
}

// ---------- repository ----------
function getDealRow(db, dealId) {
  const row = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId);
  check(row, 404, 'ไม่พบดีล');
  return row;
}

function appendEvent(db, dealId, who, userId, text, ts) {
  const last = db.prepare('SELECT hash FROM events WHERE deal_id = ? ORDER BY id DESC LIMIT 1').get(dealId);
  const prev = last ? last.hash : 'GENESIS';
  const hash = sha256(JSON.stringify([prev, dealId, who, userId, text, ts]));
  db.prepare('INSERT INTO events (deal_id, who, user_id, text, ts, prev_hash, hash) VALUES (?,?,?,?,?,?,?)')
    .run(dealId, who, userId ?? null, text, ts, prev, hash);
}

function verifyAudit(db, dealId) {
  const rows = db.prepare('SELECT * FROM events WHERE deal_id = ? ORDER BY id').all(dealId);
  let prev = 'GENESIS';
  for (const r of rows) {
    const expect = sha256(JSON.stringify([prev, r.deal_id, r.who, r.user_id, r.text, r.ts]));
    if (r.prev_hash !== prev || r.hash !== expect) return { ok: false, brokenAt: r.id, count: rows.length };
    prev = r.hash;
  }
  return { ok: true, count: rows.length, head: prev };
}

function ledgerBalance(db, dealId) {
  const rows = db.prepare('SELECT type, SUM(amount) AS s FROM ledger WHERE deal_id = ? GROUP BY type').all(dealId);
  const t = Object.fromEntries(rows.map((r) => [r.type, r.s]));
  return (t.deposit || 0) - (t.release || 0) - (t.refund || 0) - (t.fee || 0);
}

function update(db, dealId, fields, now) {
  const keys = Object.keys(fields);
  db.prepare(`UPDATE deals SET ${keys.map((k) => k + ' = ?').join(', ')}, updated_at = ? WHERE id = ?`)
    .run(...keys.map((k) => fields[k]), now, dealId);
}

// Which side of this deal is the user on?
function roleOf(row, user) {
  if (!user) return null;
  if (user.is_admin) return 'admin';
  if (row.buyer_id === user.id) return 'buyer';
  if (row.seller_id === user.id) return 'seller';
  return null;
}
// A pending deal with an unclaimed slot can be opened (and signed) by whoever has the code.
function openSlot(row) {
  if (row.status !== 'pending') return null;
  if (!row.buyer_id) return 'buyer';
  if (!row.seller_id) return 'seller';
  return null;
}
function requireRole(row, user, allowed) {
  const r = roleOf(row, user);
  check(r, 403, 'คุณไม่ได้เป็นคู่สัญญาในดีลนี้');
  check(allowed.includes(r), 403, 'การกระทำนี้ไม่ใช่ของฝ่ายคุณ');
  return r;
}
const requireStatus = (row, ...ok) => check(ok.includes(row.status), 409, 'สถานะดีลไม่อนุญาตให้ทำรายการนี้');

// ---------- views ----------
function serialize(db, row, user) {
  const myRole = roleOf(row, user) || openSlot(row);
  const d = parse(row.payment);
  const sh = parse(row.shipment);
  const po = parse(row.payout);
  const disp = db.prepare('SELECT * FROM disputes WHERE deal_id = ?').get(row.id);
  const dec = disp ? parse(disp.decision) : null;
  const role = roleOf(row, user);
  // The buyer (and staff) can see a transfer that is waiting for slip review.
  const pendingPay = (role === 'buyer' || role === 'admin') && row.status === 'awaiting_payment'
    ? db.prepare("SELECT id, status, review_note, created_at FROM payments WHERE deal_id = ? AND status IN ('review','rejected') ORDER BY created_at DESC LIMIT 1").get(row.id)
    : null;
  return {
    id: row.id, code: row.code, title: row.title, description: row.description, category: row.category,
    price: toBaht(row.price), deliveryDays: row.delivery_days, inspectionDays: row.inspection_days,
    conditions: parse(row.conditions, []), contractHash: row.contract_hash, createdBy: row.created_by,
    buyerName: row.buyer_name, sellerName: row.seller_name, status: row.status,
    signatures: { buyer: row.buyer_signed_at, seller: row.seller_signed_at },
    payment: d && { ...d, amount: toBaht(d.amount) },
    paymentReview: pendingPay ? { id: pendingPay.id, status: pendingPay.status, note: pendingPay.review_note, ts: pendingPay.created_at } : null,
    shipment: sh,
    payout: po && { buyer: toBaht(po.buyer), seller: toBaht(po.seller), fee: toBaht(po.fee), ts: po.ts },
    dispute: disp && {
      by: disp.opened_by, reason: disp.reason, detail: disp.detail, want: disp.want, amount: toBaht(disp.amount),
      evidence: parse(disp.evidence, []), ts: disp.opened_at,
      response: disp.responded_at ? { text: disp.response_text, evidence: parse(disp.response_evidence, []), ts: disp.responded_at } : null,
      decision: dec && { buyer: toBaht(dec.buyer), seller: toBaht(dec.seller), fee: toBaht(dec.fee), reason: dec.reason, ts: dec.ts },
    },
    messages: db.prepare('SELECT who, text, ts FROM messages WHERE deal_id = ? ORDER BY id').all(row.id).map((m) => ({ ...m })),
    events: db.prepare('SELECT who, text, ts FROM events WHERE deal_id = ? ORDER BY id').all(row.id).map((e) => ({ ...e })),
    myRole, prospective: !roleOf(row, user) && !!openSlot(row),
    updatedAt: row.updated_at,
  };
}

function canView(row, user) {
  return !!(roleOf(row, user) || openSlot(row));
}

function getDeal(db, user, dealId) {
  const row = getDealRow(db, dealId);
  check(canView(row, user), 403, 'คุณไม่มีสิทธิ์ดูดีลนี้');
  return serialize(db, row, user);
}

function getDealByCode(db, user, code) {
  const row = db.prepare('SELECT * FROM deals WHERE code = ?').get(String(code || '').toUpperCase());
  check(row && canView(row, user), 404, 'ไม่พบดีล หรือดีลนี้มีคู่สัญญาครบแล้ว');
  return serialize(db, row, user);
}

function listDeals(db, user) {
  const rows = user.is_admin
    ? db.prepare('SELECT * FROM deals ORDER BY updated_at DESC').all()
    : db.prepare('SELECT * FROM deals WHERE buyer_id = ? OR seller_id = ? ORDER BY updated_at DESC').all(user.id, user.id);
  return rows.map((r) => serialize(db, r, user));
}

// ---------- commands ----------
function newCode(db) {
  for (;;) {
    const code = 'MM-' + crypto.randomInt(1000, 10000);
    if (!db.prepare('SELECT 1 FROM deals WHERE code = ?').get(code)) return code;
  }
}

function createDeal(db, user, input, now = Date.now(), opts = {}) {
  check(!user.is_admin, 403, 'บัญชีผู้ไกล่เกลี่ยสร้างดีลไม่ได้');
  const me = A.requireEligible(db, user);
  const myRole = input.myRole;
  check(['buyer', 'seller'].includes(myRole), 400, 'ระบุบทบาทไม่ถูกต้อง');
  const conditions = (Array.isArray(input.conditions) ? input.conditions : [])
    .map((c) => str(c, 200, 'เงื่อนไข', { required: false })).filter(Boolean);
  check(conditions.length >= 1 && conditions.length <= 20, 400, 'ระบุเงื่อนไขการรับสินค้า 1-20 ข้อ');
  const price = toSatang(input.price);
  check(Number.isFinite(price) && price >= 10000 && price <= 1e11, 400, 'ราคาต้องอยู่ระหว่าง ฿100 - ฿1,000,000,000');
  check(input.agree === true, 400, 'กรุณายืนยันและลงนามข้อตกลง');
  const t = {
    code: opts.code || newCode(db),
    title: str(input.title, 120, 'ชื่อสินค้า / งาน'),
    description: str(input.description, 2000, 'รายละเอียด', { required: false }),
    category: CATEGORIES.includes(input.category) ? input.category : fail(400, 'ประเภทไม่ถูกต้อง'),
    price,
    delivery_days: int(input.deliveryDays, 1, 60, 'ระยะเวลาส่ง'),
    inspection_days: int(input.inspectionDays, 1, 30, 'ระยะตรวจรับ'),
    conditions: JSON.stringify(conditions),
  };
  const counterName = str(input.counterName, 80, 'ชื่ออีกฝ่าย');
  const dealId = id('d');
  return tx(db, () => {
    db.prepare(`INSERT INTO deals (id, code, title, description, category, price, delivery_days, inspection_days,
        conditions, contract_hash, created_by, buyer_id, seller_id, buyer_name, seller_name, buyer_signed_at, seller_signed_at,
        status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      dealId, t.code, t.title, t.description, t.category, t.price, t.delivery_days, t.inspection_days,
      t.conditions, contractHash(t), myRole,
      myRole === 'buyer' ? user.id : null, myRole === 'seller' ? user.id : null,
      myRole === 'buyer' ? me.name : counterName, myRole === 'seller' ? me.name : counterName,
      myRole === 'buyer' ? now : null, myRole === 'seller' ? now : null,
      'pending', now, now);
    const row = getDealRow(db, dealId);
    appendEvent(db, dealId, myRole, user.id, `สร้างข้อตกลงและลงนาม · รหัสสัญญา ${row.contract_hash.slice(0, 16).toUpperCase()}`, now);
    return serialize(db, row, user);
  });
}

function sign(db, user, dealId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    requireStatus(row, 'pending');
    check(!user.is_admin, 403, 'ผู้ไกล่เกลี่ยไม่ใช่คู่สัญญา');
    const me = A.requireEligible(db, user);
    let r = roleOf(row, user);
    if (!r) {
      r = openSlot(row);
      check(r, 403, 'ดีลนี้มีคู่สัญญาครบแล้ว');
      const other = r === 'buyer' ? row.seller_id : row.buyer_id;
      check(other !== user.id, 409, 'คุณเป็นอีกฝ่ายในดีลนี้อยู่แล้ว');
    }
    check(!row[`${r}_signed_at`], 409, 'คุณลงนามไปแล้ว');
    check(input.agree === true, 400, 'กรุณายอมรับเงื่อนไขก่อนลงนาม');
    check(input.contractHash === row.contract_hash, 409, 'สัญญามีการเปลี่ยนแปลง กรุณาโหลดใหม่');
    const name = me.name; // signed in the legal name from the verified ID card
    update(db, dealId, { [`${r}_id`]: user.id, [`${r}_name`]: name, [`${r}_signed_at`]: now }, now);
    appendEvent(db, dealId, r, user.id, `ยืนยันข้อตกลงและลงนามในชื่อ “${name}” (ยืนยันตัวตนแล้ว) · รหัสสัญญา ${row.contract_hash.slice(0, 16).toUpperCase()}`, now);
    const after = getDealRow(db, dealId);
    if (after.buyer_signed_at && after.seller_signed_at) {
      update(db, dealId, { status: 'awaiting_payment' }, now);
      appendEvent(db, dealId, 'system', null, 'ข้อตกลงสมบูรณ์ รอผู้ซื้อชำระเงิน', now);
    }
    return serialize(db, getDealRow(db, dealId), user);
  });
}

function cancel(db, user, dealId, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    const r = requireRole(row, user, ['buyer', 'seller']);
    requireStatus(row, 'pending', 'awaiting_payment');
    check(!db.prepare("SELECT 1 FROM payments WHERE deal_id = ? AND status = 'succeeded'").get(dealId), 409, 'มีการชำระเงินแล้ว');
    update(db, dealId, { status: 'cancelled' }, now);
    appendEvent(db, dealId, r, user.id, 'ยกเลิกดีลก่อนชำระเงิน', now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

// Step 1: show the buyer where to transfer (PromptPay QR to the escrow account, exact amount).
function createPayment(db, bank, user, dealId, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    requireRole(row, user, ['buyer']);
    requireStatus(row, 'awaiting_payment');
    const amount = fees(row.price).buyerPays;
    let p = db.prepare("SELECT * FROM payments WHERE deal_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1").get(dealId);
    if (!p) {
      const pid = id('p');
      db.prepare('INSERT INTO payments (id, deal_id, method, amount, status, created_at) VALUES (?,?,?,?,?,?)')
        .run(pid, dealId, 'PromptPay', amount, 'pending', now);
      p = { id: pid };
    }
    return { paymentId: p.id, amount: toBaht(amount), reference: row.code, qrPayload: bank.promptPayPayload(amount), escrow: bank.escrow };
  });
}

// Step 2: the buyer submits the slip. We ask the bank about that transaction and
// only credit escrow when the amount, the receiving account and the sender all match.
function submitSlip(db, bank, user, dealId, paymentId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    requireRole(row, user, ['buyer']);
    requireStatus(row, 'awaiting_payment');
    const p = db.prepare('SELECT * FROM payments WHERE id = ? AND deal_id = ?').get(paymentId, dealId);
    check(p && p.status === 'pending', 409, 'รายการชำระนี้ไม่อยู่ในสถานะรอสลิป');
    const transRef = str(input.transRef, 40, 'เลขที่อ้างอิงรายการบนสลิป').toUpperCase();
    check(/^[A-Z0-9]{8,40}$/.test(transRef), 400, 'เลขที่อ้างอิงบนสลิปไม่ถูกต้อง');
    check(!db.prepare('SELECT 1 FROM payments WHERE trans_ref = ?').get(transRef), 409, 'สลิปนี้ถูกใช้ไปแล้ว ไม่สามารถใช้ซ้ำได้');
    const slip = input.slipImage == null ? null : String(input.slipImage);
    if (slip) check(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(slip) && slip.length < 1_500_000, 400, 'ไฟล์สลิปไม่ถูกต้อง');

    const result = bank.verifySlip(transRef);
    if (result) {
      check(result.receiverId === bank.escrow.promptPayId, 400, 'สลิปนี้ไม่ได้โอนเข้าบัญชีพักเงินของ Middleman');
      check(result.amount === p.amount, 400, `ยอดโอนบนสลิป ฿${toBaht(result.amount).toLocaleString('th-TH')} ไม่ตรงกับยอดที่ต้องชำระ ฿${toBaht(p.amount).toLocaleString('th-TH')}`);
    }
    const buyer = A.userRow(db, user.id);
    const ownAccount = result && senderMatches(result.senderName, buyer.first_name, buyer.last_name);
    const status = result && ownAccount ? 'pending' : 'review';
    const note = !result ? 'ธนาคารยังไม่ยืนยันรายการนี้ รอทีมงานตรวจกับรายการเดินบัญชี'
      : !ownAccount ? `ชื่อผู้โอน “${result.senderName}” ไม่ตรงกับผู้ซื้อ ต้องโอนจากบัญชีของตนเอง` : null;
    db.prepare('UPDATE payments SET trans_ref = ?, slip_image = ?, bank_result = ?, status = ?, review_note = ? WHERE id = ?')
      .run(transRef, slip, result ? JSON.stringify(result) : null, status, note, p.id);
    if (status === 'pending') credit(db, p.id, now);
    else appendEvent(db, row.id, 'buyer', user.id, `ส่งสลิปอ้างอิง ${transRef} · รอทีมงานตรวจสอบ`, now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

// Staff decision on a slip the bank could not auto-match.
function reviewPayment(db, user, paymentId, input, now = Date.now()) {
  check(user.is_admin, 403, 'เฉพาะทีมงาน');
  return tx(db, () => {
    const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    check(p && p.status === 'review', 404, 'ไม่พบสลิปที่รอตรวจสอบ');
    if (input.approve === true) {
      check(input.checked === true, 400, 'กรุณายืนยันว่าพบยอดเงินเข้าในรายการเดินบัญชีแล้ว');
      credit(db, p.id, now);
    } else {
      const note = str(input.note, 300, 'เหตุผล');
      db.prepare("UPDATE payments SET status = 'rejected', review_note = ? WHERE id = ?").run(note, p.id);
      appendEvent(db, p.deal_id, 'admin', user.id, `ไม่อนุมัติสลิป ${p.trans_ref}: ${note}`, now);
    }
    return { ok: true };
  });
}

function paymentQueue(db, user) {
  check(user.is_admin, 403, 'เฉพาะทีมงาน');
  return db.prepare(`SELECT p.*, d.code, d.title, d.buyer_name FROM payments p JOIN deals d ON d.id = p.deal_id
      WHERE p.status = 'review' ORDER BY p.created_at`).all()
    .map((p) => ({ id: p.id, dealId: p.deal_id, code: p.code, title: p.title, buyerName: p.buyer_name, amount: toBaht(p.amount),
      transRef: p.trans_ref, slipImage: p.slip_image, bank: parse(p.bank_result), note: p.review_note, ts: p.created_at }));
}

// Money has verifiably landed in the escrow account. Idempotent.
function credit(db, paymentId, now) {
  const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (p.status === 'succeeded') return;
  const row = getDealRow(db, p.deal_id);
  if (row.status !== 'awaiting_payment') {
    // Paid into a deal that can no longer take money (e.g. cancelled): return it in full.
    db.prepare("UPDATE payments SET status = 'refund_due', confirmed_at = ? WHERE id = ?").run(now, p.id);
    appendEvent(db, row.id, 'system', null, `ได้รับเงินหลังดีลปิดแล้ว · คืนเงินเต็มจำนวน ฿${toBaht(p.amount).toLocaleString('th-TH')}`, now);
    return;
  }
  check(p.amount === fees(row.price).buyerPays, 409, 'ยอดชำระไม่ตรงกับข้อตกลง');
  db.prepare("UPDATE payments SET status = 'succeeded', confirmed_at = ?, review_note = NULL WHERE id = ?").run(now, p.id);
  // Any other open attempt for this deal is now void.
  db.prepare("UPDATE payments SET status = 'rejected', review_note = 'มีรายการอื่นชำระสำเร็จแล้ว' WHERE deal_id = ? AND id != ? AND status IN ('pending','review')").run(row.id, p.id);
  db.prepare('INSERT INTO ledger (deal_id, type, amount, ts) VALUES (?,?,?,?)').run(row.id, 'deposit', p.amount, now);
  update(db, row.id, { status: 'funded', payment: JSON.stringify({ method: p.method, amount: p.amount, transRef: p.trans_ref, ts: now }) }, now);
  appendEvent(db, row.id, 'system', null, `ธนาคารยืนยันยอดโอน ฿${toBaht(p.amount).toLocaleString('th-TH')} (อ้างอิง ${p.trans_ref}) เข้าบัญชีพักเงินแล้ว`, now);
}

function ship(db, user, dealId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    requireRole(row, user, ['seller']);
    requireStatus(row, 'funded');
    const shipment = {
      carrier: str(input.carrier, 80, 'วิธีจัดส่ง'),
      tracking: str(input.tracking, 200, 'เลขพัสดุ', { required: false }),
      note: str(input.note, 500, 'หมายเหตุ', { required: false }),
      evidence: evidenceList(input.evidence),
      ts: now,
    };
    update(db, dealId, { status: 'shipped', shipment: JSON.stringify(shipment) }, now);
    appendEvent(db, dealId, 'seller', user.id, `แจ้งจัดส่ง ${shipment.carrier}${shipment.tracking ? ' · ' + shipment.tracking : ''}`, now);
    appendEvent(db, dealId, 'system', null, `เริ่มนับระยะตรวจรับ ${row.inspection_days} วัน`, now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

// Pay out the escrow balance; must leave the deal's balance at exactly zero.
function settle(db, row, { buyer, seller, fee }, now) {
  const deposit = parse(row.payment).amount;
  check(buyer + seller + fee === deposit && buyer >= 0 && seller >= 0 && fee >= 0, 500, 'ยอดจัดสรรเงินไม่สมดุล');
  const ins = db.prepare('INSERT INTO ledger (deal_id, type, amount, ts) VALUES (?,?,?,?)');
  if (buyer) ins.run(row.id, 'refund', buyer, now);
  if (seller) ins.run(row.id, 'release', seller, now);
  if (fee) ins.run(row.id, 'fee', fee, now);
  check(ledgerBalance(db, row.id) === 0, 500, 'ยอดคงเหลือในบัญชีพักเงินไม่เป็นศูนย์');
  // Queue bank transfers to each party's verified (same-name) account.
  for (const [kind, userId, amount] of [['refund', row.buyer_id, buyer], ['release', row.seller_id, seller]]) {
    if (!amount) continue;
    const acct = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').get(userId);
    check(acct, 409, 'คู่สัญญายังไม่มีบัญชีรับเงิน');
    db.prepare('INSERT INTO payouts (deal_id, user_id, kind, amount, bank_code, account_no, account_name, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(row.id, userId, kind, amount, acct.bank_code, acct.account_no, acct.account_name, now);
  }
  return JSON.stringify({ buyer, seller, fee, ts: now });
}

function complete(db, row, actorWho, userId, now) {
  const f = fees(row.price);
  const deposit = parse(row.payment).amount;
  const payout = settle(db, row, { buyer: 0, seller: f.sellerGets, fee: deposit - f.sellerGets }, now);
  update(db, row.id, { status: 'completed', payout }, now);
  appendEvent(db, row.id, 'system', null, `ปล่อยเงิน ฿${toBaht(f.sellerGets).toLocaleString('th-TH')} ให้ผู้ขายแล้ว`, now);
}

function confirmReceipt(db, user, dealId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    requireRole(row, user, ['buyer']);
    requireStatus(row, 'shipped');
    check(input.checked === parse(row.conditions).length, 400, 'กรุณาตรวจสอบเงื่อนไขให้ครบทุกข้อ');
    appendEvent(db, dealId, 'buyer', user.id, 'ยืนยันรับสินค้าครบตามเงื่อนไข', now);
    complete(db, row, 'buyer', user.id, now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

function openDispute(db, user, dealId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    const r = requireRole(row, user, ['buyer', 'seller']);
    requireStatus(row, 'funded', 'shipped');
    if (r === 'seller') check(row.status === 'shipped', 409, 'ผู้ขายเปิดข้อพิพาทได้หลังแจ้งจัดส่งแล้วเท่านั้น');
    check((r === 'buyer' ? BUYER_REASONS : SELLER_REASONS).includes(input.reason), 400, 'สาเหตุไม่ถูกต้อง');
    check((r === 'buyer' ? BUYER_WANTS : SELLER_WANTS).includes(input.want), 400, 'ข้อเรียกร้องไม่ถูกต้อง');
    check(input.agree === true, 400, 'กรุณายืนยันความถูกต้องของข้อมูล');
    const { disputePool } = fees(row.price);
    let amount = 0;
    if (input.want === 'refund_partial') {
      amount = toSatang(input.amount);
      check(amount > 0 && amount < disputePool, 400, `ขอคืนบางส่วนได้ไม่เกิน ฿${toBaht(disputePool - 1).toLocaleString('th-TH')} (ราคาหักค่าบริการ 5%)`);
    }
    db.prepare('INSERT INTO disputes (deal_id, opened_by, reason, detail, want, amount, evidence, opened_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(dealId, r, input.reason, str(input.detail, 3000, 'รายละเอียดปัญหา'), input.want, amount, JSON.stringify(evidenceList(input.evidence)), now);
    update(db, dealId, { status: 'disputed' }, now);
    appendEvent(db, dealId, r, user.id, 'เปิดข้อพิพาท: ' + DISPUTE_REASONS[input.reason], now);
    appendEvent(db, dealId, 'system', null, `ระงับการปล่อยเงิน แจ้งอีกฝ่ายให้ชี้แจงภายใน ${RESPONSE_DAYS} วัน · ค่าบริการปรับเป็น 5%`, now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

function respondDispute(db, user, dealId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    const r = requireRole(row, user, ['buyer', 'seller']);
    requireStatus(row, 'disputed');
    const ds = db.prepare('SELECT * FROM disputes WHERE deal_id = ?').get(dealId);
    check(ds.opened_by !== r, 403, 'ผู้เปิดข้อพิพาทไม่ต้องชี้แจง');
    check(!ds.responded_at, 409, 'ส่งคำชี้แจงไปแล้ว');
    db.prepare('UPDATE disputes SET response_text = ?, response_evidence = ?, responded_at = ? WHERE deal_id = ?')
      .run(str(input.text, 3000, 'คำชี้แจง'), JSON.stringify(evidenceList(input.evidence)), now, dealId);
    appendEvent(db, dealId, r, user.id, 'ส่งคำชี้แจงและหลักฐาน', now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

function resolve(db, row, split, reason, by, now) {
  const payout = settle(db, row, split, now);
  db.prepare('UPDATE disputes SET decision = ? WHERE deal_id = ?').run(JSON.stringify({ ...split, reason, by, ts: now }), row.id);
  update(db, row.id, { status: 'resolved', payout }, now);
}

// The other party concedes: settle exactly as the claimant asked.
function acceptClaim(db, user, dealId, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    const r = requireRole(row, user, ['buyer', 'seller']);
    requireStatus(row, 'disputed');
    const ds = db.prepare('SELECT * FROM disputes WHERE deal_id = ?').get(dealId);
    check(ds.opened_by !== r, 403, 'ผู้เปิดข้อพิพาทยอมรับข้อเรียกร้องของตัวเองไม่ได้');
    const deposit = parse(row.payment).amount;
    const fee = deposit - fees(row.price).disputePool;
    const pool = deposit - fee;
    let split;
    if (ds.want === 'refund_full' || ds.want === 'return') split = { buyer: pool, seller: 0, fee };
    else if (ds.want === 'refund_partial') {
      const buyer = Math.min(pool, ds.amount);
      split = { buyer, seller: pool - buyer, fee };
    } else split = { buyer: 0, seller: pool, fee };
    resolve(db, row, split, 'คู่กรณียอมรับข้อเรียกร้องและตกลงยุติข้อพิพาทกันเอง', user.id, now);
    appendEvent(db, dealId, r, user.id, 'ยอมรับข้อเรียกร้อง ยุติข้อพิพาทโดยความตกลง', now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

function decide(db, user, dealId, input, now = Date.now()) {
  return tx(db, () => {
    const row = getDealRow(db, dealId);
    requireRole(row, user, ['admin']);
    requireStatus(row, 'disputed');
    check(input.considered === true, 400, 'กรุณายืนยันข้อพิจารณาให้ครบ');
    const pct = int(input.buyerPercent, 0, 100, 'สัดส่วนคืนเงินผู้ซื้อ');
    const reason = str(input.reason, 3000, 'เหตุผลประกอบคำตัดสิน');
    const split = splitDeposit(parse(row.payment).amount, pct);
    resolve(db, row, split, reason, user.id, now);
    appendEvent(db, dealId, 'admin', user.id, `ตัดสินข้อพิพาท: คืนผู้ซื้อ ฿${toBaht(split.buyer).toLocaleString('th-TH')} · โอนผู้ขาย ฿${toBaht(split.seller).toLocaleString('th-TH')}`, now);
    db.prepare('INSERT INTO messages (deal_id, who, user_id, text, ts) VALUES (?,?,?,?,?)').run(dealId, 'admin', user.id, 'ผู้ไกล่เกลี่ยได้ตัดสินแล้ว: ' + reason, now);
    return serialize(db, getDealRow(db, dealId), user);
  });
}

function postMessage(db, user, dealId, input, now = Date.now()) {
  const row = getDealRow(db, dealId);
  const r = requireRole(row, user, ['buyer', 'seller', 'admin']);
  check(!['completed', 'cancelled', 'resolved'].includes(row.status), 409, 'ดีลปิดแล้ว');
  db.prepare('INSERT INTO messages (deal_id, who, user_id, text, ts) VALUES (?,?,?,?,?)').run(dealId, r, user.id, str(input.text, 1000, 'ข้อความ'), now);
  return serialize(db, getDealRow(db, dealId), user);
}

function ledgerFor(db, user, dealId) {
  const row = getDealRow(db, dealId);
  requireRole(row, user, ['buyer', 'seller', 'admin']);
  const entries = db.prepare('SELECT type, amount, ts FROM ledger WHERE deal_id = ? ORDER BY id').all(dealId)
    .map((e) => ({ type: e.type, amount: toBaht(e.amount), ts: e.ts }));
  const payouts = db.prepare('SELECT kind, amount, bank_code, account_no, account_name, status FROM payouts WHERE deal_id = ? ORDER BY id').all(dealId)
    .map((p) => ({ kind: p.kind, amount: toBaht(p.amount), bankCode: p.bank_code, accountNo: A.maskAccount(p.account_no), accountName: p.account_name, status: p.status }));
  return { entries, payouts, balance: toBaht(ledgerBalance(db, dealId)), audit: verifyAudit(db, dealId) };
}

// Auto-release: buyer stayed silent past the inspection window.
function sweepExpired(db, now = Date.now()) {
  const due = db.prepare("SELECT * FROM deals WHERE status = 'shipped'").all()
    .filter((r) => parse(r.shipment).ts + r.inspection_days * DAY <= now);
  for (const r of due) {
    tx(db, () => {
      const row = getDealRow(db, r.id);
      if (row.status !== 'shipped') return;
      appendEvent(db, row.id, 'system', null, `พ้นระยะตรวจรับ ${row.inspection_days} วันโดยไม่มีการโต้แย้ง ถือว่ายอมรับสินค้า`, now);
      complete(db, row, 'system', null, now);
    });
  }
  return due.length;
}

module.exports = {
  HttpError, DAY, DISPUTE_REASONS, FEE_RATE, DISPUTE_FEE_RATE,
  toSatang, toBaht, fees, splitDeposit, contractHash, appendEvent, verifyAudit, ledgerBalance,
  getDeal, getDealByCode, listDeals, createDeal, sign, cancel, createPayment, submitSlip, reviewPayment, paymentQueue, ship,
  confirmReceipt, openDispute, respondDispute, acceptClaim, decide, postMessage, ledgerFor, sweepExpired,
};
