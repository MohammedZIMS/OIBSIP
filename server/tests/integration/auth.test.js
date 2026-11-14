import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from '../setup/testServer.js';

let api, stop, models, sentMessages, jwt;
before(async () => {
  ({ api, stop } = await startTestServer());
  models = await import('../../src/models/index.js');
  ({ sentMessages } = await import('../../src/services/emailService.js'));
  jwt = (await import('jsonwebtoken')).default;
});
after(() => stop());

const STRONG = 'Str0ng#Pass';
const newUser = (n, extra = {}) => ({ name: 'Asha Rao', email: `asha${n}@example.com`, phone: '+919800000000', password: STRONG, acceptTerms: true, ...extra });
const lastMail = (to) => [...sentMessages].reverse().find((m) => m.to === to);
const tokenFrom = (mail) => mail.text.match(/token=([a-f0-9]{64})/)[1];
const codeFrom = (mail) => mail.text.match(/code: (\d{6})/)[1];

// ------------------------------------------------------------------ customer
test('register: rejects weak passwords, missing terms and bad email with field paths', async () => {
  const r = await api('POST', '/api/auth/register', { body: newUser(1, { password: 'weakpass', acceptTerms: false, email: 'nope' }) });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'VALIDATION_ERROR');
  const paths = r.body.error.details.map((d) => d.path);
  for (const p of ['password', 'acceptTerms', 'email']) assert.ok(paths.includes(p), `missing ${p}`);
});

test('register: creates an unverified user, stores a bcrypt hash, emails a link and code', async () => {
  const r = await api('POST', '/api/auth/register', { body: newUser(2) });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.user.isVerified, false);
  assert.equal('passwordHash' in r.body.data.user, false);

  const stored = await models.User.findOne({ email: 'asha2@example.com' }).select('+passwordHash');
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
  assert.notEqual(stored.passwordHash, STRONG);

  const mail = lastMail('asha2@example.com');
  assert.match(mail.subject, /Verify/);
  assert.match(tokenFrom(mail), /^[a-f0-9]{64}$/);
  assert.match(codeFrom(mail), /^\d{6}$/);

  // only hashes are stored
  const rec = await models.EmailVerificationToken.findOne({ user: stored._id });
  assert.notEqual(rec.tokenHash, tokenFrom(mail));
});

test('register: duplicate email is a 409 on the email field', async () => {
  const r = await api('POST', '/api/auth/register', { body: newUser(2) });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'DUPLICATE');
  assert.equal(r.body.error.details[0].path, 'email');
});

test('login: unverified account is blocked with EMAIL_NOT_VERIFIED', async () => {
  const r = await api('POST', '/api/auth/login', { body: { email: 'asha2@example.com', password: STRONG } });
  assert.deepEqual([r.status, r.body.error.code], [403, 'EMAIL_NOT_VERIFIED']);
});

test('login: wrong password and unknown email give the same generic 401', async () => {
  const a = await api('POST', '/api/auth/login', { body: { email: 'asha2@example.com', password: 'Wrong#Pass1' } });
  const b = await api('POST', '/api/auth/login', { body: { email: 'ghost@example.com', password: 'Wrong#Pass1' } });
  assert.equal(a.status, 401);
  assert.deepEqual(a.body.error.message, b.body.error.message);
});

test('verify-email link: works once, returns a session, then the token is dead', async () => {
  const token = tokenFrom(lastMail('asha2@example.com'));
  const ok = await api('GET', `/api/auth/verify-email?token=${token}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.user.isVerified, true);
  assert.ok(ok.body.data.token);
  const again = await api('GET', `/api/auth/verify-email?token=${token}`);
  assert.deepEqual([again.status, again.body.error.code], [400, 'TOKEN_INVALID']);
  assert.equal((await api('GET', `/api/auth/verify-email?token=${'0'.repeat(64)}`)).status, 400);
});

let customerToken;
test('login: verified user gets a JWT; remember-me lasts longer', async () => {
  const r = await api('POST', '/api/auth/login', { body: { email: 'ASHA2@example.com', password: STRONG } });
  assert.equal(r.status, 200);
  customerToken = r.body.data.token;
  const short = jwt.decode(customerToken);
  const long = jwt.decode((await api('POST', '/api/auth/login', { body: { email: 'asha2@example.com', password: STRONG, remember: true } })).body.data.token);
  assert.equal(short.aud, 'user');
  assert.ok(long.exp - long.iat > short.exp - short.iat);
});

test('customer routes: need a valid token', async () => {
  const ok = await api('GET', '/api/users/me', { token: customerToken });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.user.email, 'asha2@example.com');
  assert.equal((await api('GET', '/api/users/me')).status, 401);
  assert.equal((await api('GET', '/api/users/me', { token: 'x.y.z' })).status, 401);
  const expired = jwt.sign({ sub: 'abc' }, 'u'.repeat(48), { audience: 'user', expiresIn: -10 });
  assert.equal((await api('GET', '/api/users/me', { token: expired })).body.error.code, 'TOKEN_EXPIRED');
});

test('customer routes: a verified email is required (even with a valid token)', async () => {
  await api('POST', '/api/auth/register', { body: newUser(3) });
  const user = await models.User.findOne({ email: 'asha3@example.com' });
  const { signUserToken } = await import('../../src/utils/jwt.js');
  const r = await api('GET', '/api/users/me', { token: signUserToken(user._id) });
  assert.deepEqual([r.status, r.body.error.code], [403, 'EMAIL_NOT_VERIFIED']);
});

test('verify-code: wrong codes are counted and locked after 5 attempts; right code works before that', async () => {
  await api('POST', '/api/auth/register', { body: newUser(4) });
  const code = codeFrom(lastMail('asha4@example.com'));
  const wrong = code === '000000' ? '111111' : '000000';
  const bad = await api('POST', '/api/auth/verify-code', { body: { email: 'asha4@example.com', code: wrong } });
  assert.deepEqual([bad.status, bad.body.error.code], [400, 'TOKEN_INVALID']);
  const good = await api('POST', '/api/auth/verify-code', { body: { email: 'asha4@example.com', code } });
  assert.equal(good.status, 200);

  await api('POST', '/api/auth/register', { body: newUser(5) });
  const code5 = codeFrom(lastMail('asha5@example.com'));
  const w5 = code5 === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i += 1) await api('POST', '/api/auth/verify-code', { body: { email: 'asha5@example.com', code: w5 } });
  const locked = await api('POST', '/api/auth/verify-code', { body: { email: 'asha5@example.com', code: code5 } });
  assert.equal(locked.status, 400); // even the right code no longer works
});

test('resend-verification: generic for unknown emails, and respects the cooldown', async () => {
  const before = sentMessages.length;
  const unknown = await api('POST', '/api/auth/resend-verification', { body: { email: 'nobody@example.com' } });
  assert.equal(unknown.status, 200);
  assert.equal(sentMessages.length, before);
  // asha3 registered just now, so a resend inside the cooldown sends nothing
  const soon = await api('POST', '/api/auth/resend-verification', { body: { email: 'asha3@example.com' } });
  assert.equal(soon.status, 200);
  assert.equal(sentMessages.length, before);
  // after the cooldown a new email goes out and the old link stops working
  // createdAt is immutable in Mongoose, so backdate through the raw collection
  await models.EmailVerificationToken.collection.updateMany({}, { $set: { createdAt: new Date(Date.now() - 120000) } });
  const oldToken = tokenFrom(lastMail('asha3@example.com'));
  await api('POST', '/api/auth/resend-verification', { body: { email: 'asha3@example.com' } });
  assert.equal(sentMessages.length, before + 1);
  assert.equal((await api('GET', `/api/auth/verify-email?token=${oldToken}`)).status, 400);
  assert.equal((await api('GET', `/api/auth/verify-email?token=${tokenFrom(lastMail('asha3@example.com'))}`)).status, 200);
});

// ------------------------------------------------------------------ password reset
test('forgot-password: same answer for known and unknown emails; only known ones get mail', async () => {
  const before = sentMessages.length;
  const unknown = await api('POST', '/api/auth/forgot-password', { body: { email: 'ghost@example.com' } });
  const known = await api('POST', '/api/auth/forgot-password', { body: { email: 'asha2@example.com' } });
  assert.deepEqual([unknown.status, known.status], [200, 200]);
  assert.equal(unknown.body.message, known.body.message);
  assert.equal(sentMessages.length, before + 1);
  assert.match(lastMail('asha2@example.com').subject, /Reset/);
});

test('reset-password: validates token, enforces password rules, works once, and signs out old sessions', async () => {
  const token = tokenFrom(lastMail('asha2@example.com'));
  const check = await api('GET', `/api/auth/reset-token/validate?token=${token}`);
  assert.equal(check.status, 200);
  assert.ok(check.body.data.minutesRemaining > 0 && check.body.data.minutesRemaining <= 60);

  assert.equal((await api('POST', '/api/auth/reset-password', { body: { token, password: 'weak' } })).status, 400);

  // a token issued before the reset
  const { User } = models;
  const user = await User.findOne({ email: 'asha2@example.com' });
  const old = jwt.sign({ sub: String(user._id), iat: Math.floor(Date.now() / 1000) - 30 }, 'u'.repeat(48), { audience: 'user', expiresIn: '1h' });
  assert.equal((await api('GET', '/api/users/me', { token: old })).status, 200);

  const NEW = 'Brand#New9pass';
  const done = await api('POST', '/api/auth/reset-password', { body: { token, password: NEW } });
  assert.equal(done.status, 200);

  assert.deepEqual((await api('POST', '/api/auth/reset-password', { body: { token, password: NEW } })).body.error.code, 'TOKEN_INVALID');
  assert.equal((await api('GET', `/api/auth/reset-token/validate?token=${token}`)).status, 400);
  assert.equal((await api('GET', '/api/users/me', { token: old })).status, 401); // old session revoked
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'asha2@example.com', password: STRONG } })).status, 401);
  const fresh = await api('POST', '/api/auth/login', { body: { email: 'asha2@example.com', password: NEW } });
  assert.equal(fresh.status, 200);
  customerToken = fresh.body.data.token;
});

test('reset-password: expired tokens are rejected', async () => {
  await api('POST', '/api/auth/forgot-password', { body: { email: 'asha4@example.com' } });
  const token = tokenFrom(lastMail('asha4@example.com'));
  await models.PasswordResetToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  const r = await api('POST', '/api/auth/reset-password', { body: { token, password: 'Another#Pass1' } });
  assert.deepEqual([r.status, r.body.error.code], [400, 'TOKEN_INVALID']);
});

test('change-password: needs the current password, returns a working fresh token', async () => {
  const bad = await api('POST', '/api/auth/change-password', { token: customerToken, body: { currentPassword: 'Nope#Nope1', newPassword: 'Changed#Pass2' } });
  assert.equal(bad.status, 401);
  const same = await api('POST', '/api/auth/change-password', { token: customerToken, body: { currentPassword: 'Brand#New9pass', newPassword: 'Brand#New9pass' } });
  assert.equal(same.status, 400);
  const ok = await api('POST', '/api/auth/change-password', { token: customerToken, body: { currentPassword: 'Brand#New9pass', newPassword: 'Changed#Pass2' } });
  assert.equal(ok.status, 200);
  assert.equal((await api('GET', '/api/users/me', { token: ok.body.data.token })).status, 200);
});

// ------------------------------------------------------------------ admin
const admin = async (email, role = 'admin', password = 'Adm1n#Secret!') =>
  models.Admin.create({ name: 'Ops', email, role, passwordHash: await models.Admin.hashPassword(password) });

test('admin login: separate endpoint, separate token; customers cannot use it', async () => {
  await admin('ops@example.com');
  const customer = await api('POST', '/api/admin/auth/login', { body: { email: 'asha2@example.com', password: 'Changed#Pass2' } });
  assert.equal(customer.status, 401); // a customer account is not an admin account

  const r = await api('POST', '/api/admin/auth/login', { body: { email: 'ops@example.com', password: 'Adm1n#Secret!' } });
  assert.equal(r.status, 200);
  assert.equal('passwordHash' in r.body.data.admin, false);
  assert.equal(jwt.decode(r.body.data.token).aud, 'admin');
  const me = await api('GET', '/api/admin/me', { token: r.body.data.token });
  assert.equal(me.body.data.admin.email, 'ops@example.com');
});

test('token separation: customer token fails on admin routes and admin token fails on customer routes', async () => {
  const adminToken = (await api('POST', '/api/admin/auth/login', { body: { email: 'ops@example.com', password: 'Adm1n#Secret!' } })).body.data.token;
  assert.equal((await api('GET', '/api/admin/ping', { token: customerToken })).status, 401);
  assert.equal((await api('GET', '/api/users/me', { token: adminToken })).status, 401);
  assert.equal((await api('GET', '/api/admin/ping')).status, 401);
});

test('admin RBAC: superadmin-only route returns 403 for a regular admin', async () => {
  await admin('boss@example.com', 'superadmin');
  const regular = (await api('POST', '/api/admin/auth/login', { body: { email: 'ops@example.com', password: 'Adm1n#Secret!' } })).body.data.token;
  const boss = (await api('POST', '/api/admin/auth/login', { body: { email: 'boss@example.com', password: 'Adm1n#Secret!' } })).body.data.token;
  assert.equal((await api('GET', '/api/admin/ping', { token: regular })).status, 200);
  assert.equal((await api('GET', '/api/admin/admins', { token: regular })).status, 403);
  const list = await api('GET', '/api/admin/admins', { token: boss });
  assert.equal(list.status, 200);
  assert.ok(list.body.data.length >= 2 && list.body.data.every((a) => !('passwordHash' in a)));
});

test('admin lockout: 5 wrong passwords lock the account, even for the right password', async () => {
  await admin('lock@example.com');
  for (let i = 0; i < 5; i += 1) {
    const r = await api('POST', '/api/admin/auth/login', { body: { email: 'lock@example.com', password: 'Wrong#Pass1' } });
    assert.equal(r.status, 401);
  }
  const locked = await api('POST', '/api/admin/auth/login', { body: { email: 'lock@example.com', password: 'Adm1n#Secret!' } });
  assert.deepEqual([locked.status, locked.body.error.code], [403, 'ACCOUNT_LOCKED']);
  await models.Admin.updateOne({ email: 'lock@example.com' }, { $set: { lockedUntil: new Date(Date.now() - 1000) } });
  assert.equal((await api('POST', '/api/admin/auth/login', { body: { email: 'lock@example.com', password: 'Adm1n#Secret!' } })).status, 200);
});

test('deactivated admins cannot log in, and an old admin token stops working', async () => {
  await admin('gone@example.com');
  const t = (await api('POST', '/api/admin/auth/login', { body: { email: 'gone@example.com', password: 'Adm1n#Secret!' } })).body.data.token;
  await models.Admin.updateOne({ email: 'gone@example.com' }, { $set: { isActive: false } });
  assert.equal((await api('GET', '/api/admin/ping', { token: t })).status, 401);
  assert.equal((await api('POST', '/api/admin/auth/login', { body: { email: 'gone@example.com', password: 'Adm1n#Secret!' } })).status, 401);
});

test('there is no way to register an admin over HTTP', async () => {
  for (const path of ['/api/admin/register', '/api/admin/auth/register', '/api/auth/register-admin']) {
    const r = await api('POST', path, { body: { email: 'x@example.com', password: 'Adm1n#Secret!', role: 'superadmin' } });
    assert.ok([401, 404].includes(r.status), `${path} returned ${r.status}`);
  }
  // and a customer cannot grant themselves a role through registration
  const r = await api('POST', '/api/auth/register', { body: newUser(9, { role: 'superadmin', isVerified: true }) });
  const u = await models.User.findOne({ email: 'asha9@example.com' });
  assert.equal(r.status, 201);
  assert.equal(u.isVerified, false);
  assert.equal(u.role, undefined);
});
