import { Ingredient, Pizza } from '../models/index.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { pageMeta, toSkipLimit } from '../utils/pagination.js';

const publicIngredient = (i) => ({
  id: i._id,
  name: i.name,
  category: i.category,
  description: i.description,
  imageUrl: i.imageUrl,
  dietaryTags: i.dietaryTags,
  price: i.price,
  unit: i.unit,
  inStock: i.quantity > 0, // raw stock counts are admin-only
});

export async function listIngredients({ category, search, page, limit }) {
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  const [items, total] = await Promise.all([
    Ingredient.find(filter).sort({ category: 1, name: 1 }).skip(toSkipLimit({ page, limit }).skip).limit(limit).lean(),
    Ingredient.countDocuments(filter),
  ]);
  return { items: items.map(publicIngredient), meta: pageMeta({ page, limit }, total) };
}

export async function listPizzas({ tag, search }) {
  const filter = { isActive: true };
  if (tag) filter.tags = tag;
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  const pizzas = await Pizza.find(filter)
    .populate('components.base components.sauce components.cheese components.veggies', 'name price quantity isActive')
    .sort({ name: 1 })
    .lean();

  return pizzas.map((p) => {
    const parts = [p.components.base, p.components.sauce, p.components.cheese, ...(p.components.veggies ?? [])];
    const complete = parts.every(Boolean);
    const available = complete && parts.every((c) => c.isActive && c.quantity > 0);
    const sum = parts.filter(Boolean).reduce((t, c) => t + c.price, 0);
    return {
      id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      imageUrl: p.imageUrl,
      tags: p.tags,
      price: p.priceOverride ?? sum,
      available,
    };
  });
}
