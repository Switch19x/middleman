'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../server/accounts');
const ID = require('../server/identity');
const { HttpError } = require('../server/errors');
const { withCheckDigit } = require('../server/seed');
const { setup } = require('./helpers');

const err = (status) => (e) => e instanceof HttpError && e.status === status;
const IMG = 'data:image/png;base64,iVBORw0KGgo=';
const PID = withCheckDigit('120000000123');

test('national ID checksum', () => {
  assert.equal(ID.validNationalId(PID), true);
  assert.equal(ID.validNationalId(PID.slice(0, 12) + ((Number(PID[12]) + 1) % 10)), false);
  assert.equal(ID.validNationalId('123'), false);
});

test('ThaID: first sign-in creates a verified account, later sign-ins reuse it', () => {
  const { db } = setup();
  const a = A.signInWithThaid(db, { pid: PID, given_name: 'สมชาย', family_name: 'ใจดี' });
  const b = A.signInWithThaid(db, { pid: PID, given_name: 'สมชาย', family_name: 'ใจดี' });
  assert.equal(a.created, true);
  assert.equal(b.userId, a.userId);
  assert.equal(A.profile(db, a.userId).kycStatus, 'verified');
});

test('one person, one account: the same ID cannot register twice', () => {
  const { db } = setup();
  A.signInWithThaid(db, { pid: PID, given_name: 'สมชาย', family_name: 'ใจดี' });
  assert.throws(() => A.registerWithIdCard(db, { nationalId: PID, firstName: 'สมชาย', lastName: 'ใจดี', pin: '111111', consent: true, cardImage: IMG, selfieImage: IMG }), err(409));
});

test('ID card photo: pending until staff approve; PIN sign-in with lockout', () => {
  const t = setup();
  const { userId } = A.registerWithIdCard(t.db, { nationalId: PID, firstName: 'สมหญิง', lastName: 'ดีใจ', pin: '246810', consent: true, cardImage: IMG, selfieImage: IMG });
  assert.equal(A.profile(t.db, userId).kycStatus, 'pending');
  assert.throws(() => A.requireEligible(t.db, { id: userId, is_admin: false }), err(403));
  assert.equal(A.kycQueue(t.db, t.admin).length, 1);
  A.reviewKyc(t.db, t.admin, userId, { approve: true, checked: true });
  assert.equal(A.profile(t.db, userId).kycStatus, 'verified');
  assert.equal(A.signInWithPin(t.db, { nationalId: PID, pin: '246810' }).userId, userId);
  for (let i = 0; i < 5; i++) assert.throws(() => A.signInWithPin(t.db, { nationalId: PID, pin: '000000' }), err(401));
  assert.throws(() => A.signInWithPin(t.db, { nationalId: PID, pin: '246810' }), err(429));
});

test('payout account must be in the same name as the ID card', () => {
  const t = setup();
  const { userId } = A.signInWithThaid(t.db, { pid: PID, given_name: 'สมชาย', family_name: 'ใจดี' });
  const user = { id: userId, is_admin: false };
  t.bank.demoRegisterAccount('SCB', '1112223334', 'นางสาว สมศรี ใจดี');
  assert.throws(() => A.setBankAccount(t.db, t.bank, user, { bankCode: 'SCB', accountNo: '1112223334', accountName: 'สมชาย ใจดี' }), err(400));
  const p = A.setBankAccount(t.db, t.bank, user, { bankCode: 'KBANK', accountNo: '123-4-56789-0', accountName: 'นาย สมชาย  ใจดี' });
  assert.equal(p.bank.accountName, 'นาย สมชาย  ใจดี');
  assert.equal(p.canTransact, true);
});

test('slip sender name matching tolerates masked surnames only for the same person', () => {
  assert.equal(ID.senderMatches('นาย สมชาย ใ***', 'สมชาย', 'ใจดี'), true);
  assert.equal(ID.senderMatches('MR. สมชาย ใจดี', 'สมชาย', 'ใจดี'), true);
  assert.equal(ID.senderMatches('นาย สมชาย ร***', 'สมชาย', 'ใจดี'), false);
  assert.equal(ID.senderMatches('นาง สุดา ใ***', 'สมชาย', 'ใจดี'), false);
});
