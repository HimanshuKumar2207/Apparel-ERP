import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

const { createApp } = await import('../src/app.js');
const app = createApp();

test('health endpoint is public', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('security headers are set and x-powered-by is hidden', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.ok(res.headers['x-content-type-options']);
  assert.ok(res.headers['strict-transport-security']);
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('protected routes reject anonymous requests', async () => {
  for (const path of ['/employees', '/parties', '/bookings', '/targets', '/admins', '/audit-logs', '/reports/brand-sales', '/dashboard']) {
    const res = await request(app).get(`/api/v1${path}`);
    assert.equal(res.status, 401, path);
  }
});

test('garbage and forged tokens are rejected', async () => {
  const res = await request(app).get('/api/v1/employees').set('Authorization', 'Bearer not.a.token');
  assert.equal(res.status, 401);
});

test('login rejects NoSQL injection payloads at validation', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
  assert.equal(res.status, 422);
});

test('login validates input shape', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'nope', password: '' });
  assert.equal(res.status, 422);
});

test('refresh without a cookie is rejected', async () => {
  const res = await request(app).post('/api/v1/auth/refresh');
  assert.equal(res.status, 401);
});

test('unknown routes: anonymous gets 401 inside the API, JSON 404 elsewhere', async () => {
  assert.equal((await request(app).get('/api/v1/nothing-here')).status, 401);
  const res = await request(app).get('/nothing-here');
  assert.equal(res.status, 404);
  assert.ok(res.body.message);
});

test('CORS blocks unknown origins', async () => {
  const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
  assert.equal(res.status, 403);
});

test('oversized bodies are refused', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(200000) });
  assert.equal(res.status, 413);
});
