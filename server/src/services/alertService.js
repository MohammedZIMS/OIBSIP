import { Ingredient, InventoryAlert } from '../models/index.js';
import { ALERT_STATUS } from '../constants/inventory.js';

/** Opens, updates or resolves the alert for one ingredient based on its current stock. */
export async function syncIngredient(ingredient) {
  const low = ingredient.isActive && ingredient.quantity < ingredient.threshold;
  try {
    if (low) {
      await InventoryAlert.updateOne(
        { ingredient: ingredient._id, status: ALERT_STATUS.OPEN },
        { $set: { quantityAtAlert: ingredient.quantity, threshold: ingredient.threshold } },
        { upsert: true },
      );
    } else {
      await InventoryAlert.updateOne(
        { ingredient: ingredient._id, status: ALERT_STATUS.OPEN },
        { $set: { status: ALERT_STATUS.RESOLVED, resolvedAt: new Date() } },
      );
    }
  } catch (err) {
    if (err?.code !== 11000) throw err; // a concurrent request already opened the alert
  }
}

/** Safety net used by the cron job: makes alerts match current stock for every ingredient. */
export async function reconcileAll() {
  const items = await Ingredient.find().select('quantity threshold isActive').lean();
  for (const item of items) await syncIngredient(item);
  return items.length;
}

/** Open alerts that have never been emailed, or were last emailed before the cool-down window. */
export function findDueForNotification(cooldownHours) {
  const cutoff = new Date(Date.now() - cooldownHours * 3600 * 1000);
  return InventoryAlert.find({
    status: ALERT_STATUS.OPEN,
    $or: [{ lastNotifiedAt: null }, { lastNotifiedAt: { $lt: cutoff } }],
  }).populate('ingredient', 'name category unit');
}

export const markNotified = (ids) =>
  InventoryAlert.updateMany({ _id: { $in: ids } }, { $set: { lastNotifiedAt: new Date(), lastError: null }, $inc: { notifyCount: 1 } });

export const markNotifyFailed = (ids, message) =>
  InventoryAlert.updateMany({ _id: { $in: ids } }, { $set: { lastError: String(message).slice(0, 300) } });
