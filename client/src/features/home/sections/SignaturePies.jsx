import { useMemo, useState } from 'react';
import PizzaCard from '../../../components/domain/PizzaCard.jsx';
import { FILTERS, PIZZAS } from '../homeData.js';

export default function SignaturePies() {
  const [filter, setFilter] = useState('All');
  const visible = useMemo(
    () => (filter === 'All' ? PIZZAS : PIZZAS.filter((p) => p.tags.includes(filter))),
    [filter],
  );

  return (
    <section id="menu" className="bg-crust/25 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Signature pies from the hearth</h2>
            <p className="mt-3 max-w-xl text-ink-muted">Hand-stretched and baked to order.</p>
          </div>
          <div role="group" aria-label="Filter pizzas" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                  filter === f ? 'border-onion bg-onion text-parchment' : 'border-toast bg-white text-pan hover:bg-crust/40'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {visible.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((p) => <PizzaCard key={p.id} pizza={p} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-md bg-white p-6 text-ink-muted">No pizzas match this filter. Try another one.</p>
        )}
      </div>
    </section>
  );
}
