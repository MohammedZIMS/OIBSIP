import { OrderBadge } from './StatusBadge.jsx';
import { formatPaise } from '../../utils/money.js';
import { formatDateTime } from '../../utils/dates.js';

export const itemsSummary = (o) => o.items.map((i) => `${i.qty}× ${i.name}`).join(', ');

export default function OrderCard({ order, children, onClick, selected }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} aria-pressed={onClick ? selected : undefined}
      className={`card block w-full p-4 text-left ${selected ? 'ring-2 ring-onion' : ''} ${onClick ? 'hover:border-toast' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-lg font-bold">#{order.orderNumber}</p>
        <OrderBadge status={order.status} />
      </div>
      <p className="muted mt-1 text-sm">{formatDateTime(order.createdAt)} · {formatPaise(order.total)}</p>
      <p className="mt-2 text-sm">{itemsSummary(order)}</p>
      {children}
    </Tag>
  );
}
