'use strict';
// Demo users + sample deals, built by replaying real commands with back-dated
// timestamps so the ledger, audit chain and states are all genuine.
const zlib = require('node:zlib');
const S = require('./service');
const ID = require('./identity');

// Fictitious citizens. National IDs are generated with a valid check digit.
function withCheckDigit(d12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d12[i]) * (13 - i);
  return d12 + ((11 - (sum % 11)) % 10);
}
const DEMO_PIN = '123456';
const USERS = [
  { id: 'u_nat', first: 'ณัฐ', last: 'ศรีสุข', pid: withCheckDigit('110170012345'), method: 'thaid', status: 'verified',
    bank: { code: 'KBANK', no: '0481234567', holder: 'นาย ณัฐ ศรีสุข' } },
  { id: 'u_mali', first: 'มะลิ', last: 'วงศ์ทอง', pid: withCheckDigit('350990045678'), method: 'id_card', status: 'verified',
    bank: { code: 'SCB', no: '4129876543', holder: 'น.ส. มะลิ วงศ์ทอง' } },
  { id: 'u_kong', first: 'ก้อง', last: 'ใจดี', pid: withCheckDigit('171000078901'), method: 'id_card', status: 'pending' },
  { id: 'u_admin', name: 'ทีมระงับข้อพิพาท', admin: true },
];

// Tiny placeholder images for the pending KYC review (stand-ins for real photos).
function png(w, h, paint) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(paint(x, y), y * (w * 3 + 1) + 1 + x * 3);
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return 'data:image/png;base64,' + Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}
const cardImage = () => png(170, 108, (x, y) => {
  if (x > 10 && x < 52 && y > 30 && y < 86) return [150, 150, 150];               // photo
  if (y > 12 && y < 20 && x > 10 && x < 120) return [60, 90, 140];                 // header
  if ((y - 34) % 12 < 4 && y > 30 && y < 90 && x > 62 && x < 150) return [90, 90, 90]; // text lines
  return [214, 228, 240];
});
const selfieImage = () => png(108, 140, (x, y) => {
  const dx = x - 54, dy = y - 50;
  if (dx * dx + dy * dy < 26 * 26) return [210, 170, 140];                          // face
  if (y > 92 && x > 40 && x < 100 && y < 128) return [214, 228, 240];               // card held up
  return [235, 235, 235];
});

function seed(db, bank, now = Date.now()) {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return false;
  const insUser = db.prepare(`INSERT INTO users (id, name, first_name, last_name, national_id_hash, id_last4, kyc_method, kyc_status, kyc_at, pin_hash, is_admin, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insBank = db.prepare('INSERT INTO bank_accounts (user_id, bank_code, account_no, account_name, verified_at) VALUES (?,?,?,?,?)');
  const u = {};
  for (const x of USERS) {
    if (x.admin) {
      insUser.run(x.id, x.name, null, null, null, null, null, 'verified', now, null, 1, now);
      u[x.id] = { id: x.id, name: x.name, is_admin: true };
      continue;
    }
    const name = `${x.first} ${x.last}`;
    insUser.run(x.id, name, x.first, x.last, ID.nationalIdHash(x.pid), x.pid.slice(-4), x.method, x.status,
      x.status === 'verified' ? now : null, x.method === 'id_card' ? ID.hashPin(DEMO_PIN) : null, 0, now - 30 * S.DAY);
    if (x.bank) {
      bank.demoRegisterAccount(x.bank.code, x.bank.no, x.bank.holder);
      insBank.run(x.id, x.bank.code, x.bank.no, x.bank.holder, now);
    }
    u[x.id] = { id: x.id, name, is_admin: false };
  }
  db.prepare('INSERT INTO kyc_documents (user_id, card_image, selfie_image, submitted_at) VALUES (?,?,?,?)')
    .run('u_kong', cardImage(), selfieImage(), now - 0.2 * S.DAY);

  const nat = u.u_nat, mali = u.u_mali;
  const at = (days) => now - days * S.DAY;
  // Buyer transfers by PromptPay, then submits the slip; the bank verifies it.
  const pay = (dealId, days, sender = 'นาย ณัฐ ศ***') => {
    const p = S.createPayment(db, bank, nat, dealId, at(days));
    const transRef = bank.demoTransfer({ amount: S.toSatang(p.amount), senderName: sender, ts: at(days) });
    return S.submitSlip(db, bank, nat, dealId, p.paymentId, { transRef }, at(days));
  };
  const signAs = (who, d, days) => S.sign(db, who, d.id, { agree: true, contractHash: d.contractHash }, at(days));
  const base = { category: 'goods', deliveryDays: 3, inspectionDays: 3, agree: true };

  // 1. Shipped, waiting for the buyer to inspect
  let d = S.createDeal(db, mali, { ...base, myRole: 'seller', counterName: 'คุณณัฐ', price: 28500,
    title: 'iPhone 15 Pro 256GB สีไทเทเนียม (มือสอง)', description: 'เครื่องศูนย์ไทย แบต 92% ไม่เคยแกะซ่อม มีกล่องและสายชาร์จครบ',
    conditions: ['สุขภาพแบตเตอรี่ไม่ต่ำกว่า 90%', 'ไม่ติด iCloud / ลงชื่อออกแล้ว', 'ไม่มีรอยแตกที่หน้าจอ', 'ได้รับกล่องและสายชาร์จ'] }, at(4.2), { code: 'MM-4821' });
  signAs(nat, d, 4); pay(d.id, 3.8);
  S.ship(db, mali, d.id, { carrier: 'Kerry Express', tracking: 'KEX1234567890', note: 'แพ็คกันกระแทก 2 ชั้น' }, at(1.5));
  S.postMessage(db, mali, d.id, { text: 'ส่งของให้แล้วนะคะ น่าจะถึงพรุ่งนี้' }, at(1.5));
  S.postMessage(db, nat, d.id, { text: 'ขอบคุณครับ ได้รับแล้วจะเช็คแล้วกดยืนยันให้ครับ' }, at(1.4));

  // 2. Signed by both; the buyer paid from someone else's account, so the slip waits for staff review
  d = S.createDeal(db, nat, { ...base, myRole: 'buyer', counterName: 'คุณมะลิ', price: 4000, category: 'service', deliveryDays: 7,
    title: 'จ้างออกแบบโลโก้ร้านกาแฟ (3 แบบ + แก้ 2 ครั้ง)', description: 'ส่งไฟล์ AI, PNG, SVG ภายใน 7 วันหลังชำระเงิน',
    conditions: ['ส่งแบบร่าง 3 แบบ', 'แก้ไขได้ 2 ครั้ง', 'ส่งไฟล์ต้นฉบับ AI / SVG / PNG', 'โอนลิขสิทธิ์ให้ผู้ว่าจ้าง'] }, at(0.3), { code: 'MM-3307' });
  signAs(mali, d, 0.1);
  pay(d.id, 0.05, 'นาง สุดา ศ***');

  // 3. In dispute, seller has responded — ready for a ruling
  d = S.createDeal(db, mali, { ...base, myRole: 'seller', counterName: 'คุณณัฐ', price: 21000,
    title: 'กล้อง Fujifilm X-T30 + เลนส์ 18-55mm', description: 'ชัตเตอร์ 8,xxx เลนส์ใส ไม่มีฝ้าไม่มีรา',
    conditions: ['ชัตเตอร์ไม่เกิน 10,000', 'เลนส์ไม่มีฝ้า ไม่มีรา', 'ใช้งานได้ปกติทุกปุ่ม'] }, at(9.2), { code: 'MM-1964' });
  signAs(nat, d, 9); pay(d.id, 8.8);
  S.ship(db, mali, d.id, { carrier: 'Flash Express', tracking: 'TH0198273645' }, at(6));
  S.openDispute(db, nat, d.id, { reason: 'not_as_described', want: 'refund_full', agree: true,
    detail: 'เลนส์มีราเป็นจุดชัดเจนเมื่อส่องไฟ ซึ่งในข้อตกลงระบุว่า “ไม่มีฝ้าไม่มีรา”',
    evidence: [{ name: 'lens-fungus.jpg' }, { name: 'unboxing.mp4' }] }, at(2));
  S.respondDispute(db, mali, d.id, { text: 'ตอนส่งเลนส์ใสปกติ มีคลิปก่อนแพ็ค อาจเกิดระหว่างขนส่งหรือเป็นฝุ่น ยินดีคืนเงินบางส่วน 2,000 บาท',
    evidence: [{ name: 'before-packing.mp4' }] }, at(1));

  // 4. Completed
  d = S.createDeal(db, nat, { ...base, myRole: 'buyer', counterName: 'คุณมะลิ', price: 6800, category: 'digital',
    title: 'บัตรคอนเสิร์ต 2 ใบ โซน B', description: 'โอนชื่อในแอปผู้จัดงาน',
    conditions: ['โอนบัตรผ่านแอปอย่างเป็นทางการ', 'ที่นั่งติดกัน 2 ใบ'] }, at(20), { code: 'MM-0815' });
  signAs(mali, d, 19.8); pay(d.id, 19.5);
  S.ship(db, mali, d.id, { carrier: 'ส่งไฟล์ / งานดิจิทัล', tracking: '-', note: 'โอนบัตรแล้ว' }, at(19));
  S.confirmReceipt(db, nat, d.id, { checked: 2 }, at(18.5));

  // 5. Created by the buyer; seller slot still open (join with code MM-5550)
  S.createDeal(db, nat, { ...base, myRole: 'buyer', counterName: 'คุณมะลิ', price: 9900,
    title: 'Nintendo Switch OLED + จอย Pro', description: 'ประกันเหลือ 5 เดือน',
    conditions: ['ประกันศูนย์เหลืออย่างน้อย 4 เดือน', 'จอย Pro ใช้งานได้ปกติ'] }, at(0.05), { code: 'MM-5550' });

  return true;
}

module.exports = { seed, USERS, DEMO_PIN, withCheckDigit };
