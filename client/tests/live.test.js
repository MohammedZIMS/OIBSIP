// @vitest-environment node
// Contract test: runs the real Express API (in-memory MongoDB) and drives it through the frontend's live adapter.
// Skipped unless LIVE_TESTS=1 (first run downloads a MongoDB binary). PowerShell: $env:LIVE_TESTS=1; npm run test:live -w client
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const store = {};
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };

describe.skipIf(!process.env.LIVE_TESTS)('live adapter against the real backend', () => {
  let stop; let live; let setToken; let models; let sentMessages;
  beforeAll(async () => {
    const { startTestServer } = await import('../../server/tests/setup/testServer.js');
    const srv = await startTestServer();
    stop = srv.stop;
    ({ live } = await import('../src/api/live.js'));
    const client = await import('../src/api/client.js');
    setToken = client.setToken;
    client.setApiBase(`${srv.base}/api`);
    models = await import('../../server/src/models/index.js');
    ({ sentMessages } = await import('../../server/src/services/emailService.js'));
  }, 120000);
  afterAll(() => stop?.());

  const mailFor = (to) => [...sentMessages].reverse().find((m) => m.to === to);
  const tokenOf = (m) => m.text.match(/token=([a-f0-9]{64})/)[1];

  it('register, verify by link, login, me, change password', async () => {
    const body = { name: 'Asha Rao', email: 'live@example.com', phone: '+919800000000', password: 'Str0ng#Pass', acceptTerms: true };
    const r = await live.auth.register(body);
    expect(r.message).toMatch(/Account created/);
    await expect(live.auth.register(body)).rejects.toMatchObject({ status: 409, code: 'DUPLICATE', fieldErrors: { email: expect.any(String) } });
    await expect(live.auth.login({ email: body.email, password: body.password })).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });

    const verified = await live.auth.verifyEmail(tokenOf(mailFor(body.email)));
    expect(verified.user.isVerified).toBe(true);
    const session = await live.auth.login({ email: body.email, password: body.password, remember: false });
    setToken('user', session.token);
    expect((await live.auth.me()).email).toBe(body.email);

    const changed = await live.auth.changePassword({ currentPassword: body.password, newPassword: 'Ch4nged#Pass' });
    setToken('user', changed.token);
    expect((await live.auth.me()).email).toBe(body.email);
  });

  it('server validation errors map to form fields', async () => {
    await expect(live.auth.register({ name: 'A', email: 'bad', phone: '1', password: 'weak', acceptTerms: false })).rejects.toMatchObject({
      status: 400, code: 'VALIDATION_ERROR', fieldErrors: expect.objectContaining({ email: expect.any(String), password: expect.any(String) }),
    });
  });

  it('forgot and reset password', async () => {
    await live.auth.forgot('live@example.com');
    const token = tokenOf(mailFor('live@example.com'));
    expect((await live.auth.validateReset(token)).minutesRemaining).toBeGreaterThan(0);
    await live.auth.reset({ token, password: 'Br4nd#New!x' });
    await expect(live.auth.validateReset(token)).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect((await live.auth.login({ email: 'live@example.com', password: 'Br4nd#New!x' })).token).toBeTruthy();
  });

  it('catalogue: pizzas and ingredients use the same shapes as the UI expects', async () => {
    const mk = (category, name, price, quantity) => models.Ingredient.create({ category, name, price, quantity });
    const [b, s, c, v] = await Promise.all([mk('base', 'Thin Crust', 18000, 50), mk('sauce', 'Pesto', 5000, 50), mk('cheese', 'Mozzarella', 7000, 0), mk('veggie', 'Onion', 2000, 50)]);
    await models.Pizza.create({ name: 'Test Pie', slug: 'test-pie', tags: ['Rosso'], components: { base: b._id, sauce: s._id, cheese: c._id, veggies: [v._id] } });
    const pizzas = await live.catalogue.pizzas();
    expect(pizzas[0]).toMatchObject({ id: expect.any(String), name: 'Test Pie', price: 32000, available: false }); // cheese is out of stock
    const veg = await live.catalogue.ingredients('veggie');
    expect(veg).toEqual([expect.objectContaining({ id: expect.any(String), name: 'Onion', inStock: true })]);
    expect((await live.catalogue.ingredients()).length).toBe(4);
  });

  it('admin login is separate; customer tokens do not work for admin calls', async () => {
    await models.Admin.create({ name: 'Ops', email: 'ops@example.com', passwordHash: await models.Admin.hashPassword('Adm1n#Secret!') });
    await expect(live.admin.login({ email: 'live@example.com', password: 'Br4nd#New!x' })).rejects.toMatchObject({ status: 401 });
    const a = await live.admin.login({ email: 'ops@example.com', password: 'Adm1n#Secret!' });
    setToken('admin', a.token);
    expect((await live.admin.me()).email).toBe('ops@example.com');
    setToken('admin', (await live.auth.login({ email: 'live@example.com', password: 'Br4nd#New!x' })).token); // wrong kind of token
    await expect(live.admin.me()).rejects.toMatchObject({ status: 401 });
  });
});
