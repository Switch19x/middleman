'use strict';
// SQLite storage via Node's built-in driver (no native deps).
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_VERSION = 2;
const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- One person = one account: national_id_hash is UNIQUE. The raw 13-digit ID is
-- never stored, only a keyed hash (for uniqueness) and the last 4 digits (for display).
CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,                -- legal name from the ID card
  first_name       TEXT,
  last_name        TEXT,
  national_id_hash TEXT UNIQUE,
  id_last4         TEXT,
  kyc_method       TEXT CHECK (kyc_method IN ('thaid','id_card')),
  kyc_status       TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
  kyc_note         TEXT,
  kyc_at           INTEGER,
  pin_hash         TEXT,                         -- sign-in for ID-card users (scrypt)
  pin_fails        INTEGER NOT NULL DEFAULT 0,
  pin_locked_until INTEGER,
  is_admin         INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL
);

-- Photos submitted for manual KYC review (ID card + selfie holding the card).
CREATE TABLE IF NOT EXISTS kyc_documents (
  user_id      TEXT PRIMARY KEY REFERENCES users(id),
  card_image   TEXT NOT NULL,
  selfie_image TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  reviewed_by  TEXT,
  reviewed_at  INTEGER
);

-- Payout account. The holder name comes from the bank's account-name lookup and
-- must match the legal name on the ID card.
CREATE TABLE IF NOT EXISTS bank_accounts (
  user_id      TEXT PRIMARY KEY REFERENCES users(id),
  bank_code    TEXT NOT NULL,
  account_no   TEXT NOT NULL,
  account_name TEXT NOT NULL,
  verified_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);

-- Money is stored in satang (integer) to avoid floating-point drift.
CREATE TABLE IF NOT EXISTS deals (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL CHECK (category IN ('goods','service','digital')),
  price            INTEGER NOT NULL CHECK (price > 0),
  delivery_days    INTEGER NOT NULL,
  inspection_days  INTEGER NOT NULL,
  conditions       TEXT NOT NULL,               -- JSON array of strings
  contract_hash    TEXT NOT NULL,               -- SHA-256 of the immutable terms
  created_by       TEXT NOT NULL CHECK (created_by IN ('buyer','seller')),
  buyer_id         TEXT REFERENCES users(id),
  seller_id        TEXT REFERENCES users(id),
  buyer_name       TEXT NOT NULL,
  seller_name      TEXT NOT NULL,
  buyer_signed_at  INTEGER,
  seller_signed_at INTEGER,
  status           TEXT NOT NULL,
  payment          TEXT,                        -- JSON {method, amount, transRef, ts}
  shipment         TEXT,                        -- JSON {carrier, tracking, note, evidence, ts}
  payout           TEXT,                        -- JSON {buyer, seller, fee, ts}
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS deals_buyer  ON deals(buyer_id);
CREATE INDEX IF NOT EXISTS deals_seller ON deals(seller_id);
CREATE INDEX IF NOT EXISTS deals_status ON deals(status);

-- Direct bank transfers (PromptPay) into the escrow account; no payment gateway.
-- A slip's bank transaction reference can only ever be used once.
CREATE TABLE IF NOT EXISTS payments (
  id           TEXT PRIMARY KEY,
  deal_id      TEXT NOT NULL REFERENCES deals(id),
  method       TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('pending','review','succeeded','rejected','refund_due')),
  trans_ref    TEXT UNIQUE,
  slip_image   TEXT,
  bank_result  TEXT,                            -- JSON from the bank's slip verification
  review_note  TEXT,
  created_at   INTEGER NOT NULL,
  confirmed_at INTEGER
);

-- Transfers out of the escrow account, to the verified account on file.
CREATE TABLE IF NOT EXISTS payouts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id      TEXT NOT NULL REFERENCES deals(id),
  user_id      TEXT NOT NULL REFERENCES users(id),
  kind         TEXT NOT NULL CHECK (kind IN ('release','refund')),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  bank_code    TEXT NOT NULL,
  account_no   TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent')),
  created_at   INTEGER NOT NULL
);

-- Every movement of money for a deal. Escrow balance = deposits - everything paid out.
CREATE TABLE IF NOT EXISTS ledger (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id  TEXT NOT NULL REFERENCES deals(id),
  type     TEXT NOT NULL CHECK (type IN ('deposit','release','refund','fee')),
  amount   INTEGER NOT NULL CHECK (amount >= 0),
  ts       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS disputes (
  deal_id           TEXT PRIMARY KEY REFERENCES deals(id),
  opened_by         TEXT NOT NULL,
  reason            TEXT NOT NULL,
  detail            TEXT NOT NULL,
  want              TEXT NOT NULL,
  amount            INTEGER NOT NULL DEFAULT 0,
  evidence          TEXT NOT NULL DEFAULT '[]',
  opened_at         INTEGER NOT NULL,
  response_text     TEXT,
  response_evidence TEXT,
  responded_at      INTEGER,
  decision          TEXT                         -- JSON {buyer, seller, fee, reason, by, ts}
);

CREATE TABLE IF NOT EXISTS messages (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id TEXT NOT NULL REFERENCES deals(id),
  who     TEXT NOT NULL,
  user_id TEXT,
  text    TEXT NOT NULL,
  ts      INTEGER NOT NULL
);

-- Append-only, hash-chained audit log: editing any row breaks the chain.
CREATE TABLE IF NOT EXISTS events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id   TEXT NOT NULL REFERENCES deals(id),
  who       TEXT NOT NULL,
  user_id   TEXT,
  text      TEXT NOT NULL,
  ts        INTEGER NOT NULL,
  prev_hash TEXT NOT NULL,
  hash      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_deal ON events(deal_id, id);
CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events
  BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events
  BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
`;

function open(file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'middleman.db')) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  // Silence the "SQLite is experimental" warning once; everything else still prints.
  const emit = process.emitWarning;
  process.emitWarning = (w, ...rest) => (String(w).includes('SQLite') ? undefined : emit.call(process, w, ...rest));
  const db = new DatabaseSync(file);
  process.emitWarning = emit;
  const version = db.prepare('PRAGMA user_version').get().user_version;
  const hasTables = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (hasTables && version !== SCHEMA_VERSION) {
    throw new Error(`Database schema is v${version}, expected v${SCHEMA_VERSION}. Run \`npm run reset\` (demo data will be re-seeded).`);
  }
  db.exec(SCHEMA);
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  return db;
}

// Run fn inside a write transaction; roll back on any throw.
function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { open, tx };
