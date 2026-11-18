'use strict';
/*
 * Identity helpers: Thai national ID validation, one-account-per-person hashing,
 * legal-name matching for payout accounts, PIN hashing, and a ThaID adapter.
 */
const crypto = require('node:crypto');

const ID_SECRET = process.env.ID_HASH_SECRET || 'dev-id-hash-secret';

// 13 digits; the last is a mod-11 check digit.
function validNationalId(id) {
  const s = String(id || '').replace(/\D/g, '');
  if (!/^[1-8]\d{12}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(s[12]);
}
const cleanId = (id) => String(id || '').replace(/\D/g, '');
// Keyed hash: lets us enforce uniqueness without storing the ID itself.
const nationalIdHash = (id) => crypto.createHmac('sha256', ID_SECRET).update(cleanId(id)).digest('hex');

// "นาย ณัฐ  ศรีสุข" / "MR. NAT SRISUK" -> comparable form.
const TITLES = /^(นาย|นางสาว|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง|mr\.?|mrs\.?|ms\.?|miss)\s*/i;
function normalizeName(s) {
  return String(s || '').normalize('NFC').trim().replace(TITLES, '').replace(/[\s.\-]+/g, '').toLowerCase();
}
// Account holder name must be the same person as on the ID card.
function namesMatch(accountName, firstName, lastName) {
  return normalizeName(accountName) === normalizeName(`${firstName}${lastName}`);
}
// Bank slips often mask the surname ("ณัฐ ศ***"): require the first name and the surname's visible prefix.
function senderMatches(senderName, firstName, lastName) {
  const parts = String(senderName || '').trim().replace(TITLES, '').split(/\s+/);
  const first = normalizeName(parts[0]);
  const lastVisible = normalizeName((parts.slice(1).join('') || '').replace(/[*xX•]+$/, ''));
  return first === normalizeName(firstName) && normalizeName(lastName).startsWith(lastVisible);
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  return salt.toString('hex') + ':' + crypto.scryptSync(String(pin), salt, 32).toString('hex');
}
function verifyPin(pin, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const got = crypto.scryptSync(String(pin), Buffer.from(salt, 'hex'), 32);
  return crypto.timingSafeEqual(got, Buffer.from(hash, 'hex'));
}

/*
 * ThaID (DOPA) is an OpenID Connect provider: we redirect to its authorize URL,
 * it returns a code, we exchange the code for verified claims (pid, names).
 * The mock keeps that shape; its "authorize" page is a demo screen in our app.
 */
function createMockThaid() {
  const states = new Map(); // state -> expiry
  const codes = new Map();  // code -> claims
  return {
    name: 'mock',
    start() {
      const state = crypto.randomBytes(12).toString('base64url');
      states.set(state, Date.now() + 10 * 60_000);
      return { state, url: `#/thaid?state=${state}` };
    },
    // Demo-only: what the ThaID app would do after the citizen consents.
    demoAuthorize({ state, pid, firstName, lastName }) {
      if (!states.has(state)) throw Object.assign(new Error('state ไม่ถูกต้องหรือหมดอายุ'), { status: 400 });
      const code = crypto.randomBytes(16).toString('base64url');
      codes.set(code, { state, pid: cleanId(pid), given_name: String(firstName || '').trim(), family_name: String(lastName || '').trim() });
      return code;
    },
    exchange(code, state) {
      const c = codes.get(code);
      codes.delete(code);
      const exp = states.get(state);
      states.delete(state);
      if (!c || c.state !== state || !exp || exp < Date.now()) throw Object.assign(new Error('การยืนยันตัวตนกับ ThaID ไม่สำเร็จ'), { status: 401 });
      return { pid: c.pid, given_name: c.given_name, family_name: c.family_name };
    },
  };
}

module.exports = { validNationalId, cleanId, nationalIdHash, normalizeName, namesMatch, senderMatches, hashPin, verifyPin, createMockThaid };
