import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server/src/app.ts';
import { initDb } from '../server/src/db/index.ts';
import { loadConfig } from '../server/src/lib/config.ts';
import { applyDeclarativeConfigFromEnv } from '../server/src/services/declarative-config.ts';

let expressApp: any = null;

export default function handler(req: IncomingMessage, res: ServerResponse) {
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

  // Restore original request URL for Express routing when proxied via Vercel rewrites
  if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://127.0.0.1');
      const origPath = parsedUrl.searchParams.get('__orig_path');
      if (origPath) {
        parsedUrl.searchParams.delete('__orig_path');
        const remainingSearch = parsedUrl.search;
        req.url = origPath + remainingSearch;
      } else {
        const xForwardedUri = req.headers['x-forwarded-uri'];
        if (typeof xForwardedUri === 'string' && xForwardedUri.length > 0) {
          req.url = xForwardedUri;
        } else if (req.url.startsWith('/api/index')) {
          const stripped = req.url.slice('/api/index'.length);
          req.url = stripped.startsWith('/') ? stripped : '/' + stripped;
        }
      }
    } catch (_e) {
      // Keep req.url as is if URL parsing fails
    }
  }

  return expressApp(req, res);
}
