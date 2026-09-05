import './env.js';
import { createApp } from './app.js';
import { initDb, getDb } from './db/index.js';
import { startHealthChecker, checkAllKeys } from './services/health.js';
import { restoreProxySettings, flushProxyCache } from './lib/proxy.js';
import { startWakeDetect } from './lib/wake-detect.js';
import { startCatalogSync } from './services/catalog-sync.js';
import { startCooldownProbe } from './services/cooldown-probe.js';
import { startCustomModelSync } from './services/custom-model-sync.js';
import { installProcessSafetyNet } from './lib/process-safety-net.js';
import { NodeScheduler } from './lib/scheduler.js';
import { loadConfig } from './lib/config.js';
import { applyDeclarativeConfigFromEnv } from './services/declarative-config.js';
import { restoreDbBackupIfNeeded, startDbBackupPump } from './lib/db-backup.js';
import { startBackupScheduler } from './services/backups.js';
import { userCount } from './services/auth.js';
import { generateSetupCode } from './lib/setup-code.js';
import { warnOnEnvDrift } from './lib/env-drift.js';
import { warnOnRoutingOverrideDrift } from './services/model-weight-overrides.js';
import { installLogRedaction } from './lib/log-redaction.js';
import { cleanupExpiredCooldowns } from './services/ratelimit.js';
import { loadCacheFromDb } from './services/cache.js';

installLogRedaction();

async function main() {
  const config = loadConfig();
  const { port: PORT, host: HOST } = config;
  warnOnEnvDrift();

  installProcessSafetyNet();

  const scheduler = new NodeScheduler();

  if (config.dbPath) {
    await restoreDbBackupIfNeeded(config.dbPath);
  } else {
    await restoreDbBackupIfNeeded();
  }
  initDb(config.dbPath ?? undefined);
  applyDeclarativeConfigFromEnv();
  warnOnRoutingOverrideDrift();

  loadCacheFromDb();

  const expiredCooldowns = cleanupExpiredCooldowns();
  if (expiredCooldowns > 0) {
    console.log(`[ratelimit] cleared ${expiredCooldowns} expired cooldown${expiredCooldowns === 1 ? '' : 's'}`);
  }

  if (userCount() === 0) {
    generateSetupCode();
  }

  restoreProxySettings();

  const app = createApp(config);

  const onReady = (host: string) => () => {
    const display = host.includes(':') ? `[${host}]` : host;
    console.log(`Server running on http://${display}:${PORT}`);
    console.log(`Proxy endpoint: http://${display}:${PORT}/v1/chat/completions`);
    startHealthChecker(scheduler);
    startCatalogSync(scheduler);
    startCooldownProbe(scheduler);
    startDbBackupPump(getDb(), scheduler, config.dbPath ?? undefined);
    startBackupScheduler(scheduler);
    startCustomModelSync(getDb(), scheduler);

    startWakeDetect({
      async onWake(event) {
        const idle = Math.round(event.idleMs / 1000);
        console.log(`[wake] resumed after ~${idle}s (${event.reason}${event.signal ? `:${event.signal}` : ''}) — flushing stale sockets, re-probing keys`);
        flushProxyCache();
        try {
          await checkAllKeys({ force: true });
        } catch (err: any) {
          console.error(`[wake] post-wake key re-probe failed: ${err?.message ?? err}`);
        }
      },
    });
  };

  const tuneKeepAlive = (s: ReturnType<typeof app.listen>) => {
    s.keepAliveTimeout = 75_000;
    s.headersTimeout = 76_000;
  };

  const server = app.listen(Number(PORT), HOST, onReady(HOST));
  tuneKeepAlive(server);
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (!process.env.HOST && (err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL')) {
      console.warn('[server] IPv6 unavailable on this host — falling back to 0.0.0.0 (IPv4-only)');
      tuneKeepAlive(app.listen(Number(PORT), '0.0.0.0', onReady('0.0.0.0')));
      return;
    }
    console.error('\n[server] Failed to start:\n  ' + (err?.message ?? err) + '\n');
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('\n[server] Failed to start:\n  ' + (err?.message ?? err) + '\n');
  process.exit(1);
});
