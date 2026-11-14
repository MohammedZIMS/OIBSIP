import { describe, expect, it } from 'vitest';
import { mock } from '../src/api/mock/index.js';
import { db } from '../src/api/mock/store.js';
import { setToken } from '../src/api/client.js';
import { addLine, linesFromOrder, lineKey, removeLine, setQty, toOrderItems } from '../src/utils/cart.js';
import { computeTotals } from '../src/utils/pricing.js';
import { checkPassword, isStrongPassword } from '../src/utils/passwordRules.js';
import { toCsv } from '../src/utils/csv.js';
import { formatPaise } from '../src/utils/money.js';

const expectErr = async (p, code) => { const e = await p.then(() => null, (x) => x); expect(e, 'should have failed').not.toBeNull(); expect(e.code).toBe(code); return e; };

describe('utilities', () => {
  it('password rules match the server (8+, lower, upper, number, symbol)', () => {
    expect(isStrongPassword('Str0ng#Pass')).toBe(true);
    for (const weak of ['sh0rT#', 'nouppercase1#', 'NOLOWERCASE1#', 'NoNumber#Here', 'NoSymbol1Here', 'a'.repeat(80)]) expect(isStrongPassword(weak), weak).toBe(false);
    expect(checkPassword('abc').filter((r) => r.ok).map((r) => r.id)).toEqual(['lower']);
  });

  it('totals are integer paise: subtotal + 5% tax + packaging + delivery', () => {
    expect(computeTotals([{ unitPrice: 62900, qty: 2 }])).toEqual({ subtotal: 125800, tax: 6290, deliveryFee: 4000, packagingFee: 4000, total: 140090 });
    expect(computeTotals([]).total).toBe(0);
    expect(formatPaise(140090)).toMatch(/1,400\.9|1,401/);
  });

  it('cart merges identical pizzas, ignores veggie order, clamps quantity', () => {
    const custom = { kind: 'custom', baseId: 'b', sauceId: 's', cheeseId: 'c', veggieIds: ['v2', 'v1'], qty: 1 };
    let lines = addLine([], custom);
    lines = addLine(lines, { ...custom, veggieIds: ['v1', 'v2'], qty: 2 });
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(3);
    expect(setQty(lines, lines[0].key, 99)[0].qty).toBe(10);
    expect(setQty(lines, lines[0].key, 0)[0].qty).toBe(1);
    expect(removeLine(lines, lines[0].key)).toEqual([]);
    expect(lineKey({ kind: 'preset', pizzaId: 'p1' })).toBe('p:p1');
  });

  it('order payload carries ids only, never prices', () => {
    const lines = addLine(addLine([], { kind: 'preset', pizzaId: 'p1', name: 'X', unitPrice: 100, qty: 1 }), { kind: 'custom', baseId: 'b', sauceId: 's', cheeseId: 'c', veggieIds: [], unitPrice: 5, qty: 2 });
    const items = toOrderItems(lines);
    expect(JSON.stringify(items)).not.toMatch(/unitPrice|price/);
    expect(items[1]).toMatchObject({ kind: 'custom', baseId: 'b', qty: 2 });
  });

  it('CSV escapes quotes and commas', () => {
    expect(toCsv([{ a: 'x,"y"', b: 1 }])).toBe('a,b\n"x,""y""","1"');
  });
});

describe('mock backend (same contract as the real API)', () => {
  const signup = async (n = 1) => {
    const email = `u${n}@example.com`;
    const r = await mock.auth.register({ name: 'Asha Rao', email, phone: '+919800000000', password: 'Str0ng#Pass', acceptTerms: true });
    return { email, ...r.demo };
  };

  it('registration, verification gate, duplicate email and generic login errors', async () => {
    const { email, code } = await signup();
    await expectErr(mock.auth.register({ name: 'A B', email, phone: '+919800000000', password: 'Str0ng#Pass' }), 'DUPLICATE');
    await expectErr(mock.auth.login({ email, password: 'Str0ng#Pass' }), 'EMAIL_NOT_VERIFIED');
    const bad = await expectErr(mock.auth.login({ email, password: 'wrong' }), 'UNAUTHORIZED');
    const ghost = await expectErr(mock.auth.login({ email: 'ghost@example.com', password: 'wrong' }), 'UNAUTHORIZED');
    expect(bad.message).toBe(ghost.message);
    await expectErr(mock.auth.verifyCode({ email, code: '000000' }), 'TOKEN_INVALID');
    const ok = await mock.auth.verifyCode({ email, code });
    expect(ok.user.isVerified).toBe(true);
    expect(ok.user.password).toBeUndefined();
    await expectErr(mock.auth.verifyCode({ email, code }), 'TOKEN_INVALID'); // single use
    expect((await mock.auth.login({ email, password: 'Str0ng#Pass' })).token).toBeTruthy();
  });

  it('password reset works once and signs out old sessions', async () => {
    const { email, code } = await signup();
    const { token: old } = await mock.auth.verifyCode({ email, code });
    setToken('user', old);
    expect((await mock.auth.me()).email).toBe(email);
    const { demo } = await mock.auth.forgot(email);
    expect((await mock.auth.forgot('ghost@example.com')).demo).toBeUndefined();
    await mock.auth.reset({ token: demo.token, password: 'Br4nd#New!' });
    await expectErr(mock.auth.reset({ token: demo.token, password: 'Another#1x' }), 'TOKEN_INVALID');
    await expectErr(mock.auth.me(), 'UNAUTHORIZED'); // old token revoked
    expect((await mock.auth.login({ email, password: 'Br4nd#New!' })).token).toBeTruthy();
  });

  async function customer() {
    const { email, code } = await signup(Math.floor(Math.random() * 1e6));
    const { token } = await mock.auth.verifyCode({ email, code });
    setToken('user', token);
  }
  const addr = { line1: '1 Main St', city: 'Dhaka', pincode: '560038' };

  it('order flow: stock untouched until payment, then decremented with ledger rows', async () => {
    await customer();
    const [pizza] = (await mock.catalogue.pizzas()).filter((p) => p.name.startsWith('Margherita'));
    const before = db().ingredients.map((i) => i.quantity);
    const o = await mock.orders.create({ items: [{ kind: 'preset', pizzaId: pizza.id, qty: 2 }], address: addr, phone: '+919800000000' });
    expect(o.amount).toBe(computeTotals([{ unitPrice: pizza.price, qty: 2 }]).total);
    expect(db().ingredients.map((i) => i.quantity)).toEqual(before); // nothing yet
    expect(await mock.orders.active()).toHaveLength(0);

    const paid = await mock.orders.verifyPayment({ orderId: o.orderId });
    expect(paid.status).toBe('order_received');
    expect((await mock.orders.active())).toHaveLength(1);
    const rows = db().transactions.filter((t) => t.orderNumber === paid.orderNumber);
    expect(rows.length).toBe(4); // base, sauce, cheese, 1 veggie
    expect(rows.every((t) => t.type === 'order_decrement' && t.quantityChange === -2)).toBe(true);
    expect((await mock.orders.verifyPayment({ orderId: o.orderId })).status).toBe('order_received'); // idempotent
    expect(db().transactions.filter((t) => t.orderNumber === paid.orderNumber).length).toBe(4);
  });

  it('out-of-stock items are refused, and the admin side enforces transitions and non-negative stock', async () => {
    await customer();
    const out = db().ingredients.find((i) => i.name === 'Vegan Cheese'); // seeded at 0
    const [base, sauce] = ['Classic Hand-Tossed', 'Tomato Marinara'].map((n) => db().ingredients.find((i) => i.name === n).id);
    const e = await expectErr(mock.orders.create({ items: [{ kind: 'custom', baseId: base, sauceId: sauce, cheeseId: out.id, veggieIds: [], qty: 1 }], address: addr, phone: '1234567' }), 'OUT_OF_STOCK');
    expect(e.details[0].name).toBe('Vegan Cheese');

    const [pizza] = await mock.catalogue.pizzas({ search: 'Margherita' });
    const o = await mock.orders.create({ items: [{ kind: 'preset', pizzaId: pizza.id, qty: 1 }], address: addr, phone: '1234567' });
    const paid = await mock.orders.verifyPayment({ orderId: o.orderId });

    await expectErr(mock.admin.orders(), 'UNAUTHORIZED'); // no admin token
    setToken('admin', (await mock.admin.login({ email: 'admin@example.com', password: 'Admin#12345' })).token);
    await expectErr(mock.admin.advance(paid.id, 'sent_to_delivery'), 'INVALID_TRANSITION'); // cannot skip
    expect((await mock.admin.advance(paid.id, 'in_kitchen')).status).toBe('in_kitchen');
    await expectErr(mock.admin.advance(paid.id, 'in_kitchen'), 'INVALID_TRANSITION'); // cannot repeat
    expect((await mock.admin.advance(paid.id, 'sent_to_delivery')).status).toBe('sent_to_delivery');
    expect((await mock.orders.get(paid.id)).statusHistory.map((h) => h.status)).toEqual(['pending_payment', 'order_received', 'in_kitchen', 'sent_to_delivery']);

    const item = db().ingredients.find((i) => i.name === 'Onion');
    await expectErr(mock.admin.adjust(item.id, { mode: 'delta', value: -9999 }), 'OUT_OF_STOCK');
    await mock.admin.adjust(item.id, { mode: 'delta', value: -85, type: 'wastage', note: 'spoiled' });
    const alerts = await mock.admin.alerts();
    expect(alerts.items.find((a) => a.name === 'Onion').state).toBe('low');
    expect(alerts.items.some((a) => a.name === 'Vegan Cheese' && a.state === 'out')).toBe(true);
    const audit = await mock.admin.runAudit();
    expect(audit.notified).toBeGreaterThan(0);
    expect((await mock.admin.runAudit()).notified).toBe(0); // de-duplicated within the cool-down
    await mock.admin.adjust(item.id, { mode: 'set', value: 100 });
    expect((await mock.admin.alerts()).items.some((a) => a.name === 'Onion')).toBe(false); // re-armed
  });
});
