import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { listIngredientsQuery, listPizzasQuery } from '../validators/index.js';
import * as controller from '../controllers/catalogue.controller.js';

const router = Router();
router.get('/ingredients', validate({ query: listIngredientsQuery }), controller.listIngredients);
router.get('/pizzas', validate({ query: listPizzasQuery }), controller.listPizzas);
export default router;
