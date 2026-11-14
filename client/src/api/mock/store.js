// Demo database kept in localStorage so state survives reloads and is shared between browser tabs
// (open the admin panel in one tab and the customer tracking page in another to see live updates).
import { ApiClientError } from '../client.js';

const KEY = 'ff_mock_db_v1';
const memory = {}; // fallback when localStorage is unavailable (tests, private mode)
const hasLS = () => typeof localStorage !== 'undefined';
export const ls = {
  get: (k) => (hasLS() ? localStorage.getItem(k) : memory[k] ?? null),
  set: (k, v) => (hasLS() ? localStorage.setItem(k, v) : (memory[k] = v)),
};

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
export const err = (status, code, message, details) => new ApiClientError(status, code, message, details);
export const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
export const clone = (x) => JSON.parse(JSON.stringify(x));

const ING = [
  ['base', 'Classic Hand-Tossed', 18000, 100], ['base', 'Thin Crust', 18000, 100], ['base', 'Cheese Burst', 24000, 14],
  ['base', 'Whole Wheat', 20000, 100], ['base', 'Multigrain', 22000, 100],
  ['sauce', 'Tomato Marinara', 3000, 100], ['sauce', 'Pesto', 5000, 18], ['sauce', 'Barbecue', 4000, 100],
  ['sauce', 'Garlic White Sauce', 4000, 100], ['sauce', 'Spicy Arrabbiata', 4000, 100],
  ['cheese', 'Mozzarella', 7000, 100], ['cheese', 'Cheddar', 6000, 100], ['cheese', 'Parmesan Blend', 9000, 100], ['cheese', 'Vegan Cheese', 9000, 0],
  ['veggie', 'Onion', 2000, 100], ['veggie', 'Capsicum', 2500, 100], ['veggie', 'Tomato', 2000, 100], ['veggie', 'Mushroom', 3500, 100],
  ['veggie', 'Sweet Corn', 2500, 100], ['veggie', 'Olives', 3000, 100], ['veggie', 'Jalapeño', 2500, 8], ['veggie', 'Paneer', 4500, 100],
];
const PRESETS = [
  ['Margherita Verace', 56900, ['Rosso'], 'Classic Hand-Tossed', 'Tomato Marinara', 'Mozzarella', ['Tomato'], 'Crushed San Marzano tomatoes, mozzarella, sweet basil and olive oil.'],
  ['Diavola Calabrese', 62900, ['Rosso', 'Spicy'], 'Thin Crust', 'Spicy Arrabbiata', 'Mozzarella', ['Jalapeño', 'Onion'], 'Spicy tomato sauce, mozzarella, jalapeño and onion.'],
  ['Tartufo & Funghi', 68900, ['Bianca', 'Truffle'], 'Whole Wheat', 'Garlic White Sauce', 'Parmesan Blend', ['Mushroom'], 'Mushrooms, garlic crema and parmesan on a whole wheat base.'],
  ['Quattro Formaggi', 64900, ['Bianca'], 'Classic Hand-Tossed', 'Garlic White Sauce', 'Parmesan Blend', ['Olives'], 'A rich white pizza with a blend of cheeses.'],
];

export function seed() {
  const ingredients = ING.map(([category, name, price, quantity]) => ({ id: uid('ing'), category, name, price, quantity, threshold: 20, unit: 'unit', isActive: true, description: '' }));
  const id = (n) => ingredients.find((i) => i.name === n).id;
  return {
    users: [], sessions: {}, resets: {}, orders: [], alertMeta: {},
    admin: { id: 'adm_1', name: 'Operations Admin', email: 'admin@example.com', password: 'Admin#12345', role: 'admin' },
    ingredients,
    pizzas: PRESETS.map(([name, price, tags, b, s, c, v, description]) => ({
      id: uid('piz'), name, priceOverride: price, tags, description, isActive: true,
      components: { base: id(b), sauce: id(s), cheese: id(c), veggies: v.map(id) },
    })),
    transactions: ingredients.map((i) => ({
      id: uid('txn'), ingredientId: i.id, ingredientName: i.name, type: 'initial', quantityChange: i.quantity, quantityBefore: 0,
      quantityAfter: i.quantity, note: 'Seed data', orderNumber: null, adminName: null, createdAt: new Date(Date.now() - 86400000).toISOString(),
    })),
  };
}

let cache;
export function db() {
  if (!cache) {
    const raw = ls.get(KEY);
    cache = raw ? JSON.parse(raw) : seed();
    if (!raw) ls.set(KEY, JSON.stringify(cache));
  }
  return cache;
}
export const save = () => ls.set(KEY, JSON.stringify(cache));
/** Re-read storage (another tab may have changed it). Called at the start of every mock request. */
export function refresh() {
  const raw = ls.get(KEY);
  if (raw) cache = JSON.parse(raw);
  return db();
}
export function resetDemo() { cache = seed(); save(); }
