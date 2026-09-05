import { initDb, getUnifiedApiKey } from '../server/src/db/index.js';
import fs from 'fs';

initDb();
const key = getUnifiedApiKey();
fs.writeFileSync('scripts/key_out.txt', key);
console.log('KEY_SAVED');
