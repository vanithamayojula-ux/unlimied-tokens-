import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server/src/app.ts';
import { initDb } from '../server/src/db/index.ts';
import { loadConfig } from '../server/src/lib/config.ts';
import { applyDeclarativeConfigFromEnv } from '../server/src/services/declarative-config.ts';

import { normalizeVercelUrl } from './index.ts';

let expressApp: any = null;

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!expressApp) {
      if (process.env.TRUST_PROXY === undefined) {
        process.env.TRUST_PROXY = '1';
      }
      const dbPath = process.env.FREEAPI_DB_PATH || '/tmp/freeapi.db';
      initDb(dbPath);
      applyDeclarativeConfigFromEnv();
      const config = loadConfig();
      expressApp = createApp(config);
    }

    req.url = normalizeVercelUrl(req);
    return expressApp(req, res);
  } catch (err: any) {
    console.error('[Vercel Path Handler Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: {
        message: err?.message || 'Internal Server Error',
        type: 'internal_server_error'
      }
    }));
  }
}
