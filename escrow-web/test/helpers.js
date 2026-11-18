'use strict';
const { open } = require('../server/db');
const { createMockBank } = require('../server/bank');
const ID = require('../server/identity');
const { withCheckDigit } = require('../server/seed');

// Verified users with same-name payout accounts, ready to trade.
function setup() {
  const db = open(':memory:');
  const bank = createMockBank();
  const users = {};
  const add = (id, first, last, { admin = false, pid, status = 'verified', bankAcct = true } = {}) => {
    db.prepare(`INSERT INTO users (id, name, first_name, last_name, national_id_hash, id_last4, kyc_method, kyc_status, is_admin, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,0)`).run(id, `${first} ${last}`, admin ? null : first, admin ? null : last,
      pid ? ID.nationalIdHash(pid) : null, pid ? pid.slice(-4) : null, admin ? null : 'thaid', status, admin ? 1 : 0);
    if (bankAcct && !admin) db.prepare('INSERT INTO bank_accounts VALUES (?,?,?,?,0)').run(id, 'KBANK', '0000000000', `${first} ${last}`);
    users[id] = { id, name: `${first} ${last}`, is_admin: admin };
  };
  add('b', 'ผู้ซื้อ', 'ทดสอบ', { pid: withCheckDigit('110000000001') });
  add('s', 'ผู้ขาย', 'ทดสอบ', { pid: withCheckDigit('110000000002') });
  add('x', 'คนอื่น', 'ทดสอบ', { pid: withCheckDigit('110000000003') });
  add('a', 'แอดมิน', '-', { admin: true });
  return { db, bank, buyer: users.b, seller: users.s, stranger: users.x, admin: users.a, add };
}

module.exports = { setup };
