import { z } from 'zod';
import { INGREDIENT_CATEGORIES } from '../constants/inventory.js';
import { pagination, searchText } from './common.schema.js';

export const listIngredientsQuery = pagination.extend({
  category: z.enum(INGREDIENT_CATEGORIES).optional(),
  search: searchText.optional(),
});

export const listPizzasQuery = z.object({
  tag: z.string().trim().min(1).max(30).optional(),
  search: searchText.optional(),
});
