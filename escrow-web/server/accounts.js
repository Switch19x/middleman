'use strict';
/*
 * Accounts: sign-in is identity verification with the Thai national ID card,
 * either through ThaID (verified instantly) or by card photo + selfie (reviewed
 * by staff). One national ID = one account. Payout accounts must be in the
 * same legal name as the ID card.
 */
const crypto = require('node:crypto');
const { tx } = require('./db');
const { HttpError } = require('./errors');
const ID = require('./identity');
const { BANKS } = require('./bank');

const fail = (status, msg) => { throw new HttpError(status, msg); };
const check = (cond, status, msg) => { if (!cond) fail(status, msg); };
const PIN_MAX_FAILS = 5;
const PIN_LOCK_MS = 15 * 60_000;

const nameField = (v, field) => {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  check(s.length >= 1 && s.length <= 60, 400, `กรุณาระบุ${field}`);
  check(!/[<>]/.test(s), 400, `${field}ไม่ถูกต้อง`);
  return s;
};
const imageField = (v, field) => {
  const s = String(v || '');
  check(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s), 400, `กรุณาแนบ${field}`);
  check(s.length < 1_500_000, 400, `${field}ใหญ่เกินไป`);
  return s;
};
const maskAccount = (no) => 'xxx-x-x' + String(no).slice(-5, -1) + '-' + String(no).slice(-1);

function userRow(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// What the client is allowed to see about the signed-in user.
function profile(db, userId) {
  const u = userRow(db, userId);
  if (!u) return null;
  const bank = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').get(u.id);
  return {
    id: u.id, name: u.name, isAdmin: !!u.is_admin,
    idLast4: u.id_last4, kycMethod: u.kyc_method, kycStatus: u.is_admin ? 'verified' : u.kyc_status, kycNote: u.kyc_note,
    bank: bank && { bankCode: bank.bank_code, bankName: BANKS[bank.bank_code], accountNo: maskAccount(bank.account_no), accountName: bank.account_name },
    canTransact: !u.is_admin && u.kyc_status === 'verified' && !!bank,
  };
}

// Deals require a verified identity and a payout account (both parties may receive money).
function requireEligible(db, user) {
  check(!user.is_admin, 403, 'บัญชีผู้ไกล่เกลี่ยทำรายการซื้อขายไม่ได้');
  const u = userRow(db, user.id);
  check(u && u.kyc_status === 'verified', 403, u && u.kyc_status === 'pending'
    ? 'บัญชีของคุณอยู่ระหว่างตรวจสอบตัวตน จะทำรายการได้เมื่อได้รับการอนุมัติ'
    : 'กรุณายืนยันตัวตนด้วยบัตรประชาชนก่อนทำรายการ');
  check(db.prepare('SELECT 1 FROM bank_accounts WHERE user_id = ?').get(user.id), 403, 'กรุณาเพิ่มบัญชีรับเงินที่เป็นชื่อเดียวกับบัตรประชาชนก่อนทำรายการ');
  return u;
}

function newUserId() { return 'u_' + crypto.randomBytes(6).toString('base64url'); }

// ThaID claims are already verified by DOPA: create or sign in the one account for this ID.
function signInWithThaid(db, claims, now = Date.now()) {
  check(ID.validNationalId(claims.pid), 400, 'เลขประจำตัวประชาชนจาก ThaID ไม่ถูกต้อง');
  const first = nameField(claims.given_name, 'ชื่อ');
  const last = nameField(claims.family_name, 'นามสกุล');
  const hash = ID.nationalIdHash(claims.pid);
  return tx(db, () => {
    const existing = db.prepare('SELECT * FROM users WHERE national_id_hash = ?').get(hash);
    if (existing) {
      // ThaID is authoritative: it also completes a pending card-photo review.
      if (existing.kyc_status !== 'verified') {
        db.prepare("UPDATE users SET kyc_status = 'verified', kyc_method = 'thaid', kyc_at = ?, kyc_note = NULL, first_name = ?, last_name = ?, name = ? WHERE id = ?")
          .run(now, first, last, `${first} ${last}`, existing.id);
      }
      return { userId: existing.id, created: false };
    }
    const id = newUserId();
    db.prepare(`INSERT INTO users (id, name, first_name, last_name, national_id_hash, id_last4, kyc_method, kyc_status, kyc_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, `${first} ${last}`, first, last, hash, ID.cleanId(claims.pid).slice(-4), 'thaid', 'verified', now, now);
    return { userId: id, created: true };
  });
}

// Card photo + selfie: account is created in "pending" until staff compare the photos.
function registerWithIdCard(db, input, now = Date.now()) {
  check(ID.validNationalId(input.nationalId), 400, 'เลขประจำตัวประชาชนไม่ถูกต้อง');
  const first = nameField(input.firstName, 'ชื่อ');
  const last = nameField(input.lastName, 'นามสกุล');
  check(/^\d{6}$/.test(String(input.pin || '')), 400, 'PIN ต้องเป็นตัวเลข 6 หลัก');
  check(input.consent === true, 400, 'กรุณายินยอมให้ตรวจสอบข้อมูลส่วนบุคคล');
  const card = imageField(input.cardImage, 'รูปบัตรประชาชน');
  const selfie = imageField(input.selfieImage, 'รูปถ่ายคู่บัตร');
  const hash = ID.nationalIdHash(input.nationalId);
  return tx(db, () => {
    check(!db.prepare('SELECT 1 FROM users WHERE national_id_hash = ?').get(hash), 409,
      'เลขบัตรนี้มีบัญชีอยู่แล้ว (1 คนมีได้ 1 บัญชี) กรุณาเข้าสู่ระบบด้วย ThaID หรือ PIN');
    const id = newUserId();
    db.prepare(`INSERT INTO users (id, name, first_name, last_name, national_id_hash, id_last4, kyc_method, kyc_status, pin_hash, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, `${first} ${last}`, first, last, hash, ID.cleanId(input.nationalId).slice(-4), 'id_card', 'pending', ID.hashPin(input.pin), now);
    db.prepare('INSERT INTO kyc_documents (user_id, card_image, selfie_image, submitted_at) VALUES (?,?,?,?)').run(id, card, selfie, now);
    return { userId: id };
  });
}

function signInWithPin(db, input, now = Date.now()) {
  const generic = 'เลขบัตรหรือ PIN ไม่ถูกต้อง';
  check(ID.validNationalId(input.nationalId), 401, generic);
  const u = db.prepare('SELECT * FROM users WHERE national_id_hash = ?').get(ID.nationalIdHash(input.nationalId));
  check(u && u.pin_hash, 401, generic);
  check(!u.pin_locked_until || u.pin_locked_until < now, 429, 'ใส่ PIN ผิดหลายครั้ง กรุณารอ 15 นาที หรือเข้าสู่ระบบด้วย ThaID');
  if (!ID.verifyPin(String(input.pin || ''), u.pin_hash)) {
    const fails = u.pin_fails + 1;
    db.prepare('UPDATE users SET pin_fails = ?, pin_locked_until = ? WHERE id = ?')
      .run(fails >= PIN_MAX_FAILS ? 0 : fails, fails >= PIN_MAX_FAILS ? now + PIN_LOCK_MS : null, u.id);
    fail(401, generic);
  }
  db.prepare('UPDATE users SET pin_fails = 0, pin_locked_until = NULL WHERE id = ?').run(u.id);
  return { userId: u.id };
}

// Staff queue for card-photo verification.
function kycQueue(db, user) {
  check(user.is_admin, 403, 'เฉพาะทีมงาน');
  return db.prepare(`SELECT u.id, u.name, u.first_name, u.last_name, u.id_last4, k.card_image, k.selfie_image, k.submitted_at
      FROM users u JOIN kyc_documents k ON k.user_id = u.id WHERE u.kyc_status = 'pending' ORDER BY k.submitted_at`).all()
    .map((r) => ({ userId: r.id, name: r.name, firstName: r.first_name, lastName: r.last_name, idLast4: r.id_last4, cardImage: r.card_image, selfieImage: r.selfie_image, submittedAt: r.submitted_at }));
}

function reviewKyc(db, user, userId, input, now = Date.now()) {
  check(user.is_admin, 403, 'เฉพาะทีมงาน');
  return tx(db, () => {
    const u = userRow(db, userId);
    check(u && u.kyc_status === 'pending', 404, 'ไม่พบคำขอที่รอตรวจสอบ');
    if (input.approve === true) {
      check(input.checked === true, 400, 'กรุณายืนยันว่าตรวจสอบรูปบัตร ชื่อ และใบหน้าแล้ว');
      db.prepare("UPDATE users SET kyc_status = 'verified', kyc_at = ?, kyc_note = NULL WHERE id = ?").run(now, userId);
    } else {
      const note = String(input.note || '').trim();
      check(note.length >= 3 && note.length <= 300, 400, 'กรุณาระบุเหตุผลที่ไม่อนุมัติ');
      // Free the ID so the person can try again (e.g. with a clearer photo or via ThaID).
      db.prepare("UPDATE users SET kyc_status = 'rejected', kyc_note = ?, national_id_hash = NULL WHERE id = ?").run(note, userId);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    }
    db.prepare('UPDATE kyc_documents SET reviewed_by = ?, reviewed_at = ? WHERE user_id = ?').run(user.id, now, userId);
    return { ok: true };
  });
}

// Payout account: holder name (from the bank) must equal the legal name on the ID card.
function setBankAccount(db, bank, user, input, now = Date.now()) {
  const u = userRow(db, user.id);
  check(u && !u.is_admin, 403, 'บัญชีนี้ไม่มีบัญชีรับเงิน');
  check(u.kyc_status === 'verified', 403, 'กรุณายืนยันตัวตนให้เสร็จก่อนเพิ่มบัญชีรับเงิน');
  check(Object.hasOwn(BANKS, input.bankCode), 400, 'กรุณาเลือกธนาคาร');
  const accountNo = String(input.accountNo || '').replace(/\D/g, '');
  check(/^\d{10,15}$/.test(accountNo), 400, 'เลขบัญชีไม่ถูกต้อง');
  const holder = bank.lookupAccountName(input.bankCode, accountNo, String(input.accountName || '').trim());
  check(holder, 400, 'ไม่พบบัญชีนี้ในระบบธนาคาร');
  check(ID.namesMatch(holder, u.first_name, u.last_name), 400,
    `ชื่อบัญชี “${holder}” ไม่ตรงกับชื่อบนบัตรประชาชน (${u.first_name} ${u.last_name}) ต้องเป็นบัญชีของคุณเองเท่านั้น`);
  db.prepare(`INSERT INTO bank_accounts (user_id, bank_code, account_no, account_name, verified_at) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET bank_code = excluded.bank_code, account_no = excluded.account_no, account_name = excluded.account_name, verified_at = excluded.verified_at`)
    .run(u.id, input.bankCode, accountNo, holder, now);
  return profile(db, u.id);
}

module.exports = { profile, requireEligible, signInWithThaid, registerWithIdCard, signInWithPin, kycQueue, reviewKyc, setBankAccount, maskAccount, userRow };
