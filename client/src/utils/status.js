// Single source for status labels and icons (color is never the only signal).
export const ORDER_STEPS = [
  { key: 'order_received', label: 'Order received', icon: 'receipt_long' },
  { key: 'in_kitchen', label: 'In kitchen', icon: 'local_fire_department' },
  { key: 'sent_to_delivery', label: 'Sent to delivery', icon: 'delivery_dining' },
];
export const ORDER_STATUS_META = {
  pending_payment: { label: 'Payment pending', icon: 'schedule', cls: 'bg-toast text-white' },
  order_received: { label: 'Order received', icon: 'receipt_long', cls: 'bg-cheese text-pan' },
  in_kitchen: { label: 'In kitchen', icon: 'local_fire_department', cls: 'bg-rust text-white' },
  sent_to_delivery: { label: 'Sent to delivery', icon: 'delivery_dining', cls: 'bg-basil text-white' },
};
export const NEXT_STATUS = { order_received: 'in_kitchen', in_kitchen: 'sent_to_delivery' };
export const NEXT_ACTION_LABEL = { order_received: 'Move to kitchen', in_kitchen: 'Mark sent to delivery' };
export const stepIndex = (status) => ORDER_STEPS.findIndex((s) => s.key === status);
export const isActiveOrder = (o) => ['order_received', 'in_kitchen', 'sent_to_delivery'].includes(o.status);

export const STOCK_STATUS = {
  ok: { label: 'In stock', icon: 'check_circle', cls: 'bg-basil text-white' },
  low: { label: 'Low stock', icon: 'warning', cls: 'bg-cheese text-pan' },
  out: { label: 'Out of stock', icon: 'cancel', cls: 'bg-tomato text-white' },
};
export const stockStatusOf = (i) => (i.quantity <= 0 ? 'out' : i.quantity < i.threshold ? 'low' : 'ok');
export const CATEGORIES = [
  { key: 'base', label: 'Bases' },
  { key: 'sauce', label: 'Sauces' },
  { key: 'cheese', label: 'Cheeses' },
  { key: 'veggie', label: 'Vegetables' },
];
export const TXN_LABEL = {
  initial: 'Initial stock', order_decrement: 'Order', manual_restock: 'Restock', manual_adjustment: 'Adjustment', correction: 'Correction', wastage: 'Wastage',
};
