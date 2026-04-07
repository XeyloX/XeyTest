import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { buildApp } from '../app.js';

const hasDb = Boolean(process.env.DATABASE_URL);

test('health check', async () => {
  const app = buildApp();
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('register validates payload', { skip: !hasDb }, async () => {
  const app = buildApp();
  const res = await request(app).post('/api/auth/register').send({ username: 'x', email: 'bad', password: '1' });
  assert.equal(res.status, 400);
});
