import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import DataTable from '../../../components/domain/DataTable.jsx';
import { OrderBadge } from '../../../components/domain/StatusBadge.jsx';
import { itemsSummary } from '../../../components/domain/OrderCard.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States.jsx';
import { FilterChips, Pagination, PageHeading } from '../../../components/ui/misc.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePolling } from '../../../hooks/usePolling.js';
import { api } from '../../../api/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatPaise } from '../../../utils/money.js';
import { formatDateTime } from '../../../utils/dates.js';
import { NEXT_ACTION_LABEL, NEXT_STATUS } from '../../../utils/status.js';

export default function AdminOrdersPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const { data, error, loading, reload } = useAsync(() => api.admin.orders({ status: status || undefined, search: search.trim() || undefined, page, limit: 10 }), [status, search, page]);
  usePolling(() => reload(true), 5000);

  const advance = async (o) => {
    setBusy(o.id);
    try { await api.admin.advance(o.id, NEXT_STATUS[o.status]); await reload(true); } catch (e) { toast(e.message, { type: 'error' }); reload(true); } finally { setBusy(null); }
  };
  const c = data?.meta?.counts ?? {};
  const columns = [
    { key: 'orderNumber', header: 'Order', render: (o) => <Link to={`/admin/orders/${o.id}`} className="font-display font-bold underline-offset-4 hover:underline">#{o.orderNumber}{o.needsReview && <Icon name="flag" className="ml-1 align-middle text-base text-tomato-soft" />}</Link> },
    { key: 'customer', header: 'Customer', render: (o) => o.customer?.name ?? '—' },
    { key: 'items', header: 'Items', render: (o) => <span className="line-clamp-2 max-w-xs">{itemsSummary(o)}</span> },
    { key: 'total', header: 'Total', className: 'text-right', render: (o) => <span className="tabular-nums">{formatPaise(o.total)}</span> },
    { key: 'status', header: 'Status', render: (o) => <OrderBadge status={o.status} /> },
    { key: 'createdAt', header: 'Placed', render: (o) => formatDateTime(o.createdAt) },
    { key: 'actions', header: 'Actions', render: (o) => <div className="flex gap-1">{NEXT_STATUS[o.status] && <Button size="sm" loading={busy === o.id} onClick={() => advance(o)}>{NEXT_ACTION_LABEL[o.status]}</Button>}<Button size="sm" variant="ghost" to={`/admin/orders/${o.id}`}>Details</Button></div> },
  ];
  return (
    <div>
      <PageHeading title="Orders">All paid orders, newest first. Status changes reach the customer within seconds.</PageHeading>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips label="Order status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ key: '', label: 'All', count: c.all }, { key: 'order_received', label: 'Order received', count: c.order_received }, { key: 'in_kitchen', label: 'In kitchen', count: c.in_kitchen }, { key: 'sent_to_delivery', label: 'Sent to delivery', count: c.sent_to_delivery }]} />
        <label className="relative"><span className="sr-only">Search orders</span><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dark" /><input className="input pl-10" placeholder="Order number or customer" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
      </div>
      {loading ? <Skeleton className="h-64" /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.items.length ? <EmptyState icon="receipt_long" title="No orders found">Orders appear here after customers pay.</EmptyState> : (
        <><DataTable columns={columns} rows={data.items} caption="Orders" /><Pagination page={page} totalPages={Math.max(1, Math.ceil(data.meta.total / data.meta.limit))} onChange={setPage} /></>
      )}
    </div>
  );
}
