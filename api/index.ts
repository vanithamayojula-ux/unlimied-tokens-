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

  // Restore original request URL for Express routing when proxied via Vercel rewrites
  const xForwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
  if (typeof xForwardedUri === 'string' && xForwardedUri.length > 0) {
    req.url = xForwardedUri;
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const origPath = parsedUrl.searchParams.get('__orig_path');
      if (origPath) {
        parsedUrl.searchParams.delete('__orig_path');
        const remainingSearch = parsedUrl.search;
        req.url = origPath + remainingSearch;
      }
    } catch (_e) {
      // Keep req.url as is if URL parsing fails
    }
  }

  return expressApp(req, res);
}
