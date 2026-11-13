export const INGREDIENT_CATEGORIES = Object.freeze(['base', 'sauce', 'cheese', 'veggie']);
export const INGREDIENT_UNITS = Object.freeze(['unit', 'kg', 'g', 'l', 'ml']);
export const DEFAULT_THRESHOLD = 20;

export const TRANSACTION_TYPES = Object.freeze({
  INITIAL: 'initial',
  ORDER_DECREMENT: 'order_decrement',
  MANUAL_RESTOCK: 'manual_restock',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
  CORRECTION: 'correction',
  WASTAGE: 'wastage',
});

export const ALERT_STATUS = Object.freeze({ OPEN: 'open', RESOLVED: 'resolved' });
