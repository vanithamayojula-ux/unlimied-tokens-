import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());

console.log('ROOT BACKEND SERVER STARTING');

app.get('/', (_req, res) => {
  console.log('ROOT HIT');
  res.send('ROOT WORKING');
});

app.get('/api/test', (_req, res) => {
  console.log('API TEST HIT');
  res.json({ message: 'Backend working', status: 'ok' });
});

app.get('/test', (_req, res) => {
  console.log('TEST HIT');
  res.json({ message: 'Backend working', status: 'ok' });
});

const PORT = process.env.PORT || 10000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('SERVER RUNNING ON PORT', PORT);
});
