import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import StatusBadge, { OrderBadge } from '../../../components/domain/StatusBadge.jsx';
import StockAdjustModal from '../../../components/domain/StockAdjustModal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States.jsx';
import { FilterChips } from '../../../components/ui/misc.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePolling } from '../../../hooks/usePolling.js';
import { api } from '../../../api/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatPaise } from '../../../utils/money.js';
import { timeAgo } from '../../../utils/dates.js';
import { NEXT_ACTION_LABEL, NEXT_STATUS } from '../../../utils/status.js';
import { itemsSummary } from '../../../components/domain/OrderCard.jsx';

const Kpi = ({ icon, label, value, sub, tone = '' }) => (
  <div className="card p-5"><p className="muted flex items-center gap-2 text-sm font-semibold"><Icon name={icon} />{label}</p><p className={`mt-2 font-display text-3xl font-extrabold tabular-nums ${tone}`}>{value}</p>{sub && <p className="muted mt-1 text-sm">{sub}</p>}</div>
);

export default function AdminDashboardPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [adjust, setAdjust] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const summary = useAsync(() => api.admin.summary(), []);
  const orders = useAsync(() => api.admin.orders({ status: filter || undefined, limit: 20 }), [filter]);
  const alerts = useAsync(() => api.admin.alerts(), []);
  const known = useRef(null);

  const refresh = () => { summary.reload(true); orders.reload(true); alerts.reload(true); };
  usePolling(refresh, 5000);

  useEffect(() => { // announce new orders
    if (!orders.data) return;
    const ids = new Set(orders.data.items.map((o) => o.id));
    if (known.current) orders.data.items.filter((o) => !known.current.has(o.id)).forEach((o) => toast(`New order #${o.orderNumber} · ${formatPaise(o.total)}`, { type: 'success' }));
    known.current = ids;
  }, [orders.data, toast]);

  const advance = async (o) => {
    setBusyId(o.id);
    try { await api.admin.advance(o.id, NEXT_STATUS[o.status]); await refresh(); } catch (e) { toast(e.message, { type: 'error' }); refresh(); } finally { setBusyId(null); }
  };

  const s = summary.data;
  const counts = orders.data?.meta?.counts ?? {};
  const crit = alerts.data?.items ?? [];
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold sm:text-4xl">Operations dashboard</h1><p className="muted mt-1">Orders and stock refresh automatically every few seconds.</p></div>

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.loading ? [1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-28" />) : summary.error ? <div className="sm:col-span-4"><ErrorState error={summary.error} onRetry={summary.reload} /></div> : (
          <>
            <Kpi icon="payments" label="Revenue today" value={formatPaise(s.revenueToday)} sub={`${s.ordersToday} paid orders · avg ${formatPaise(s.avgTicket)}`} />
            <Kpi icon="receipt_long" label="Order received" value={s.live.order_received} sub="Waiting for the kitchen" />
            <Kpi icon="local_fire_department" label="In kitchen" value={s.live.in_kitchen} sub={`${s.live.sent_to_delivery} sent to delivery`} />
            <Kpi icon="warning" label="Items below threshold" value={s.criticalCount} tone={s.criticalCount ? 'text-cheese' : ''} sub={<Link to="/admin/ledger" className="underline">Open stock alerts</Link>} />
          </>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="q-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="q-h" className="text-xl font-bold">Live order queue</h2>
            <FilterChips label="Filter orders" value={filter} onChange={setFilter} options={[{ key: '', label: 'All', count: counts.all }, { key: 'order_received', label: 'Received', count: counts.order_received }, { key: 'in_kitchen', label: 'Kitchen', count: counts.in_kitchen }, { key: 'sent_to_delivery', label: 'Delivery', count: counts.sent_to_delivery }]} /></div>
          {orders.loading ? <Skeleton className="h-48" /> : orders.error ? <ErrorState error={orders.error} onRetry={orders.reload} /> : !orders.data.items.length ? <EmptyState icon="local_pizza" title="No orders here yet">New paid orders appear instantly.</EmptyState> : (
            <ul className="space-y-3">
              {orders.data.items.map((o) => (
                <li key={o.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><Link to={`/admin/orders/${o.id}`} className="font-display text-lg font-bold underline-offset-4 hover:underline">#{o.orderNumber}</Link> <span className="muted text-sm">· {timeAgo(o.createdAt)}</span><p className="mt-1 text-sm">{itemsSummary(o)}</p>{o.notes && <p className="mt-1 text-sm text-cheese">Note: {o.notes}</p>}</div>
                    <div className="text-right"><p className="font-semibold tabular-nums">{formatPaise(o.total)}</p><OrderBadge status={o.status} /></div>
                  </div>
                  {NEXT_STATUS[o.status] && <div className="mt-3"><Button size="sm" loading={busyId === o.id} onClick={() => advance(o)}>{NEXT_ACTION_LABEL[o.status]}<Icon name="arrow_forward" /></Button></div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="w-h">
          <h2 id="w-h" className="mb-3 text-xl font-bold">Stock watchlist</h2>
          {alerts.loading ? <Skeleton className="h-48" /> : alerts.error ? <ErrorState error={alerts.error} onRetry={alerts.reload} /> : !crit.length ? <EmptyState icon="inventory_2" title="All stock is healthy">Nothing is below its threshold.</EmptyState> : (
            <ul className="space-y-3">
              {crit.map((a) => (
                <li key={a.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{a.name}</p><p className="muted text-sm capitalize">{a.category}</p></div><StatusBadge status={a.state} /></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={a.threshold} aria-valuenow={a.quantity} aria-label={`${a.name} stock`}><div className={`h-full ${a.state === 'out' ? 'bg-tomato' : 'bg-cheese'}`} style={{ width: `${Math.min(100, (a.quantity / a.threshold) * 100)}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-sm"><span>{a.quantity} left · threshold {a.threshold}</span><Button size="sm" variant="outline" onClick={() => setAdjust({ id: a.ingredientId ?? a.id, name: a.name, quantity: a.quantity, threshold: a.threshold })}>Restock</Button></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {adjust && <StockAdjustModal item={adjust} onClose={() => setAdjust(null)} onDone={refresh} />}
    </div>
  );
}
