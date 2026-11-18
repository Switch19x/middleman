'use strict';
/*
 * Bank adapter: no payment gateway. Buyers transfer straight into the escrow
 * bank account by PromptPay QR, then submit the slip. We verify the slip with
 * the bank that holds the escrow account (slip-verification / statement API),
 * so there is no per-transaction PSP fee.
 *
 * This mock keeps the same interface a real adapter needs:
 *   escrow                    – where buyers pay (shown on the payment screen)
 *   promptPayPayload(satang)  – Thai QR (EMVCo) string for an exact amount
 *   verifySlip(transRef)      – what the bank says about a transfer, or null
 *   lookupAccountName(...)    – registered holder name of a payout account
 * plus demo-only helpers that stand in for the buyer's banking app.
 */
const crypto = require('node:crypto');

const BANKS = {
  KBANK: 'กสิกรไทย', SCB: 'ไทยพาณิชย์', BBL: 'กรุงเทพ', KTB: 'กรุงไทย', BAY: 'กรุงศรีอยุธยา',
  TTB: 'ทหารไทยธนชาต', GSB: 'ออมสิน', BAAC: 'ธ.ก.ส.', UOB: 'ยูโอบี', CIMB: 'ซีไอเอ็มบี ไทย', KKP: 'เกียรตินาคินภัทร', LHB: 'แลนด์ แอนด์ เฮ้าส์',
};

// ---------- Thai QR (EMVCo merchant-presented) ----------
const tlv = (tag, value) => tag + String(value.length).padStart(2, '0') + value;
function crc16(str) {
  let crc = 0xffff;
  for (const byte of Buffer.from(str, 'utf8')) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
// PromptPay to a 13-digit tax/citizen ID with a fixed amount.
function promptPayPayload(promptPayId, satang) {
  const target = tlv('00', 'A000000677010111') + tlv('02', promptPayId);
  const body = tlv('00', '01') + tlv('01', '12') + tlv('29', target) + tlv('53', '764') +
    tlv('54', (satang / 100).toFixed(2)) + tlv('58', 'TH') + '6304';
  return body + crc16(body);
}

function createMockBank({
  promptPayId = process.env.ESCROW_PROMPTPAY_ID || '0105500000000',
  bankName = 'กสิกรไทย',
  accountName = 'บจก. มิดเดิลแมน (บัญชีพักเงินลูกค้า)',
} = {}) {
  const transfers = new Map(); // transRef -> what the bank recorded
  const registry = new Map();  // `${bank}:${account}` -> holder name (demo)
  return {
    name: 'mock',
    escrow: { bankName, accountName, promptPayId },
    promptPayPayload: (satang) => promptPayPayload(promptPayId, satang),

    verifySlip(transRef) {
      const t = transfers.get(String(transRef || '').trim());
      return t ? { ...t } : null;
    },

    // Real adapters call the bank's account-name inquiry (e.g. ITMX / PromptPay lookup).
    // The mock answers from its registry, or echoes the declared name for unknown accounts.
    lookupAccountName(bankCode, accountNo, declaredName) {
      return registry.get(`${bankCode}:${accountNo}`) ?? declaredName ?? null;
    },

    // ---------- demo-only: stand-ins for the outside world ----------
    demoRegisterAccount(bankCode, accountNo, holder) { registry.set(`${bankCode}:${accountNo}`, holder); },
    demoTransfer({ amount, senderName, receiverId = promptPayId, ts = Date.now() }) {
      const transRef = 'DEMO' + crypto.randomBytes(6).toString('hex').toUpperCase();
      transfers.set(transRef, { transRef, amount, senderName, receiverId, ts });
      return transRef;
    },
  };
}

module.exports = { createMockBank, promptPayPayload, crc16, BANKS };
