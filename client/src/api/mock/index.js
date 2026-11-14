// In-browser stand-in for the backend: same method names and result shapes as ../live.js.
import { db, save, refresh, uid, err, delay, clone, resetDemo } from './store.js';
import { getToken } from '../client.js';
import { computeTotals } from '../../utils/pricing.js';
import { NEXT_STATUS, stockStatusOf } from '../../utils/status.js';

const wrap = (fn) => async (...a) => { await delay(); refresh(); return fn(...a); };
const publicUser = ({ password, code, token, ...u }) => u; // eslint-disable-line no-unused-vars
const userFromToken = (token) => {
  const d = db();
  const id = token && d.sessions[token];
  return id ? d.users.find((u) => u.id === id) : null;
};
const needUser = () => {
  const u = userFromToken(getToken('user'));
  if (!u) throw err(401, 'UNAUTHORIZED', 'Authentication required');
  return u;
};
const needAdmin = () => {
  if (getToken('admin') !== 'admin_token') throw err(401, 'UNAUTHORIZED', 'Authentication required');
  return db().admin;
};
const session = (u, remember) => { const t = `u_${uid('t')}`; db().sessions[t] = u.id; save(); return { user: publicUser(u), token: t, remember }; };
const code6 = () => String(Math.floor(100000 + Math.random() * 900000));
const hexToken = () => Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const GENERIC = 'Invalid email or password';

// ---------- helpers ----------
const ingById = (id) => db().ingredients.find((i) => i.id === id);
const priceOfPizza = (p) => p.priceOverride ?? [p.components.base, p.components.sauce, p.components.cheese, ...p.components.veggies].reduce((t, i) => t + ingById(i).price, 0);
const pizzaAvailable = (p) => [p.components.base, p.components.sauce, p.components.cheese, ...p.components.veggies].every((i) => ingById(i)?.isActive && ingById(i).quantity > 0);
const alertRows = () => db().ingredients.filter((i) => i.isActive && i.quantity < i.threshold).map((i) => ({
  id: i.id, ingredientId: i.id, name: i.name, category: i.category, quantity: i.quantity, threshold: i.threshold,
  state: i.quantity <= 0 ? 'out' : 'low', lastNotifiedAt: db().alertMeta[i.id]?.lastNotifiedAt ?? null, notifyCount: db().alertMeta[i.id]?.notifyCount ?? 0,
}));
const withStatus = (i) => ({ ...i, stockStatus: stockStatusOf(i) });
function logTxn(ing, type, change, before, extra = {}) {
  db().transactions.unshift({ id: uid('txn'), ingredientId: ing.id, ingredientName: ing.name, type, quantityChange: change, quantityBefore: before, quantityAfter: ing.quantity, note: '', orderNumber: null, adminName: null, createdAt: new Date().toISOString(), ...extra });
}
const orderView = (o) => { const u = db().users.find((x) => x.id === o.userId); return { ...clone(o), customer: u ? { name: u.name, email: u.email, phone: u.phone } : null }; };

// ---------- auth ----------
const auth = {
  register: wrap(async ({ name, email, phone, password }) => {
    if (db().users.some((u) => u.email === email)) throw err(409, 'DUPLICATE', 'An account with this email already exists', [{ path: 'email', message: 'Already registered. Try signing in.' }]);
    const u = { id: uid('usr'), name, email, phone, password, isVerified: false, addresses: [], code: code6(), token: hexToken(), createdAt: new Date().toISOString() };
    db().users.push(u); save();
    return { data: { user: publicUser(u) }, message: 'Account created. Check your email to verify your address.', demo: { code: u.code, token: u.token } };
  }),
  login: wrap(async ({ email, password, remember }) => {
    const u = db().users.find((x) => x.email === email);
    if (!u || u.password !== password) throw err(401, 'UNAUTHORIZED', GENERIC);
    if (!u.isVerified) throw err(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before signing in', [{ path: 'email', message: u.email }]);
    return session(u, remember);
  }),
  verifyEmail: wrap(async (token) => {
    const u = db().users.find((x) => x.token === token);
    if (!u) throw err(400, 'TOKEN_INVALID', 'This verification link is invalid or has expired');
    u.isVerified = true; u.token = null; u.code = null; save();
    return session(u);
  }),
  verifyCode: wrap(async ({ email, code }) => {
    const u = db().users.find((x) => x.email === email);
    if (!u || !u.code || u.code !== code) throw err(400, 'TOKEN_INVALID', 'This verification code is invalid or has expired');
    u.isVerified = true; u.token = null; u.code = null; save();
    return session(u);
  }),
  resend: wrap(async (email) => {
    const u = db().users.find((x) => x.email === email && !x.isVerified);
    if (u) { u.code = code6(); u.token = hexToken(); save(); }
    return { message: 'If that account needs verification, a new email is on its way.', demo: u ? { code: u.code, token: u.token } : undefined };
  }),
  forgot: wrap(async (email) => {
    const u = db().users.find((x) => x.email === email);
    let token;
    if (u) { token = hexToken(); db().resets[token] = { userId: u.id, expiresAt: Date.now() + 3600000 }; save(); }
    return { message: 'If an account exists for that email, a reset link is on its way.', demo: token ? { token } : undefined };
  }),
  validateReset: wrap(async (token) => {
    const r = db().resets[token];
    if (!r || r.expiresAt < Date.now()) throw err(400, 'TOKEN_INVALID', 'This reset link is invalid or has expired');
    return { expiresAt: new Date(r.expiresAt).toISOString(), minutesRemaining: Math.max(1, Math.round((r.expiresAt - Date.now()) / 60000)) };
  }),
  reset: wrap(async ({ token, password }) => {
    const r = db().resets[token];
    if (!r || r.expiresAt < Date.now()) throw err(400, 'TOKEN_INVALID', 'This reset link is invalid or has expired');
    db().users.find((u) => u.id === r.userId).password = password;
    delete db().resets[token];
    for (const [t, id] of Object.entries(db().sessions)) if (id === r.userId) delete db().sessions[t];
    save();
    return { message: 'Password updated. Sign in with your new password.' };
  }),
  me: wrap(async () => publicUser(needUser())),
  changePassword: wrap(async ({ currentPassword, newPassword }) => {
    const u = needUser();
    if (u.password !== currentPassword) throw err(401, 'UNAUTHORIZED', 'Current password is incorrect');
    u.password = newPassword; save();
    return session(u);
  }),
};

// ---------- catalogue ----------
const catalogue = {
  pizzas: wrap(async ({ tag, search } = {}) =>
    db().pizzas.filter((p) => p.isActive && (!tag || p.tags.includes(tag)) && (!search || p.name.toLowerCase().includes(search.toLowerCase())))
      .map((p) => ({ id: p.id, name: p.name, description: p.description, tags: p.tags, price: priceOfPizza(p), available: pizzaAvailable(p), components: [p.components.base, p.components.sauce, p.components.cheese, ...p.components.veggies].map((i) => ingById(i).name) }))),
  ingredients: wrap(async (category) =>
    db().ingredients.filter((i) => i.isActive && (!category || i.category === category)).map((i) => ({ id: i.id, name: i.name, category: i.category, price: i.price, description: i.description, inStock: i.quantity > 0 }))),
};

// ---------- profile ----------
const profile = {
  update: wrap(async (b) => { const u = needUser(); Object.assign(u, { name: b.name ?? u.name, phone: b.phone ?? u.phone }); save(); return publicUser(u); }),
  addresses: wrap(async () => clone(needUser().addresses)),
  addAddress: wrap(async (b) => {
    const u = needUser();
    const a = { id: uid('adr'), label: 'Home', ...b, isDefault: b.isDefault || !u.addresses.length };
    if (a.isDefault) u.addresses.forEach((x) => { x.isDefault = false; });
    u.addresses.push(a); save();
    return clone(a);
  }),
  updateAddress: wrap(async (id, b) => {
    const u = needUser(); const a = u.addresses.find((x) => x.id === id);
    if (!a) throw err(404, 'NOT_FOUND', 'Address not found');
    if (b.isDefault) u.addresses.forEach((x) => { x.isDefault = false; });
    Object.assign(a, b); save(); return clone(a);
  }),
  removeAddress: wrap(async (id) => {
    const u = needUser();
    u.addresses = u.addresses.filter((x) => x.id !== id);
    if (u.addresses.length && !u.addresses.some((x) => x.isDefault)) u.addresses[0].isDefault = true;
    save(); return {};
  }),
};

// ---------- orders ----------
function buildItems(rawItems) {
  return rawItems.map((it) => {
    let comps; let name; let unitPrice;
    if (it.kind === 'preset') {
      const p = db().pizzas.find((x) => x.id === it.pizzaId && x.isActive);
      if (!p) throw err(404, 'NOT_FOUND', 'Pizza not found');
      comps = [p.components.base, p.components.sauce, p.components.cheese, ...p.components.veggies].map(ingById);
      name = p.name; unitPrice = priceOfPizza(p);
    } else {
      comps = [it.baseId, it.sauceId, it.cheeseId, ...(it.veggieIds ?? [])].map(ingById);
      if (comps.some((c) => !c || !c.isActive)) throw err(404, 'NOT_FOUND', 'An ingredient is no longer available');
      name = 'Custom pizza'; unitPrice = comps.reduce((t, c) => t + c.price, 0);
    }
    return { id: uid('itm'), kind: it.kind, pizzaId: it.pizzaId, name, qty: it.qty, unitPrice, components: comps.map((c) => ({ ingredient: c.id, name: c.name, category: c.category, price: c.price })) };
  });
}
function requirements(items) {
  const need = new Map();
  items.forEach((i) => i.components.forEach((c) => need.set(c.ingredient, (need.get(c.ingredient) ?? 0) + i.qty)));
  return need;
}
function assertStock(need) {
  const short = [...need].filter(([id, n]) => ingById(id).quantity < n).map(([id, n]) => ({ ingredient: id, name: ingById(id).name, available: ingById(id).quantity, requested: n }));
  if (short.length) throw err(409, 'OUT_OF_STOCK', `Not enough stock for ${short.map((s) => s.name).join(', ')}`, short);
}
const orders = {
  create: wrap(async ({ items: raw, address, phone, notes, dropoffInstructions }) => {
    const u = needUser();
    if (!raw?.length) throw err(400, 'VALIDATION_ERROR', 'Your cart is empty');
    const items = buildItems(raw);
    assertStock(requirements(items));
    const t = computeTotals(items);
    const o = {
      id: uid('ord'), orderNumber: `FF-${Date.now().toString(36).toUpperCase().slice(-6)}`, userId: u.id, items, ...t,
      address, phone, notes, dropoffInstructions, status: 'pending_payment', statusHistory: [{ status: 'pending_payment', at: new Date().toISOString() }],
      paidAt: null, needsReview: false, createdAt: new Date().toISOString(),
    };
    db().orders.unshift(o); save();
    return { orderId: o.id, razorpayOrderId: `order_${uid('rzp')}`, amount: o.total, currency: 'INR', keyId: 'rzp_test_mock', summary: t };
  }),
  verifyPayment: wrap(async ({ orderId, outcome = 'success' }) => {
    const u = needUser();
    const o = db().orders.find((x) => x.id === orderId && x.userId === u.id);
    if (!o) throw err(404, 'NOT_FOUND', 'Order not found');
    if (o.status !== 'pending_payment') return orderView(o); // idempotent
    if (outcome !== 'success') throw err(400, 'PAYMENT_FAILED', 'Payment was not completed');
    const need = requirements(o.items);
    try { assertStock(need); } catch (e) { o.needsReview = true; save(); throw err(409, 'STOCK_CONFLICT_AFTER_PAYMENT', 'An item sold out while you were paying. The team has been alerted.', e.details); }
    for (const [id, n] of need) { const ing = ingById(id); const before = ing.quantity; ing.quantity -= n; logTxn(ing, 'order_decrement', -n, before, { orderNumber: o.orderNumber }); }
    o.status = 'order_received'; o.paidAt = new Date().toISOString(); o.statusHistory.push({ status: 'order_received', at: o.paidAt });
    save();
    return orderView(o);
  }),
  mine: wrap(async () => { const u = needUser(); return db().orders.filter((o) => o.userId === u.id && o.status !== 'pending_payment').map(orderView); }),
  active: wrap(async () => { const u = needUser(); return db().orders.filter((o) => o.userId === u.id && ['order_received', 'in_kitchen', 'sent_to_delivery'].includes(o.status)).map(orderView); }),
  get: wrap(async (id) => { const u = needUser(); const o = db().orders.find((x) => x.id === id && x.userId === u.id); if (!o) throw err(404, 'NOT_FOUND', 'Order not found'); return orderView(o); }),
};

// ---------- admin ----------
const admin = {
  login: wrap(async ({ email, password }) => {
    const a = db().admin;
    if (email !== a.email || password !== a.password) throw err(401, 'UNAUTHORIZED', 'Invalid credentials');
    return { admin: { id: a.id, name: a.name, email: a.email, role: a.role }, token: 'admin_token' };
  }),
  me: wrap(async () => { const a = needAdmin(); return { id: a.id, name: a.name, email: a.email, role: a.role }; }),
  summary: wrap(async () => {
    needAdmin();
    const paid = db().orders.filter((o) => o.paidAt);
    const today = paid.filter((o) => new Date(o.paidAt).toDateString() === new Date().toDateString());
    const revenueToday = today.reduce((t, o) => t + o.total, 0);
    const count = (s) => db().orders.filter((o) => o.status === s).length;
    return { revenueToday, ordersToday: today.length, avgTicket: today.length ? Math.round(revenueToday / today.length) : 0, live: { order_received: count('order_received'), in_kitchen: count('in_kitchen'), sent_to_delivery: count('sent_to_delivery') }, criticalCount: alertRows().length };
  }),
  inventory: wrap(async ({ category, search } = {}) => {
    needAdmin();
    return db().ingredients.filter((i) => i.isActive && (!category || i.category === category) && (!search || i.name.toLowerCase().includes(search.toLowerCase()))).map(withStatus);
  }),
  item: wrap(async (id) => { needAdmin(); const i = ingById(id); if (!i) throw err(404, 'NOT_FOUND', 'Ingredient not found'); return withStatus(i); }),
  createItem: wrap(async (b) => {
    needAdmin();
    if (db().ingredients.some((i) => i.category === b.category && i.name.toLowerCase() === b.name.toLowerCase())) throw err(409, 'DUPLICATE', 'An ingredient with this name already exists in this category', [{ path: 'name', message: 'Already exists in this category' }]);
    const i = { id: uid('ing'), unit: 'unit', isActive: true, description: '', ...b, quantity: b.quantity ?? 0 };
    db().ingredients.push(i);
    if (i.quantity > 0) logTxn(i, 'initial', i.quantity, 0, { note: 'Created', adminName: db().admin.name });
    save(); return withStatus(i);
  }),
  updateItem: wrap(async (id, b) => {
    needAdmin(); const i = ingById(id);
    if (!i) throw err(404, 'NOT_FOUND', 'Ingredient not found');
    const { quantity, ...rest } = b; // quantity changes go through adjust() so the ledger stays complete
    Object.assign(i, rest); save(); return withStatus(i);
  }),
  deactivateItem: wrap(async (id) => {
    needAdmin(); const i = ingById(id);
    const used = db().pizzas.filter((p) => p.isActive && [p.components.base, p.components.sauce, p.components.cheese, ...p.components.veggies].includes(id));
    if (used.length) throw err(409, 'CONFLICT', `Used by active pizzas: ${used.map((p) => p.name).join(', ')}`);
    i.isActive = false; save(); return {};
  }),
  adjust: wrap(async (id, { mode, value, type = 'manual_adjustment', note, referenceNo }) => {
    needAdmin(); const i = ingById(id);
    if (!i) throw err(404, 'NOT_FOUND', 'Ingredient not found');
    if (!Number.isInteger(value)) throw err(400, 'VALIDATION_ERROR', 'Enter a whole number');
    const before = i.quantity; const after = mode === 'set' ? value : before + value;
    if (after < 0) throw err(409, 'OUT_OF_STOCK', 'Stock cannot go below zero');
    i.quantity = after;
    logTxn(i, type, after - before, before, { note: [note, referenceNo && `Ref ${referenceNo}`].filter(Boolean).join(' · '), adminName: db().admin.name });
    if (after >= i.threshold) delete db().alertMeta[id];
    save(); return { ingredient: withStatus(i) };
  }),
  ledger: wrap(async ({ type, search, page = 1, limit = 15 } = {}) => {
    needAdmin();
    const rows = db().transactions.filter((t) => (!type || t.type === type) && (!search || `${t.ingredientName} ${t.orderNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())));
    return { items: clone(rows.slice((page - 1) * limit, page * limit)), meta: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) } };
  }),
  alerts: wrap(async () => { needAdmin(); return { cron: { active: true, schedule: 'Every 15 minutes', lastRunAt: db().alertMeta.__lastRun ?? null }, items: alertRows() }; }),
  runAudit: wrap(async () => {
    needAdmin();
    const due = alertRows().filter((a) => !a.lastNotifiedAt || Date.now() - new Date(a.lastNotifiedAt).getTime() > 86400000);
    due.forEach((a) => { const m = db().alertMeta[a.id] ?? { notifyCount: 0 }; db().alertMeta[a.id] = { lastNotifiedAt: new Date().toISOString(), notifyCount: m.notifyCount + 1 }; });
    db().alertMeta.__lastRun = new Date().toISOString(); save();
    return { notified: due.length, checked: alertRows().length };
  }),
  orders: wrap(async ({ status, search, page = 1, limit = 20 } = {}) => {
    needAdmin();
    const rows = db().orders.filter((o) => o.status !== 'pending_payment' && (!status || o.status === status) && (!search || `${o.orderNumber} ${db().users.find((u) => u.id === o.userId)?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())));
    const counts = { all: 0, order_received: 0, in_kitchen: 0, sent_to_delivery: 0 };
    db().orders.filter((o) => o.status !== 'pending_payment').forEach((o) => { counts.all += 1; counts[o.status] += 1; });
    return { items: rows.slice((page - 1) * limit, page * limit).map(orderView), meta: { page, limit, total: rows.length, counts } };
  }),
  order: wrap(async (id) => { needAdmin(); const o = db().orders.find((x) => x.id === id); if (!o) throw err(404, 'NOT_FOUND', 'Order not found'); return orderView(o); }),
  advance: wrap(async (id, status) => {
    needAdmin(); const o = db().orders.find((x) => x.id === id);
    if (!o) throw err(404, 'NOT_FOUND', 'Order not found');
    if (NEXT_STATUS[o.status] !== status) throw err(409, 'INVALID_TRANSITION', 'This order was already updated. Refresh to see its current status.');
    o.status = status; o.statusHistory.push({ status, at: new Date().toISOString(), by: db().admin.name }); save();
    return orderView(o);
  }),
};

export const mock = { mode: 'mock', auth, catalogue, profile, orders, admin, resetDemo };
