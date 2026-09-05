import { spawn } from 'child_process';
import http from 'http';
import { initDb, getUnifiedApiKey } from '../server/src/db/index.js';

async function main() {
  initDb();
  const apiKey = getUnifiedApiKey();
  console.log('UNIFIED_API_KEY=' + apiKey);

  const child = spawn('npx', ['tsx', 'server/src/index.ts'], {
    env: { ...process.env, PORT: '3001', HOST: '127.0.0.1' },
    stdio: 'inherit',
    shell: true,
  });

  await new Promise(r => setTimeout(r, 3000));

  // Ping check
  const pingPromise = new Promise<void>((resolve) => {
    http.get('http://127.0.0.1:3001/api/ping', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('PING STATUS:', res.statusCode, body);
        resolve();
      });
    }).on('error', (err) => {
      console.error('PING ERROR:', err);
      resolve();
    });
  });
  await pingPromise;

  // Chat completions check
  const chatPromise = new Promise<void>((resolve) => {
    const data = JSON.stringify({
      model: 'auto',
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      stream: false,
    });

    const req = http.request('http://127.0.0.1:3001/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('CHAT COMPLETIONS STATUS:', res.statusCode);
        console.log('CHAT COMPLETIONS RESPONSE:', body);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('CHAT ERROR:', err);
      resolve();
    });

    req.write(data);
    req.end();
  });
  await chatPromise;

  child.kill();
  process.exit(0);
}

main().catch(console.error);
