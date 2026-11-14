import { useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import DataTable from '../../../components/domain/DataTable.jsx';
import StatusBadge from '../../../components/domain/StatusBadge.jsx';
import StockAdjustModal from '../../../components/domain/StockAdjustModal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States.jsx';
import { FilterChips, Pagination, PageHeading } from '../../../components/ui/misc.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePolling } from '../../../hooks/usePolling.js';
import { api } from '../../../api/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDateTime, timeAgo } from '../../../utils/dates.js';
import { TXN_LABEL } from '../../../utils/status.js';
import { downloadCsv } from '../../../utils/csv.js';

const TYPES = [{ key: '', label: 'All' }, { key: 'order_decrement', label: 'Orders' }, { key: 'manual_restock', label: 'Restocks' }, { key: 'manual_adjustment', label: 'Adjustments' }, { key: 'correction', label: 'Corrections' }, { key: 'wastage', label: 'Wastage' }];

export default function LedgerAlertsPage() {
  const toast = useToast();
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [adjust, setAdjust] = useState(null);
  const [auditing, setAuditing] = useState(false);
  const alerts = useAsync(() => api.admin.alerts(), []);
  const ledger = useAsync(() => api.admin.ledger({ type: type || undefined, search: search.trim() || undefined, page, limit: 12 }), [type, search, page]);
  usePolling(() => { alerts.reload(true); ledger.reload(true); }, 8000);
  const refresh = () => { alerts.reload(true); ledger.reload(true); };

  const audit = async () => {
    setAuditing(true);
    try { const r = await api.admin.runAudit(); toast(`Audit complete: ${r.notified} alert${r.notified === 1 ? '' : 's'} sent for ${r.checked} low items.`, { type: 'success' }); refresh(); } catch (e) { toast(e.message, { type: 'error' }); } finally { setAuditing(false); }
  };
  const exportCsv = () => downloadCsv((ledger.data?.items ?? []).map((t) => ({ Time: t.createdAt, Item: t.ingredientName, Type: TXN_LABEL[t.type] ?? t.type, Change: t.quantityChange, Before: t.quantityBefore, After: t.quantityAfter, Order: t.orderNumber ?? '', By: t.adminName ?? '', Note: t.note ?? '' })), 'stock-ledger.csv');

  const alertCols = [
    { key: 'name', header: 'Item', render: (a) => <span className="font-semibold">{a.name}</span> },
    { key: 'state', header: 'State', render: (a) => <StatusBadge status={a.state} /> },
    { key: 'quantity', header: 'Stock / threshold', render: (a) => <span className="tabular-nums">{a.quantity} / {a.threshold}</span> },
    { key: 'notified', header: 'Last email', render: (a) => (a.lastNotifiedAt ? `${timeAgo(a.lastNotifiedAt)} (${a.notifyCount}×)` : 'Not sent yet') },
    { key: 'actions', header: 'Action', render: (a) => <Button size="sm" variant={a.state === 'out' ? 'primary' : 'outline'} onClick={() => setAdjust({ id: a.ingredientId ?? a.id, name: a.name, quantity: a.quantity, threshold: a.threshold })}>{a.state === 'out' ? 'Emergency restock' : 'Restock'}</Button> },
  ];
  const ledgerCols = [
    { key: 'createdAt', header: 'Time', render: (t) => formatDateTime(t.createdAt) },
    { key: 'ingredientName', header: 'Item', render: (t) => <span className="font-semibold">{t.ingredientName}</span> },
    { key: 'type', header: 'Reason', render: (t) => TXN_LABEL[t.type] ?? t.type },
    { key: 'quantityChange', header: 'Change', className: 'text-right', render: (t) => <strong className={`tabular-nums ${t.quantityChange < 0 ? 'text-tomato-soft' : 'text-basil-soft'}`}>{t.quantityChange > 0 ? '+' : ''}{t.quantityChange}</strong> },
    { key: 'quantityAfter', header: 'Balance', className: 'text-right', render: (t) => <span className="tabular-nums">{t.quantityAfter}</span> },
    { key: 'ref', header: 'Reference', render: (t) => t.orderNumber ? `Order #${t.orderNumber}` : t.adminName ? `By ${t.adminName}` : '—' },
    { key: 'note', header: 'Note', render: (t) => <span className="muted">{t.note || '—'}</span> },
  ];

  const info = alerts.data;
  return (
    <div className="space-y-8">
      <PageHeading title="Stock ledger and low-stock alerts" action={<Button variant="outline" loading={auditing} onClick={audit}><Icon name="fact_check" />Run stock audit now</Button>}>An email goes to the admins when an item falls below its threshold, then at most once a day until it is restocked.</PageHeading>

      <section aria-label="System status" className="grid gap-4 sm:grid-cols-3">
        {[['schedule', 'Scheduled check', info ? `${info.cron.active ? 'Active' : 'Paused'} · ${info.cron.schedule}` : '…'], ['history', 'Last run', info?.cron.lastRunAt ? timeAgo(info.cron.lastRunAt) : 'No run yet'], ['warning', 'Items below threshold', info ? String(info.items.length) : '…']].map(([i, l, v]) => (
          <div key={l} className="card p-4"><p className="muted flex items-center gap-2 text-sm font-semibold"><Icon name={i} />{l}</p><p className="mt-1 font-semibold">{v}</p></div>
        ))}
      </section>

      <section aria-labelledby="aq-h">
        <h2 id="aq-h" className="mb-3 text-xl font-bold">Alert queue</h2>
        {alerts.loading ? <Skeleton className="h-32" /> : alerts.error ? <ErrorState error={alerts.error} onRetry={alerts.reload} /> : !info.items.length ? <EmptyState icon="verified" title="No active alerts">Every item is at or above its threshold.</EmptyState> : <DataTable columns={alertCols} rows={info.items} caption="Low-stock alerts" />}
      </section>

      <section aria-labelledby="lg-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="lg-h" className="text-xl font-bold">Stock ledger</h2><Button size="sm" variant="outline" onClick={exportCsv} disabled={!ledger.data?.items?.length}><Icon name="download" />Export this page (CSV)</Button></div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <FilterChips label="Reason" value={type} onChange={(v) => { setType(v); setPage(1); }} options={TYPES} />
          <label className="relative"><span className="sr-only">Search ledger</span><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dark" /><input className="input pl-10" placeholder="Item or order number" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
        </div>
        {ledger.loading ? <Skeleton className="h-64" /> : ledger.error ? <ErrorState error={ledger.error} onRetry={ledger.reload} /> : !ledger.data.items.length ? <EmptyState icon="history" title="No entries match">Try another reason or search.</EmptyState> : (
          <><DataTable columns={ledgerCols} rows={ledger.data.items} caption="Stock transactions" /><Pagination page={page} totalPages={ledger.data.meta.totalPages} onChange={setPage} /></>
        )}
      </section>
      {adjust && <StockAdjustModal item={adjust} onClose={() => setAdjust(null)} onDone={refresh} />}
    </div>
  );
}
