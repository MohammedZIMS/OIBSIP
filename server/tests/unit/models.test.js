import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Ingredient, Order, User, InventoryTransaction, Payment } from '../../src/models/index.js';

const id = () => new mongoose.Types.ObjectId();
const errs = (doc) => Object.keys(doc.validateSync()?.errors ?? {});
// pre('validate') hooks only run with async validate(), so Order checks use this helper.
const asyncErrs = (doc) => doc.validate().then(() => [], (e) => Object.keys(e.errors));

test('Ingredient: needs category, rejects negative or fractional stock and prices', () => {
  assert.ok(errs(new Ingredient({ name: 'X', price: 100, quantity: 5 })).includes('category'));
  assert.ok(errs(new Ingredient({ name: 'X', category: 'base', price: 100, quantity: -1 })).includes('quantity'));
  assert.ok(errs(new Ingredient({ name: 'X', category: 'base', price: 99.5, quantity: 1 })).includes('price'));
  assert.deepEqual(errs(new Ingredient({ name: 'X', category: 'base', price: 100, quantity: 5 })), []);
});

test('Ingredient: stockStatus is ok / low / out', () => {
  const mk = (quantity) => new Ingredient({ name: 'X', category: 'base', price: 1, quantity, threshold: 20 });
  assert.deepEqual([mk(50).stockStatus, mk(5).stockStatus, mk(0).stockStatus], ['ok', 'low', 'out']);
});

test('User: lowercases email, validates it, never serialises the password hash', () => {
  const u = new User({ name: 'Asha', email: 'ASHA@Example.com', passwordHash: 'h' });
  assert.equal(u.email, 'asha@example.com');
  assert.ok(errs(new User({ name: 'A', email: 'bad', passwordHash: 'h' })).includes('email'));
  assert.equal('passwordHash' in u.toJSON(), false);
});

const validOrder = () => ({
  user: id(),
  items: [{ kind: 'custom', name: 'Custom pizza', unitPrice: 30000, qty: 2, components: [{ ingredient: id(), name: 'Base', category: 'base', price: 18000 }] }],
  subtotal: 60000, tax: 3000, deliveryFee: 4000, packagingFee: 0, total: 67000,
  address: { line1: '1 Main St', city: 'Dhaka', pincode: '560038' }, phone: '+919800000000',
});

test('Order: valid order gets an order number and initial status history', async () => {
  const o = new Order(validOrder());
  assert.deepEqual(await asyncErrs(o), []);
  assert.match(o.orderNumber, /^FF-[A-Z0-9]+$/);
  assert.equal(o.status, 'pending_payment');
  assert.equal(o.statusHistory.length, 1);
});

test('Order: total must equal subtotal + tax + fees; preset needs a pizza; qty capped', async () => {
  assert.ok((await asyncErrs(new Order({ ...validOrder(), total: 1 }))).includes('total'));
  const preset = validOrder();
  preset.items[0].kind = 'preset';
  assert.ok((await asyncErrs(new Order(preset))).some((k) => k.includes('pizza')));
  const big = validOrder();
  big.items[0].qty = 11;
  assert.ok((await asyncErrs(new Order(big))).some((k) => k.includes('qty')));
});

test('Pizza: priceOverride is optional (null is valid) but must be a whole number when set', async () => {
  const { Pizza } = await import('../../src/models/index.js');
  const base = { name: 'X', slug: 'x', components: { base: id(), sauce: id(), cheese: id() } };
  assert.deepEqual(errs(new Pizza(base)), []);
  assert.ok(errs(new Pizza({ ...base, priceOverride: 99.5 })).includes('priceOverride'));
  assert.deepEqual(errs(new Pizza({ ...base, priceOverride: 62900 })), []);
});

test('Payment: unique razorpay ids, integer amount, hidden signature', () => {
  const p = new Payment({ order: id(), user: id(), razorpayOrderId: 'order_1', amount: 100.5 });
  assert.ok(errs(p).includes('amount'));
  assert.equal(Payment.schema.path('razorpaySignature').options.select, false);
});

test('InventoryTransaction is immutable', async () => {
  const t = new InventoryTransaction({ ingredient: id(), type: 'manual_restock', quantityChange: 5, quantityBefore: 0, quantityAfter: 5 });
  assert.equal(t.validateSync(), undefined);
  await assert.rejects(() => InventoryTransaction.updateOne({}, { $set: { note: 'x' } }).exec(), /immutable/);
  await assert.rejects(() => InventoryTransaction.deleteMany({}).exec(), /immutable/);
});

test('Token and alert models define TTL / partial unique indexes', async () => {
  const { EmailVerificationToken, PasswordResetToken, InventoryAlert } = await import('../../src/models/index.js');
  const has = (M, pred) => M.schema.indexes().some(([k, o]) => pred(k, o));
  assert.ok(has(EmailVerificationToken, (k, o) => k.expiresAt && o.expireAfterSeconds === 0));
  assert.ok(has(PasswordResetToken, (k, o) => k.expiresAt && o.expireAfterSeconds === 0));
  assert.ok(has(InventoryAlert, (k, o) => k.ingredient && o.unique && o.partialFilterExpression?.status === 'open'));
});
