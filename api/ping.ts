import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server/src/app.ts';
import { initDb } from '../server/src/db/index.ts';
import { loadConfig } from '../server/src/lib/config.ts';

let expressApp: any = null;

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (!expressApp) {
    if (process.env.TRUST_PROXY === undefined) {
      process.env.TRUST_PROXY = '1';
    }
    const dbPath = process.env.FREEAPI_DB_PATH || '/tmp/freeapi.db';
    initDb(dbPath);
    const config = loadConfig();
    expressApp = createApp(config);
  }

  req.url = '/api/ping';
  return expressApp(req, res);
}
