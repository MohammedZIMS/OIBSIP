import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import StatusBadge from './StatusBadge.jsx';
import PizzaArt from './PizzaArt.jsx';
import { formatPaise } from '../../utils/money.js';
import { artFor } from '../../utils/art.js';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function PizzaCard({ pizza, showCustomize = false }) {
  const cart = useCart();
  const toast = useToast();
  const unavailable = pizza.available === false;
  const add = () => {
    cart.add({ kind: 'preset', pizzaId: pizza.id, name: pizza.name, unitPrice: pizza.price, qty: 1, components: pizza.components ?? [] });
    toast(`${pizza.name} added to your order`, { type: 'success', ms: 3000 });
  };
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative flex items-center justify-center bg-crust/40 p-6">
        <PizzaArt variant={artFor(pizza.name)} className={`h-40 w-40 ${unavailable ? 'opacity-40 grayscale' : ''}`} />
        <div className="absolute left-3 top-3"><StatusBadge status={unavailable ? 'out' : 'ok'} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold">{pizza.name}</h3>
          <p className="font-semibold tabular-nums">{formatPaise(pizza.price)}</p>
        </div>
        <p className="muted flex-1 text-sm leading-relaxed">{pizza.description}</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={unavailable} onClick={add}><Icon name="add" /> Add to order</Button>
          {showCustomize && <Button to="/builder" variant="ghost" aria-label={`Customize ${pizza.name}`}><Icon name="tune" /></Button>}
        </div>
      </div>
    </article>
  );
}
