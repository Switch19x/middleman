# Middleman — Escrow web app

Mobile-first escrow: both parties sign a contract, the buyer's money is held, the seller ships,
the buyer inspects, then funds are released — or a mediator rules on a dispute.
Everyone signs in with their Thai national ID card (ThaID, or a card photo reviewed by staff);
one person can have only one account, and money is only paid out to a bank account in the
same name as the ID card.

Requires Node.js ≥ 22.13 (uses the built-in `node:sqlite`). No `npm install` needed.

```bash
npm start        # http://localhost:5178 (demo mode, seeds sample data on first run)
npm test         # state-machine + HTTP API tests
npm run reset    # delete the local database (re-seeds on next start)
```

## Layout

| Path | What |
| --- | --- |
| `public/` | Frontend (vanilla JS, no build step) |
| `server/service.js` | Escrow rules: state machine, who may act, how money moves, fees |
| `server/accounts.js` | Sign-in via ID card (ThaID / card photo + PIN), KYC review, payout account |
| `server/identity.js` | National ID checksum + keyed hash, name matching, PIN hashing, ThaID adapter (mock) |
| `server/bank.js` | Escrow bank account: PromptPay QR, slip verification, account-name lookup (mock) |
| `server/db.js` | SQLite schema (money in satang, append-only audit log) |
| `server/app.js` | HTTP API, sessions, static files, security headers |
| `server/seed.js` | Demo users and deals, created by replaying real commands |

## Fees and payment

- Service fee is **3% of the contract price, deducted from it** — the buyer pays exactly the price,
  the seller receives 97%.
- Once a dispute is opened the fee becomes **5% of the price**; it is taken first and the remaining
  95% is allocated by the settlement or ruling (both parties bear it in proportion to what they get).
- Cancelling before payment is free.
- **No payment gateway.** The buyer transfers by PromptPay QR straight into the escrow bank account,
  then submits the slip. The server asks the bank about that transaction reference and credits
  escrow only if the amount, the receiving account and the sender's name all match. A slip
  reference can be used once. Anything the bank cannot auto-match goes to a staff review queue.

## Demo accounts

`npm start` seeds fictitious users: ณัฐ ศรีสุข (ThaID), มะลิ วงศ์ทอง (card photo; PIN `123456`),
ก้อง ใจดี (card photo, waiting for review), and the dispute team. The sign-in screen has a
"demo mode" list to switch between them, and a stand-in ThaID consent screen.

## Guarantees enforced on the server

- Sign-in only via the national ID card; the 13-digit ID (checksum-validated) is stored as a keyed
  hash with a UNIQUE constraint, so one person = one account. The full ID is never stored.
- Card-photo accounts can sign in but cannot trade until staff approve them; PIN sign-in locks
  for 15 minutes after 5 wrong attempts.
- Trading (creating or signing a deal) requires a verified identity and a payout account whose
  bank-registered holder name matches the name on the ID card. Contracts are signed in that legal name.
- Payouts are queued to the account on file at settlement time (`payouts` table).
- Only the right party can act at each step (buyer pays/confirms, seller ships, admin rules).
- Money is recognised only after the bank verifies the slip (or staff confirm it against the statement).
- Every payout leaves the deal's escrow balance at exactly ฿0 (`ledger` table).
- The audit log is hash-chained and protected by triggers against UPDATE/DELETE.
- Contracts are identified by a SHA-256 of their terms; signing requires the current hash.
- Silent buyers: funds auto-release after the inspection window.

## Not production-ready yet

- **ThaID** is mocked. Production needs registration as a relying party with DOPA (กรมการปกครอง)
  and the real OpenID Connect endpoints in `identity.js`.
- **Card-photo KYC** relies on staff eyeballing photos. Add liveness / face match (e.g. NDID or a
  KYC vendor) and DOPA card-status checks (laser code) before going live.
- **Bank** is mocked. Production needs the escrow bank's slip-verification / statement API and
  account-name inquiry, a segregated customer-funds account, and a payout (bulk transfer) job.
  Check Bank of Thailand licensing requirements for holding funds on behalf of others.
- **Payouts** are queued in the `payouts` table but not sent.
- **ID photos, slips and evidence** are stored inline in SQLite. Move to encrypted object storage
  with a retention policy (PDPA), and restrict staff access with audit logging.
- **Staff accounts** sign in via the demo picker; production needs separate staff auth with 2FA.
- **Notifications** (LINE / SMS / email) are not sent.
- Have a lawyer review the contract wording and dispute policy.
