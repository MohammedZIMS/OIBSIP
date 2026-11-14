import { formatPaise } from '../../utils/money.js';

export default function PriceBreakdown({ totals, className = '' }) {
  const row = (label, v) => (
    <div className="flex justify-between py-1 text-sm"><dt className="muted">{label}</dt><dd className="tabular-nums">{formatPaise(v)}</dd></div>
  );
  return (
    <dl className={className}>
      {row('Items', totals.subtotal)}
      {row('Packaging', totals.packagingFee)}
      {row('Delivery', totals.deliveryFee)}
      {row('Taxes (5% GST)', totals.tax)}
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3 dark:border-white/10">
        <dt className="font-bold">Total payable</dt><dd className="font-display text-2xl font-extrabold tabular-nums text-tomato dark:text-cheese">{formatPaise(totals.total)}</dd>
      </div>
    </dl>
  );
}
