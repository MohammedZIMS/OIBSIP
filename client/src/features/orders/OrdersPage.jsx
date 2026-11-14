import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import OrderStepper from '../../components/domain/OrderStepper.jsx';
import OrderCard from '../../components/domain/OrderCard.jsx';
import { OrderBadge } from '../../components/domain/StatusBadge.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePolling } from '../../hooks/usePolling.js';
import { api } from '../../api/index.js';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { linesFromOrder } from '../../utils/cart.js';
import { formatPaise } from '../../utils/money.js';
import { formatDateTime, formatTime } from '../../utils/dates.js';
import { ORDER_STATUS_META } from '../../utils/status.js';

const ETA_MIN = 35; // informational estimate, not a promise

function Detail({ order }) {
  return (
    <article className="card p-5" aria-label={`Order ${order.orderNumber}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-display text-2xl font-bold">#{order.orderNumber}</h2><p className="muted text-sm">Placed {formatDateTime(order.createdAt)} · {formatPaise(order.total)}</p></div>
        <OrderBadge status={order.status} />
      </div>
      {order.status !== 'sent_to_delivery' && <p className="mt-4 flex items-center gap-2 rounded-md bg-crust/40 px-3 py-2 text-sm"><Icon name="schedule" />Estimated arrival around <strong>{formatTime(new Date(new Date(order.createdAt).getTime() + ETA_MIN * 60000))}</strong> (estimate).</p>}
      <div className="mt-5"><OrderStepper status={order.status} history={order.statusHistory} /></div>
      <h3 className="mt-6 font-bold">Order details</h3>
      <ul className="mt-2 divide-y divide-line text-sm">
        {order.items.map((i, k) => (
          <li key={k} className="flex justify-between gap-4 py-2"><span><strong>{i.qty}× {i.name}</strong><span className="muted block">{i.components.map((c) => c.name).join(' · ')}</span></span><span className="tabular-nums">{formatPaise(i.unitPrice * i.qty)}</span></li>
        ))}
      </ul>
      <dl className="mt-3 text-sm">
        {[['Subtotal', order.subtotal], ['Packaging', order.packagingFee], ['Delivery', order.deliveryFee], ['Taxes', order.tax]].map(([l, v]) => <div key={l} className="flex justify-between py-0.5"><dt className="muted">{l}</dt><dd className="tabular-nums">{formatPaise(v)}</dd></div>)}
        <div className="mt-1 flex justify-between border-t border-line pt-2 font-bold"><dt>Total paid</dt><dd className="tabular-nums">{formatPaise(order.total)}</dd></div>
      </dl>
      {order.address && <p className="muted mt-4 text-sm"><strong>Delivering to:</strong> {[order.address.line1, order.address.line2, order.address.city, order.address.pincode].filter(Boolean).join(', ')}</p>}
    </article>
  );
}

export default function OrdersPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const [tab, setTab] = useState('active');
  const active = useAsync(() => api.orders.active(), []);
  const history = useAsync(() => api.orders.mine(), []);
  const seen = useRef(null);

  const refresh = () => { active.reload(true); history.reload(true); };
  usePolling(refresh, 5000); // real-time stand-in: re-checks every 5 s (Socket.IO replaces this later)

  useEffect(() => { // announce status changes
    if (!active.data) return;
    const now = Object.fromEntries(active.data.map((o) => [o.id, o.status]));
    if (seen.current) for (const [oid, st] of Object.entries(now)) if (seen.current[oid] && seen.current[oid] !== st) toast(`Order #${active.data.find((o) => o.id === oid).orderNumber} is now: ${ORDER_STATUS_META[st].label}`, { type: 'info' });
    seen.current = now;
  }, [active.data, toast]);

  const all = history.data ?? [];
  const selected = all.find((o) => o.id === id) ?? active.data?.find((o) => o.id === id) ?? (id ? null : active.data?.[0]);
  const reorder = (o) => { linesFromOrder(o).forEach((l) => cart.add(l)); toast('Items added to your cart', { type: 'success', ms: 3000 }); nav('/checkout'); };

  const Tabs = (
    <div role="tablist" aria-label="Orders" className="mb-6 flex gap-2 border-b border-line">
      {[['active', `Active (${active.data?.length ?? 0})`], ['history', `History (${all.length})`]].map(([k, l]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-4 px-4 py-2 font-semibold ${tab === k ? 'border-tomato' : 'border-transparent muted'}`}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">My orders</h1>
      <p className="muted mt-2 mb-6">Status updates appear here automatically.</p>
      {Tabs}
      {(active.error || history.error) && <ErrorState error={active.error ?? history.error} onRetry={refresh} />}
      {tab === 'active' && !active.error && (
        active.loading ? <Skeleton className="h-64" /> : !active.data.length && !selected
          ? <EmptyState icon="local_pizza" title="No active orders" action={<Button to="/dashboard" className="mt-3">Browse the menu</Button>}>When you place an order you can follow it here.</EmptyState>
          : (
            <div className="grid gap-6 lg:grid-cols-3">
              <ul className="space-y-3 lg:col-span-1">{active.data.map((o) => <li key={o.id}><OrderCard order={o} selected={selected?.id === o.id} onClick={() => nav(`/orders/${o.id}`)} /></li>)}</ul>
              <div className="lg:col-span-2">{selected ? <Detail order={selected} /> : <EmptyState icon="search_off" title="Order not found">Pick an order from the list.</EmptyState>}</div>
            </div>
          )
      )}
      {tab === 'history' && !history.error && (
        history.loading ? <Skeleton className="h-40" /> : !all.length ? <EmptyState icon="receipt_long" title="No past orders yet">Delivered and past orders will be listed here.</EmptyState> : (
          <ul className="grid gap-4 md:grid-cols-2">
            {all.map((o) => <li key={o.id}><OrderCard order={o}><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => { setTab('active'); nav(`/orders/${o.id}`); }}>View details</Button><Button size="sm" onClick={() => reorder(o)}><Icon name="replay" />Re-order</Button></div></OrderCard></li>)}
          </ul>
        )
      )}
      <p className="muted mt-10 text-sm"><Link to="/dashboard" className="font-semibold text-brick underline">Back to the menu</Link></p>
    </div>
  );
}
