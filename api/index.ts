import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server/src/app.ts';
import { initDb } from '../server/src/db/index.ts';
import { loadConfig } from '../server/src/lib/config.ts';
import { applyDeclarativeConfigFromEnv } from '../server/src/services/declarative-config.ts';

let expressApp: any = null;

export function normalizeVercelUrl(req: IncomingMessage): string {
  let rawUrl = req.url || '/';

  try {
    const parsed = new URL(rawUrl, 'http://127.0.0.1');
    const origPath = parsed.searchParams.get('__orig_path');
    if (origPath) {
      parsed.searchParams.delete('__orig_path');
      const search = parsed.search;
      rawUrl = origPath + search;
    } else {
      const xForwardedUri = req.headers['x-forwarded-uri'];
      if (typeof xForwardedUri === 'string' && xForwardedUri.length > 0) {
        rawUrl = xForwardedUri;
      } else if (typeof req.headers['x-matched-path'] === 'string' && req.headers['x-matched-path'].length > 0) {
        rawUrl = req.headers['x-matched-path'];
      }
    }
  } catch (_e) {}

  let pathOnly = rawUrl;
  let queryOnly = '';
  const qIdx = rawUrl.indexOf('?');
  if (qIdx !== -1) {
    pathOnly = rawUrl.slice(0, qIdx);
    queryOnly = rawUrl.slice(qIdx);
  }

  if (pathOnly.startsWith('/api/index')) {
    pathOnly = pathOnly.slice('/api/index'.length);
    if (!pathOnly.startsWith('/')) {
      pathOnly = '/' + pathOnly;
    }
  }

  if (!pathOnly || pathOnly === '/') {
    pathOnly = '/api';
  }

  const validPrefixes = ['/api', '/v1', '/v1beta', '/mcp', '/livez', '/readyz'];
  const hasValidPrefix = validPrefixes.some(prefix => pathOnly === prefix || pathOnly.startsWith(prefix + '/'));

  if (!hasValidPrefix) {
    pathOnly = '/api' + (pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly);
  }

  return pathOnly + queryOnly;
}

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
    console.error('[Vercel Handler Error]:', err);
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
