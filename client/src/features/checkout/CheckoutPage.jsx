import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import TextField from '../../components/ui/TextField.jsx';
import AddressForm from '../../components/domain/AddressForm.jsx';
import PriceBreakdown from '../../components/domain/PriceBreakdown.jsx';
import { EmptyState, Skeleton } from '../../components/ui/States.jsx';
import { QuantityStepper } from '../../components/ui/misc.jsx';
import { FormAlert } from '../auth/AuthCard.jsx';
import { usePayment } from './payment.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { api, API_MODE } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { toOrderItems } from '../../utils/cart.js';
import { formatPaise } from '../../utils/money.js';
import { isPhone } from '../../utils/validators.js';

const snapshot = ({ line1, line2, city, state, pincode }) => ({ line1, line2, city, state, pincode });
const oneLine = (a) => [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ');

export default function CheckoutPage() {
  const { who } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const nav = useNavigate();
  const [pay, payModal] = usePayment();
  const addrs = useAsync(() => api.profile.addresses(), []);
  const [selected, setSelected] = useState(null);
  const [manual, setManual] = useState(null); // address typed in when saving is unavailable
  const [adding, setAdding] = useState(false);
  const [phone, setPhone] = useState(who.phone ?? '');
  const [notes, setNotes] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const list = addrs.data ?? [];
  useEffect(() => { if (list.length && !selected) setSelected((list.find((a) => a.isDefault) ?? list[0]).id); }, [list, selected]);
  const address = manual ?? list.find((a) => a.id === selected);

  const saveNew = async (v) => {
    try { const a = await api.profile.addAddress(v); await addrs.reload(true); setSelected(a.id); setManual(null); }
    catch (e) { if (e.status === 404) { setManual(v); toast('Address will be used for this order only.', { type: 'info', ms: 3500 }); } else throw e; }
    setAdding(false);
  };

  const placeOrder = async () => {
    setError('');
    if (!address) return setError('Choose or add a delivery address.');
    if (!isPhone(phone)) return setError('Enter a valid phone number so the rider can reach you.');
    setBusy(true);
    let order;
    try {
      order = await api.orders.create({ items: toOrderItems(cart.lines), address: snapshot(address), phone, notes: notes.trim() || undefined, dropoffInstructions: dropoff.trim() || undefined });
      const rz = await pay(order, { name: who.name, email: who.email, contact: phone });
      const paid = await api.orders.verifyPayment({ orderId: order.orderId, ...rz });
      cart.clear();
      toast(`Payment received. Order #${paid.orderNumber} is confirmed.`, { type: 'success' });
      nav(`/orders/${paid.id}`);
    } catch (e) {
      if (e.code === 'PAYMENT_CANCELLED' || e.code === 'PAYMENT_FAILED') toast(`${e.message} Your cart is saved, you can try again.`, { type: 'error' });
      else setError(e.code === 'OUT_OF_STOCK' ? `${e.message}. Remove or swap those items and try again.` : e.message);
    } finally { setBusy(false); }
  };

  if (!cart.lines.length) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon="shopping_bag" title="Your cart is empty" action={<div className="mt-3 flex gap-2"><Button to="/dashboard">Browse the menu</Button><Button to="/builder" variant="outline">Build a pizza</Button></div>}>Add a pizza to get started.</EmptyState></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Review your order</h1>
      <p className="muted mt-2">Prices are confirmed by the server when you pay.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5" aria-labelledby="addr-h">
            <h2 id="addr-h" className="flex items-center gap-2 text-lg font-bold"><Icon name="location_on" />Delivery address</h2>
            {addrs.loading ? <Skeleton className="mt-3 h-16" /> : (
              <div className="mt-3 space-y-2" role="radiogroup" aria-label="Delivery address">
                {manual && <label className="flex items-start gap-3 rounded-md border-2 border-onion bg-crust/30 p-3 text-sm"><input type="radio" checked readOnly className="mt-1 accent-tomato" /><span><strong>This order only</strong><br />{oneLine(manual)}</span></label>}
                {list.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-md border-2 p-3 text-sm ${!manual && selected === a.id ? 'border-onion bg-crust/30' : 'border-line'}`}>
                    <input type="radio" name="addr" className="mt-1 accent-tomato" checked={!manual && selected === a.id} onChange={() => { setSelected(a.id); setManual(null); }} />
                    <span><strong>{a.label}</strong>{a.isDefault && <span className="muted"> · default</span>}<br />{oneLine(a)}</span>
                  </label>
                ))}
              </div>
            )}
            {adding ? <div className="mt-4"><AddressForm onSubmit={saveNew} onCancel={() => setAdding(false)} submitLabel="Save and use" /></div>
              : <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAdding(true)}><Icon name="add" /> {list.length || manual ? 'Add another address' : 'Add an address'}</Button>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField label="Contact phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <TextField label="Drop-off instructions (optional)" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Ring the bell, leave at the door" />
            </div>
          </section>

          <section className="card p-5" aria-labelledby="items-h">
            <h2 id="items-h" className="text-lg font-bold">Your pizzas ({cart.count})</h2>
            <ul className="mt-3 divide-y divide-line">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.name}</p>
                    {l.components?.length > 0 && <p className="muted mt-1 text-sm">{l.components.join(' · ')}</p>}
                    <button type="button" onClick={() => cart.remove(l.key)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brick underline"><Icon name="delete" className="text-base" />Remove</button>
                  </div>
                  <div className="flex flex-col items-end gap-2"><QuantityStepper value={l.qty} onChange={(q) => cart.setQty(l.key, q)} label={`Quantity of ${l.name}`} /><span className="font-semibold tabular-nums">{formatPaise(l.unitPrice * l.qty)}</span></div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <TextField as="textarea" rows={3} label="Kitchen instructions and allergy notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="Please cut into 8 slices, allergic to nuts…" />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-5">
            <h2 className="text-lg font-bold">Bill summary</h2>
            <PriceBreakdown totals={cart.totals} className="mt-3" />
          </div>
          <FormAlert>{error}</FormAlert>
          <Button className="w-full" loading={busy} onClick={placeOrder}><Icon name="lock" />Pay {formatPaise(cart.totals.total)}</Button>
          <p className="muted text-center text-xs">Secure payment by Razorpay ({API_MODE === 'mock' ? 'demo mode' : 'test mode'}). Choosing &ldquo;Success&rdquo; confirms the order.</p>
        </aside>
      </div>
      {payModal}
    </div>
  );
}
