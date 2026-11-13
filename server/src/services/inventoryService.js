import { Ingredient, InventoryTransaction } from '../models/index.js';
import { TRANSACTION_TYPES } from '../constants/inventory.js';
import { ERROR_CODES as C } from '../constants/errorCodes.js';
import ApiError from '../utils/ApiError.js';
import { runInTransaction } from '../utils/transaction.js';
import * as alertService from './alertService.js';

/**
 * Changes stock atomically and writes one InventoryTransaction row.
 *  mode 'delta': add or subtract (a decrement only matches if enough stock is left)
 *  mode 'set'  : set an exact count
 * Pass `session` to join a larger transaction (then call alertService.syncIngredient after it commits).
 */
export async function adjustStock(args) {
  const { ingredientId, mode, value, type = TRANSACTION_TYPES.MANUAL_ADJUSTMENT, note, referenceNo, adminId, orderId, session } = args;

  if (!session) {
    const result = await runInTransaction((s) => adjustStock({ ...args, session: s }));
    await alertService.syncIngredient(result.ingredient);
    return result;
  }

  if (!Number.isInteger(value) || (mode === 'delta' && value === 0) || (mode === 'set' && value < 0)) {
    throw ApiError.badRequest('Stock value must be a whole number (non-zero for a change, not negative for an exact count)');
  }

  const filter = { _id: ingredientId };
  let update;
  if (mode === 'delta') {
    if (value < 0) filter.quantity = { $gte: -value }; // atomic guard: stock can never go below zero
    update = { $inc: { quantity: value } };
  } else {
    update = { $set: { quantity: value } };
  }

  const before = await Ingredient.findOneAndUpdate(filter, update, { new: false, session });
  if (!before) {
    const current = await Ingredient.findById(ingredientId).session(session).select('name quantity');
    if (!current) throw ApiError.notFound('Ingredient not found');
    throw ApiError.conflict(`Not enough stock for ${current.name}`, C.OUT_OF_STOCK, [
      { ingredient: String(current._id), name: current.name, available: current.quantity, requested: -value },
    ]);
  }

  const after = mode === 'delta' ? before.quantity + value : value;
  const [transaction] = await InventoryTransaction.create(
    [{ ingredient: ingredientId, type, quantityChange: after - before.quantity, quantityBefore: before.quantity, quantityAfter: after, note, referenceNo, admin: adminId, order: orderId }],
    { session },
  );
  const ingredient = await Ingredient.findById(ingredientId).session(session);
  return { ingredient, transaction };
}

/** Total units needed per ingredient for a list of order items (each component x qty). */
export function requirementsFromItems(items) {
  const needed = new Map();
  for (const item of items) {
    for (const c of item.components) {
      const id = String(c.ingredient);
      needed.set(id, (needed.get(id) ?? 0) + item.qty);
    }
  }
  return needed;
}

/** Decrements stock for a paid order. Must run inside the payment-confirmation transaction. */
export async function decrementForOrder(requirements, { orderId, session }) {
  const touched = [];
  for (const [ingredientId, units] of requirements) {
    const { ingredient } = await adjustStock({ ingredientId, mode: 'delta', value: -units, type: TRANSACTION_TYPES.ORDER_DECREMENT, orderId, session });
    touched.push(ingredient);
  }
  return touched;
}
