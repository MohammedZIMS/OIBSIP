// Idempotent: safe to run many times. Creates ingredients (with an "initial" ledger row) and preset pizzas.
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Ingredient, InventoryTransaction, Pizza } from '../src/models/index.js';
import { TRANSACTION_TYPES } from '../src/constants/inventory.js';

const START_QTY = 100;
const I = (category, name, price, extra = {}) => ({ category, name, price, ...extra }); // price in paise

const INGREDIENTS = [
  I('base', 'Classic Hand-Tossed', 18000), I('base', 'Thin Crust', 18000), I('base', 'Cheese Burst', 24000),
  I('base', 'Whole Wheat', 20000), I('base', 'Multigrain', 22000),
  I('sauce', 'Tomato Marinara', 3000), I('sauce', 'Pesto', 5000), I('sauce', 'Barbecue', 4000),
  I('sauce', 'Garlic White Sauce', 4000), I('sauce', 'Spicy Arrabbiata', 4000, { dietaryTags: ['spicy'] }),
  I('cheese', 'Mozzarella', 7000), I('cheese', 'Cheddar', 6000), I('cheese', 'Parmesan Blend', 9000),
  I('cheese', 'Vegan Cheese', 9000, { dietaryTags: ['vegan'] }),
  I('veggie', 'Onion', 2000), I('veggie', 'Capsicum', 2500), I('veggie', 'Tomato', 2000), I('veggie', 'Mushroom', 3500),
  I('veggie', 'Sweet Corn', 2500), I('veggie', 'Olives', 3000), I('veggie', 'Jalapeño', 2500, { dietaryTags: ['spicy'] }),
  I('veggie', 'Paneer', 4500),
];

const PRESETS = [
  { name: 'Margherita Verace', price: 56900, tags: ['Rosso'], base: 'Classic Hand-Tossed', sauce: 'Tomato Marinara', cheese: 'Mozzarella', veggies: ['Tomato'], description: 'Crushed San Marzano tomatoes, mozzarella, sweet basil and olive oil.' },
  { name: 'Diavola Calabrese', price: 62900, tags: ['Rosso', 'Spicy'], base: 'Thin Crust', sauce: 'Spicy Arrabbiata', cheese: 'Mozzarella', veggies: ['Jalapeño', 'Onion'], description: 'Spicy tomato sauce, mozzarella, jalapeño and onion.' },
  { name: 'Tartufo & Funghi', price: 68900, tags: ['Bianca', 'Truffle'], base: 'Whole Wheat', sauce: 'Garlic White Sauce', cheese: 'Parmesan Blend', veggies: ['Mushroom'], description: 'Mushrooms, garlic crema and parmesan on a whole wheat base.' },
  { name: 'Quattro Formaggi', price: 64900, tags: ['Bianca'], base: 'Classic Hand-Tossed', sauce: 'Garlic White Sauce', cheese: 'Parmesan Blend', veggies: ['Olives'], description: 'A rich white pizza with a blend of cheeses.' },
];

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

await connectDB(env.MONGO_URI);

const byName = {};
let created = 0;
for (const item of INGREDIENTS) {
  const res = await Ingredient.findOneAndUpdate(
    { category: item.category, name: item.name },
    { $setOnInsert: { ...item, quantity: START_QTY } },
    { upsert: true, new: true, includeResultMetadata: true },
  );
  const doc = res.value;
  byName[doc.name] = doc._id;
  if (!res.lastErrorObject.updatedExisting) {
    created += 1;
    await InventoryTransaction.create({ ingredient: doc._id, type: TRANSACTION_TYPES.INITIAL, quantityChange: START_QTY, quantityBefore: 0, quantityAfter: START_QTY, note: 'Seed data' });
  }
}

for (const p of PRESETS) {
  await Pizza.updateOne(
    { slug: slug(p.name) },
    { $setOnInsert: { name: p.name, slug: slug(p.name), description: p.description, tags: p.tags, priceOverride: p.price, components: { base: byName[p.base], sauce: byName[p.sauce], cheese: byName[p.cheese], veggies: p.veggies.map((v) => byName[v]) } } },
    { upsert: true },
  );
}

console.log(`Catalogue ready: ${INGREDIENTS.length} ingredients (${created} new), ${PRESETS.length} preset pizzas.`);
await disconnectDB();
