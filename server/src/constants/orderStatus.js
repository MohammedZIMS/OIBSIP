export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  ORDER_RECEIVED: 'order_received',
  IN_KITCHEN: 'in_kitchen',
  SENT_TO_DELIVERY: 'sent_to_delivery',
});
export const ORDER_STATUSES = Object.values(ORDER_STATUS);

// Admin-driven transitions are forward-only (PRD M-3).
export const NEXT_STATUS = Object.freeze({
  [ORDER_STATUS.ORDER_RECEIVED]: ORDER_STATUS.IN_KITCHEN,
  [ORDER_STATUS.IN_KITCHEN]: ORDER_STATUS.SENT_TO_DELIVERY,
});

export const canTransition = (from, to) => NEXT_STATUS[from] === to;
