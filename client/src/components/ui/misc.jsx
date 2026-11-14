import Icon from './Icon.jsx';

export function FilterChips({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const key = typeof o === 'string' ? o : o.key;
        const text = typeof o === 'string' ? o : o.label;
        return (
          <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)} className={`chip ${value === key ? 'chip-on' : 'chip-off'}`}>
            {text}{typeof o !== 'string' && o.count !== undefined && <span className="ml-1.5 opacity-80">({o.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 10, label = 'Quantity' }) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-md border-2 border-toast dark:border-white/40">
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex h-9 w-9 items-center justify-center hover:bg-crust/50 disabled:opacity-40 dark:hover:bg-white/10"><Icon name="remove" /></button>
      <output aria-live="polite" className="w-8 text-center font-semibold tabular-nums">{value}</output>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex h-9 w-9 items-center justify-center hover:bg-crust/50 disabled:opacity-40 dark:hover:bg-white/10"><Icon name="add" /></button>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4">
      <button type="button" className="chip chip-off disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="muted text-sm">Page {page} of {totalPages}</span>
      <button type="button" className="chip chip-off disabled:opacity-40" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}

export const PageHeading = ({ title, children, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>{children && <p className="muted mt-2 max-w-2xl">{children}</p>}</div>
    {action}
  </div>
);
