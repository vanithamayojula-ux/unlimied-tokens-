import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server/src/app.js';
import { initDb } from '../server/src/db/index.js';
import { loadConfig } from '../server/src/lib/config.js';

let expressApp: any = null;

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (!expressApp) {
    const dbPath = process.env.FREEAPI_DB_PATH || '/tmp/freeapi.db';
    initDb(dbPath);
    const config = loadConfig();
    expressApp = createApp(config);
  }
  return expressApp(req, res);
}
