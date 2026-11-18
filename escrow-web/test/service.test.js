'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../server/service');
const { setup } = require('./helpers');

const terms = (o = {}) => ({ myRole: 'buyer', title: 'ของ', description: '', category: 'goods', price: 1000,
  deliveryDays: 3, inspectionDays: 3, conditions: ['ใช้งานได้'], counterName: 'ผู้ขาย', agree: true, ...o });
const err = (status) => (e) => e instanceof S.HttpError && e.status === status;
const sat = S.toSatang;

// Buyer transfers from their own account and submits the slip.
function pay(t, dealId, sender = 'ผู้ซื้อ ท***') {
  const p = S.createPayment(t.db, t.bank, t.buyer, dealId);
  const transRef = t.bank.demoTransfer({ amount: sat(p.amount), senderName: sender });
  return { p, transRef, deal: S.submitSlip(t.db, t.bank, t.buyer, dealId, p.paymentId, { transRef }) };
}
function dealAt(t, state, o) {
  const d = S.createDeal(t.db, t.buyer, terms(o));
  if (state === 'pending') return d;
  S.sign(t.db, t.seller, d.id, { agree: true, contractHash: d.contractHash });
  if (state === 'awaiting_payment') return d;
  pay(t, d.id);
  if (state === 'funded') return d;
  S.ship(t.db, t.seller, d.id, { carrier: 'EMS', tracking: 'X1' });
  return d;
}

test('fee is 3% deducted from the price; 5% when disputed', () => {
  assert.deepEqual(S.fees(100000), { buyerPays: 100000, fee: 3000, sellerGets: 97000, disputeFee: 5000, disputePool: 95000 });
  for (const pct of [0, 5, 33, 50, 77, 100]) {
    const s = S.splitDeposit(100001, pct);
    assert.equal(s.buyer + s.seller + s.fee, 100001, `pct ${pct}`);
    assert.equal(s.fee, 5000);
  }
  assert.deepEqual(S.splitDeposit(100000, 100), { buyer: 95000, seller: 0, fee: 5000 });
});

test('happy path: buyer pays the exact price, seller gets 97%, escrow ends at 0', () => {
  const t = setup();
  const d = dealAt(t, 'shipped');
  assert.equal(S.getDeal(t.db, t.buyer, d.id).payment.amount, 1000);
  const done = S.confirmReceipt(t.db, t.buyer, d.id, { checked: 1 });
  assert.equal(done.status, 'completed');
  assert.deepEqual([done.payout.seller, done.payout.fee], [970, 30]);
  assert.equal(S.ledgerBalance(t.db, d.id), 0);
  assert.equal(S.verifyAudit(t.db, d.id).ok, true);
  const po = S.ledgerFor(t.db, t.seller, d.id).payouts;
  assert.deepEqual(po.map((x) => [x.kind, x.amount, x.accountName]), [['release', 970, 'ผู้ขาย ทดสอบ']]);
});

test('only verified users with a payout account can trade', () => {
  const t = setup();
  t.add('p', 'รอ', 'ตรวจ', { status: 'pending' });
  t.add('n', 'ไม่มี', 'บัญชี', { bankAcct: false });
  assert.throws(() => S.createDeal(t.db, { id: 'p', name: 'รอ ตรวจ', is_admin: false }, terms()), err(403));
  assert.throws(() => S.createDeal(t.db, { id: 'n', name: 'ไม่มี บัญชี', is_admin: false }, terms()), err(403));
  const d = S.createDeal(t.db, t.buyer, terms());
  assert.throws(() => S.sign(t.db, { id: 'n', name: 'x', is_admin: false }, d.id, { agree: true, contractHash: d.contractHash }), err(403));
});

test('counterparty claims the open slot and signs in their legal name', () => {
  const t = setup();
  const d = S.createDeal(t.db, t.buyer, terms());
  assert.equal(S.getDeal(t.db, t.stranger, d.id).prospective, true);
  S.sign(t.db, t.seller, d.id, { agree: true, contractHash: d.contractHash, name: 'ชื่อปลอม' });
  const after = S.getDeal(t.db, t.seller, d.id);
  assert.equal(after.sellerName, 'ผู้ขาย ทดสอบ');
  assert.equal(after.status, 'awaiting_payment');
  assert.throws(() => S.getDeal(t.db, t.stranger, d.id), err(403));
  assert.throws(() => S.sign(t.db, t.seller, S.createDeal(t.db, t.buyer, terms()).id, { agree: true, contractHash: 'stale' }), err(409));
});

test('only the right party can act at each step', () => {
  const t = setup();
  const d = dealAt(t, 'awaiting_payment');
  assert.throws(() => S.createPayment(t.db, t.bank, t.seller, d.id), err(403));
  assert.throws(() => S.ship(t.db, t.seller, d.id, { carrier: 'EMS' }), err(409));
  const f = dealAt(t, 'funded');
  assert.throws(() => S.ship(t.db, t.buyer, f.id, { carrier: 'EMS' }), err(403));
  assert.throws(() => S.confirmReceipt(t.db, t.buyer, f.id, { checked: 1 }), err(409));
  assert.throws(() => S.decide(t.db, t.buyer, f.id, {}), err(403));
});

test('slips: verified with the bank, single use, exact amount, escrow account only', () => {
  const t = setup();
  const d = dealAt(t, 'awaiting_payment');
  const p = S.createPayment(t.db, t.bank, t.buyer, d.id);
  assert.match(p.qrPayload, /^000201010212/);
  const wrongAmount = t.bank.demoTransfer({ amount: 50000, senderName: 'ผู้ซื้อ ท***' });
  assert.throws(() => S.submitSlip(t.db, t.bank, t.buyer, d.id, p.paymentId, { transRef: wrongAmount }), err(400));
  const elsewhere = t.bank.demoTransfer({ amount: 100000, senderName: 'ผู้ซื้อ ท***', receiverId: '0999999999999' });
  assert.throws(() => S.submitSlip(t.db, t.bank, t.buyer, d.id, p.paymentId, { transRef: elsewhere }), err(400));
  const good = t.bank.demoTransfer({ amount: 100000, senderName: 'ผู้ซื้อ ท***' });
  assert.equal(S.submitSlip(t.db, t.bank, t.buyer, d.id, p.paymentId, { transRef: good }).status, 'funded');
  assert.equal(S.ledgerBalance(t.db, d.id), 100000);
  // The same slip cannot pay for another deal.
  const d2 = dealAt(t, 'awaiting_payment');
  const p2 = S.createPayment(t.db, t.bank, t.buyer, d2.id);
  assert.throws(() => S.submitSlip(t.db, t.bank, t.buyer, d2.id, p2.paymentId, { transRef: good }), err(409));
});

test("transfer from someone else's account waits for staff review", () => {
  const t = setup();
  const d = dealAt(t, 'awaiting_payment');
  const { p, deal } = pay(t, d.id, 'นาง สุดา ศ***');
  assert.equal(deal.status, 'awaiting_payment');
  assert.equal(deal.paymentReview.status, 'review');
  assert.equal(S.paymentQueue(t.db, t.admin).length, 1);
  assert.throws(() => S.reviewPayment(t.db, t.buyer, p.paymentId, { approve: true, checked: true }), err(403));
  S.reviewPayment(t.db, t.admin, p.paymentId, { approve: true, checked: true });
  assert.equal(S.getDeal(t.db, t.buyer, d.id).status, 'funded');
});

test('dispute: 5% fee, ruling splits the rest, escrow ends at 0', () => {
  const t = setup();
  const d = dealAt(t, 'shipped');
  S.openDispute(t.db, t.buyer, d.id, { reason: 'damaged', want: 'refund_full', detail: 'จอแตก', agree: true });
  assert.throws(() => S.confirmReceipt(t.db, t.buyer, d.id, { checked: 1 }), err(409));
  assert.throws(() => S.respondDispute(t.db, t.buyer, d.id, { text: 'x' }), err(403));
  S.respondDispute(t.db, t.seller, d.id, { text: 'ส่งไปปกติ' });
  const r = S.decide(t.db, t.admin, d.id, { buyerPercent: 50, reason: 'แบ่งครึ่ง', considered: true });
  assert.deepEqual([r.payout.buyer, r.payout.seller, r.payout.fee], [475, 475, 50]);
  assert.equal(S.ledgerBalance(t.db, d.id), 0);
});

test('accepting a partial-refund claim settles exactly as asked, after the 5% fee', () => {
  const t = setup();
  const d = dealAt(t, 'shipped');
  assert.throws(() => S.openDispute(t.db, t.buyer, d.id, { reason: 'not_as_described', want: 'refund_partial', amount: 960, detail: 'x', agree: true }), err(400));
  S.openDispute(t.db, t.buyer, d.id, { reason: 'not_as_described', want: 'refund_partial', amount: 200, detail: 'มีรอย', agree: true });
  const r = S.acceptClaim(t.db, t.seller, d.id);
  assert.deepEqual([r.payout.buyer, r.payout.seller, r.payout.fee], [200, 750, 50]);
  assert.equal(S.ledgerBalance(t.db, d.id), 0);
});

test('seller cannot dispute before shipping; cancel is blocked after payment', () => {
  const t = setup();
  const f = dealAt(t, 'funded');
  assert.throws(() => S.openDispute(t.db, t.seller, f.id, { reason: 'buyer_silent', want: 'release', detail: 'x', agree: true }), err(409));
  assert.throws(() => S.cancel(t.db, t.buyer, f.id), err(409));
});

test('silent buyer: funds auto-release after the inspection window', () => {
  const t = setup();
  const d = dealAt(t, 'shipped', { inspectionDays: 2 });
  assert.equal(S.sweepExpired(t.db, Date.now() + 1 * S.DAY), 0);
  assert.equal(S.sweepExpired(t.db, Date.now() + 2 * S.DAY + 1000), 1);
  assert.equal(S.getDeal(t.db, t.buyer, d.id).status, 'completed');
  assert.equal(S.ledgerBalance(t.db, d.id), 0);
});

test('audit log is append-only', () => {
  const t = setup();
  const d = dealAt(t, 'shipped');
  assert.throws(() => t.db.exec(`UPDATE events SET text = 'แก้' WHERE deal_id = '${d.id}'`), /append-only/);
  assert.throws(() => t.db.exec(`DELETE FROM events WHERE deal_id = '${d.id}'`), /append-only/);
});

test('input validation rejects bad terms', () => {
  const t = setup();
  assert.throws(() => S.createDeal(t.db, t.buyer, terms({ price: -5 })), err(400));
  assert.throws(() => S.createDeal(t.db, t.buyer, terms({ conditions: [] })), err(400));
  assert.throws(() => S.createDeal(t.db, t.buyer, terms({ agree: false })), err(400));
  assert.throws(() => S.createDeal(t.db, t.admin, terms()), err(403));
});
