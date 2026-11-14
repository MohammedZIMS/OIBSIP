import { useAsync } from '../../../hooks/useAsync.js';
import { api } from '../../../api/index.js';
import { TXN_LABEL } from '../../../utils/status.js';
import { formatDateTime } from '../../../utils/dates.js';

export function DataRecent({ name }) {
  const { data, loading } = useAsync(() => api.admin.ledger({ search: name, limit: 6 }), [name]);
  return (
    <aside className="card h-fit p-5" aria-labelledby="ra-h">
      <h2 id="ra-h" className="text-lg font-bold">Recent stock changes</h2>
      {loading ? <p className="muted mt-3 text-sm">Loading…</p> : !data?.items?.length ? <p className="muted mt-3 text-sm">No changes recorded yet.</p> : (
        <ul className="mt-3 divide-y divide-white/10 text-sm">
          {data.items.map((t) => <li key={t.id} className="py-2"><div className="flex justify-between"><span>{TXN_LABEL[t.type] ?? t.type}</span><strong className={`tabular-nums ${t.quantityChange < 0 ? 'text-tomato-soft' : 'text-basil-soft'}`}>{t.quantityChange > 0 ? '+' : ''}{t.quantityChange}</strong></div><p className="muted">{formatDateTime(t.createdAt)} · now {t.quantityAfter}</p></li>)}
        </ul>
      )}
    </aside>
  );
}
