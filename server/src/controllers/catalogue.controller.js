import { asyncHandler } from '../utils/asyncHandler.js';
import * as catalogue from '../services/catalogueService.js';

export const listIngredients = asyncHandler(async (req, res) => {
  const { items, meta } = await catalogue.listIngredients(req.query);
  res.json({ data: items, meta });
});

export const listPizzas = asyncHandler(async (req, res) => {
  res.json({ data: await catalogue.listPizzas(req.query) });
});
