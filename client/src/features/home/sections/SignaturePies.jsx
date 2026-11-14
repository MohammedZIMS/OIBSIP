import { useMemo, useState } from 'react';
import PizzaCard from '../../../components/domain/PizzaCard.jsx';
import { ErrorState, Skeleton } from '../../../components/ui/States.jsx';
import { FilterChips } from '../../../components/ui/misc.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { api } from '../../../api/index.js';
import { FILTERS } from '../homeData.js';

export default function SignaturePies() {
  const [filter, setFilter] = useState('All');
  const { data, error, loading, reload } = useAsync(() => api.catalogue.pizzas(), []);
  const visible = useMemo(() => (data ?? []).filter((p) => filter === 'All' || p.tags?.includes(filter)), [data, filter]);

  return (
    <section id="menu" className="bg-crust/25 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Signature pies from the hearth</h2>
            <p className="muted mt-3 max-w-xl">Hand-stretched and baked to order.</p>
          </div>
          <FilterChips label="Filter pizzas" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        <div className="mt-8">
          {loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-80" />)}</div>
            : error ? <ErrorState error={error} onRetry={reload} />
            : visible.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{visible.map((p) => <PizzaCard key={p.id} pizza={p} />)}</div>
            : <p className="card p-6 muted">No pizzas match this filter. Try another one.</p>}
        </div>
      </div>
    </section>
  );
}
