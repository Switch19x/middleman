'use strict';
const path = require('node:path');
const { open } = require('./db');
const { createMockBank } = require('./bank');
const { createMockThaid } = require('./identity');
const { createApp } = require('./app');
const { seed } = require('./seed');
const { sweepExpired } = require('./service');

const PORT = Number(process.env.PORT) || 5178;
const DEMO = process.env.DEMO !== '0';
if (!DEMO) {
  // The bank and ThaID adapters below are mocks; production must wire real ones first.
  console.error('Production mode needs real bank and ThaID adapters (see README). Refusing to start with mocks.');
  process.exit(1);
}

const db = open();
const bank = createMockBank();
const thaid = createMockThaid();
if (DEMO && seed(db, bank)) console.log('Seeded demo users and deals');

// Auto-release deals whose inspection window has passed.
setInterval(() => {
  const n = sweepExpired(db);
  if (n) console.log(`Auto-released ${n} deal(s)`);
}, 60_000).unref();
sweepExpired(db);

createApp({ db, bank, thaid, demo: DEMO, publicDir: path.join(__dirname, '..', 'public') })
  .listen(PORT, () => console.log(`Middleman running at http://localhost:${PORT}${DEMO ? ' (demo mode)' : ''}`));
