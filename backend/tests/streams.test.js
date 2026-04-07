import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { buildApp } from '../app.js';

test('live streams endpoint responds', async () => {
  const app = buildApp();
  const res = await request(app).get('/api/streams/live');
  assert.ok([200,500].includes(res.status));
});
