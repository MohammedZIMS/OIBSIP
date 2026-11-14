// Display-only totals. The server recomputes every price; these constants mirror its defaults.
export const PRICING = { taxPercent: 5, deliveryFee: 4000, packagingFee: 4000 }; // paise

export function computeTotals(items) {
  const subtotal = items.reduce((t, i) => t + i.unitPrice * i.qty, 0);
  const tax = Math.round((subtotal * PRICING.taxPercent) / 100);
  const deliveryFee = items.length ? PRICING.deliveryFee : 0;
  const packagingFee = items.length ? PRICING.packagingFee : 0;
  return { subtotal, tax, deliveryFee, packagingFee, total: subtotal + tax + deliveryFee + packagingFee };
}
