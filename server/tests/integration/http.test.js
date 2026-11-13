// HTTP-level checks that need no database: routing, validation, auth gates, error envelope.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGO_URI: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'a'.repeat(40),
  JWT_ADMIN_SECRET: 'b'.repeat(40),
});

let server;
let base;
before(async () => {
  const { default: app } = await import('../../src/app.js');
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const get = (path, init) => fetch(base + path, init).then(async (r) => ({ status: r.status, body: await r.json(), headers: r.headers }));

test('GET /healthz is ok', async () => {
  const r = await get('/healthz');
  assert.deepEqual([r.status, r.body.status], [200, 'ok']);
});

test('unknown route returns the standard 404 envelope with a request id', async () => {
  const r = await get('/api/nope');
  assert.equal(r.status, 404);
  assert.equal(r.body.error.code, 'NOT_FOUND');
  assert.ok(r.body.error.requestId);
  assert.equal(r.headers.get('x-request-id'), r.body.error.requestId);
});

test('invalid query is rejected with field details before touching the database', async () => {
  const r = await get('/api/ingredients?category=pasta&limit=1000');
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(r.body.error.details.map((d) => d.path).sort(), ['category', 'limit']);
});

test('admin routes require an admin token', async () => {
  assert.equal((await get('/api/admin/ping')).status, 401);
  const bad = await get('/api/admin/ping', { headers: { Authorization: 'Bearer not.a.jwt' } });
  assert.deepEqual([bad.status, bad.body.error.code], [401, 'UNAUTHORIZED']);
});

test('a customer-signed token is rejected on admin routes', async () => {
  const { signUserToken } = await import('../../src/utils/jwt.js');
  const token = signUserToken('64b7f0f0f0f0f0f0f0f0f0f0');
  const r = await get('/api/admin/ping', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 401);
});

test('malformed JSON body returns INVALID_JSON', async () => {
  const res = await fetch(`${base}/api/anything`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'INVALID_JSON');
});
