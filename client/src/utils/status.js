// Single source for status labels and icons (color is never the only signal).
export const ORDER_STEPS = [
  { key: "order_received", label: "Order received", icon: "receipt_long" },
  { key: "in_kitchen", label: "In kitchen", icon: "local_fire_department" },
  { key: "sent_to_delivery", label: "Sent to delivery", icon: "delivery_dining" },
];

export const STOCK_STATUS = {
  ok: { label: "In stock", icon: "check_circle", cls: "bg-basil text-white" },
  low: { label: "Low stock", icon: "warning", cls: "bg-cheese text-pan" },
  out: { label: "Out of stock", icon: "cancel", cls: "bg-tomato text-white" },
};
