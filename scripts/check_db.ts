import { initDb, getDb, getUnifiedApiKey } from '../server/src/db/index.js';

async function main() {
  initDb();
  const db = getDb();
  console.log('UNIFIED_KEY:' + getUnifiedApiKey());
  const keys = db.prepare('SELECT id, provider, masked_key, status FROM api_keys').all();
  console.log('KEYS:' + JSON.stringify(keys));
}

main().catch(console.error);
