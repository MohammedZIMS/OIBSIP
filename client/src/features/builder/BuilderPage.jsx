import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import PizzaArt from '../../components/domain/PizzaArt.jsx';
import { ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { QuantityStepper } from '../../components/ui/misc.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { api } from '../../api/index.js';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPaise } from '../../utils/money.js';

const MAX_VEGGIES = 8;
const STEPS = [
  { key: 'base', title: 'Choose your base', help: 'Pick one of five dough styles.', multi: false },
  { key: 'sauce', title: 'Choose your sauce', help: 'Pick one sauce.', multi: false },
  { key: 'cheese', title: 'Choose your cheese', help: 'Pick one cheese.', multi: false },
  { key: 'veggie', title: 'Add vegetables', help: `Pick up to ${MAX_VEGGIES}. Vegetables are optional.`, multi: true },
];

function Option({ item, selected, onSelect, disabled }) {
  const out = !item.inStock;
  return (
    <button type="button" aria-pressed={selected} disabled={out || disabled} onClick={onSelect}
      className={`card relative flex flex-col items-start gap-1 border-2 p-4 text-left transition-colors ${selected ? 'border-onion bg-crust/35' : 'border-line hover:border-toast'} ${out ? 'opacity-50' : ''} disabled:cursor-not-allowed`}>
      <span className="font-semibold">{item.name}</span>
      <span className="muted text-sm">{out ? 'Out of stock' : `+${formatPaise(item.price)}`}</span>
      {selected && <Icon name="check_circle" className="absolute right-3 top-3 text-onion" />}
    </button>
  );
}

export default function BuilderPage() {
  const cart = useCart();
  const toast = useToast();
  const nav = useNavigate();
  const { data, error, loading, reload } = useAsync(() => api.catalogue.ingredients(), []);
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState({ base: null, sauce: null, cheese: null, veggie: [] });
  const [qty, setQty] = useState(1);

  const by = useMemo(() => Object.fromEntries(['base', 'sauce', 'cheese', 'veggie'].map((c) => [c, (data ?? []).filter((i) => i.category === c)])), [data]);
  const chosen = useMemo(() => {
    const find = (c, id) => by[c].find((i) => i.id === id);
    return [find('base', pick.base), find('sauce', pick.sauce), find('cheese', pick.cheese), ...pick.veggie.map((id) => find('veggie', id))].filter(Boolean);
  }, [by, pick]);
  const unitPrice = chosen.reduce((t, i) => t + i.price, 0);
  const cur = STEPS[step];
  const canNext = cur.key === 'veggie' || Boolean(pick[cur.key]);

  const choose = (item) => setPick((p) => cur.multi
    ? { ...p, veggie: p.veggie.includes(item.id) ? p.veggie.filter((x) => x !== item.id) : p.veggie.length < MAX_VEGGIES ? [...p.veggie, item.id] : p.veggie }
    : { ...p, [cur.key]: item.id });

  const addToCart = () => {
    cart.add({ kind: 'custom', baseId: pick.base, sauceId: pick.sauce, cheeseId: pick.cheese, veggieIds: pick.veggie, name: 'Custom pizza', unitPrice, qty, components: chosen.map((c) => c.name) });
    toast('Custom pizza added to your order', { type: 'success', ms: 3000 });
    nav('/checkout');
  };

  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Build your own pizza</h1>
      <ol aria-label="Progress" className="mt-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} aria-current={i === step ? 'step' : undefined}>
            <button type="button" disabled={i > step} onClick={() => setStep(i)} className="w-full text-left">
              <span className={`block h-2 rounded-full ${i < step ? 'bg-onion' : i === step ? 'bg-oven' : 'bg-line'}`} />
              <span className={`mt-1 block text-xs font-semibold sm:text-sm ${i === step ? '' : 'muted'}`}>{i + 1}. {s.key === 'veggie' ? 'Vegetables' : s.key[0].toUpperCase() + s.key.slice(1)}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="step-h">
          <h2 id="step-h" className="text-2xl font-bold">{cur.title}</h2>
          <p className="muted mt-1">{cur.help}</p>
          {loading ? <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{Array.from({ length: 6 }, (_, k) => <Skeleton key={k} className="h-20" />)}</div> : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {by[cur.key].map((item) => {
                const selected = cur.multi ? pick.veggie.includes(item.id) : pick[cur.key] === item.id;
                return <Option key={item.id} item={item} selected={selected} onSelect={() => choose(item)} disabled={cur.multi && !selected && pick.veggie.length >= MAX_VEGGIES} />;
              })}
            </div>
          )}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="arrow_back" /> Back</Button>
            {step < STEPS.length - 1
              ? <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Next <Icon name="arrow_forward" /></Button>
              : <Button disabled={!(pick.base && pick.sauce && pick.cheese)} onClick={addToCart}><Icon name="add_shopping_cart" /> Add to order · {formatPaise(unitPrice * qty)}</Button>}
          </div>
        </section>

        <aside className="card h-fit p-5 lg:sticky lg:top-24" aria-label="Your pizza">
          <div className="flex justify-center"><PizzaArt variant="margherita" className="h-32 w-32" /></div>
          <h2 className="mt-3 text-lg font-bold">Your pizza</h2>
          {chosen.length === 0 ? <p className="muted mt-2 text-sm">Your choices appear here as you pick them.</p> : (
            <ul className="mt-2 divide-y divide-line text-sm">
              {chosen.map((c) => <li key={c.id} className="flex justify-between py-1.5"><span>{c.name} <span className="muted">({c.category === 'veggie' ? 'vegetable' : c.category})</span></span><span className="tabular-nums">{formatPaise(c.price)}</span></li>)}
            </ul>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3"><span className="font-semibold">Per pizza</span><span className="font-display text-xl font-extrabold tabular-nums">{formatPaise(unitPrice)}</span></div>
          <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold">Quantity</span><QuantityStepper value={qty} onChange={setQty} /></div>
        </aside>
      </div>
    </div>
  );
}
