import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import StatusBadge from '../../../components/domain/StatusBadge.jsx';
import StockAdjustModal from '../../../components/domain/StockAdjustModal.jsx';
import DataTable from '../../../components/domain/DataTable.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States.jsx';
import { FilterChips, PageHeading } from '../../../components/ui/misc.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePolling } from '../../../hooks/usePolling.js';
import { api } from '../../../api/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatPaise } from '../../../utils/money.js';
import { CATEGORIES, stockStatusOf } from '../../../utils/status.js';
import { downloadCsv } from '../../../utils/csv.js';

export default function InventoryPage() {
  const toast = useToast();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [adjust, setAdjust] = useState(null);
  const [auditing, setAuditing] = useState(false);
  const { data, error, loading, reload } = useAsync(() => api.admin.inventory({ category: category || undefined, search: search.trim() || undefined }), [category, search]);
  usePolling(() => reload(true), 8000);

  const audit = async () => {
    setAuditing(true);
    try { const r = await api.admin.runAudit(); toast(`Stock audit done: ${r.checked} items below threshold, ${r.notified} alert${r.notified === 1 ? '' : 's'} sent.`, { type: 'success' }); } catch (e) { toast(e.message, { type: 'error' }); } finally { setAuditing(false); }
  };
  const exportCsv = () => downloadCsv((data ?? []).map((i) => ({ Name: i.name, Category: i.category, Quantity: i.quantity, Threshold: i.threshold, Status: stockStatusOf(i), 'Price (INR)': i.price / 100 })), 'inventory.csv');

  const columns = [
    { key: 'name', header: 'Item', render: (i) => <span className="font-semibold">{i.name}</span> },
    { key: 'category', header: 'Category', render: (i) => <span className="capitalize">{i.category === 'veggie' ? 'vegetable' : i.category}</span> },
    { key: 'quantity', header: 'In stock', className: 'text-right', render: (i) => <span className="tabular-nums">{i.quantity} {i.unit !== 'unit' ? i.unit : ''}</span> },
    { key: 'threshold', header: 'Threshold', className: 'text-right', render: (i) => <span className="tabular-nums">{i.threshold}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={stockStatusOf(i)} /> },
    { key: 'price', header: 'Price', className: 'text-right', render: (i) => <span className="tabular-nums">{formatPaise(i.price)}</span> },
    { key: 'actions', header: 'Actions', render: (i) => <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setAdjust(i)}>Adjust</Button><Button size="sm" variant="ghost" to={`/admin/inventory/${i.id}/edit`}>Edit</Button></div> },
  ];

  return (
    <div>
      <PageHeading title="Inventory" action={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" loading={auditing} onClick={audit}><Icon name="fact_check" />Run stock audit</Button><Button variant="outline" size="sm" onClick={exportCsv} disabled={!data?.length}><Icon name="download" />Export CSV</Button><Button size="sm" to="/admin/inventory/new"><Icon name="add" />Add ingredient</Button></div>}>Current stock for bases, sauces, cheeses and vegetables. Every change is written to the <Link to="/admin/ledger" className="underline">stock ledger</Link>.</PageHeading>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips label="Category" value={category} onChange={setCategory} options={[{ key: '', label: 'All' }, ...CATEGORIES]} />
        <label className="relative"><span className="sr-only">Search ingredients</span><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dark" /><input className="input pl-10" placeholder="Search ingredients" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      </div>
      {loading ? <Skeleton className="h-64" /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState icon="search_off" title="No ingredients found">Try another category or search.</EmptyState> : (
        <DataTable columns={columns} rows={data} caption="Ingredient stock" rowClass={(i) => (stockStatusOf(i) === 'out' ? 'bg-tomato/10' : stockStatusOf(i) === 'low' ? 'bg-cheese/10' : '')} />
      )}
      {adjust && <StockAdjustModal item={adjust} onClose={() => setAdjust(null)} onDone={() => reload(true)} />}
    </div>
  );
}
