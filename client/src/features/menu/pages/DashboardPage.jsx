import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import PizzaCard from '../../../components/domain/PizzaCard.jsx';
import OrderCard from '../../../components/domain/OrderCard.jsx';
import { OrderBadge } from '../../../components/domain/StatusBadge.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States.jsx';
import { FilterChips } from '../../../components/ui/misc.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePolling } from '../../../hooks/usePolling.js';
import { api } from '../../../api/index.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useCart } from '../../../context/CartContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { linesFromOrder } from '../../../utils/cart.js';
import { FILTERS } from '../../home/homeData.js';

export default function DashboardPage() {
  const { who } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const nav = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const pizzas = useAsync(() => api.catalogue.pizzas(), []);
  const active = useAsync(() => api.orders.active(), []);
  const recent = useAsync(() => api.orders.mine(), []);
  usePolling(() => active.reload(true), 5000);

  const visible = useMemo(() => (pizzas.data ?? []).filter((p) => (filter === 'All' || p.tags?.includes(filter)) && p.name.toLowerCase().includes(search.trim().toLowerCase())), [pizzas.data, filter, search]);
  const reorder = (o) => { linesFromOrder(o).forEach((l) => cart.add(l)); toast(`Order #${o.orderNumber} added to your cart`, { type: 'success', ms: 3000 }); nav('/checkout'); };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold sm:text-4xl">Welcome back, {who.name.split(' ')[0]}</h1><p className="muted mt-2">Pick a signature pie or build your own.</p></div>
        <Button to="/builder"><Icon name="tune" /> Launch the pizza builder</Button>
      </div>

      {active.data?.length > 0 && (
        <section aria-labelledby="active-h">
          <h2 id="active-h" className="mb-3 text-xl font-bold">Your active orders</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {active.data.map((o) => (
              <li key={o.id}><Link to={`/orders/${o.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-toast"><span><span className="font-display font-bold">#{o.orderNumber}</span><span className="muted block text-sm">Tap to track live</span></span><OrderBadge status={o.status} /></Link></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="menu-h">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="menu-h" className="text-xl font-bold">Menu</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative"><span className="sr-only">Search pizzas</span><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" /><input className="input pl-10" placeholder="Search pizzas" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <FilterChips label="Filter pizzas" options={FILTERS} value={filter} onChange={setFilter} />
          </div>
        </div>
        {pizzas.loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-80" />)}</div>
          : pizzas.error ? <ErrorState error={pizzas.error} onRetry={pizzas.reload} />
          : visible.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{visible.map((p) => <PizzaCard key={p.id} pizza={p} showCustomize />)}</div>
          : <EmptyState icon="search_off" title="No pizzas found">Try a different search or filter.</EmptyState>}
      </section>

      <section aria-labelledby="recent-h">
        <div className="mb-3 flex items-center justify-between"><h2 id="recent-h" className="text-xl font-bold">Recent orders</h2><Link to="/orders" className="text-sm font-semibold text-brick underline">View all</Link></div>
        {recent.loading ? <Skeleton className="h-28" /> : recent.data?.length ? (
          <div className="grid gap-3 md:grid-cols-3">{recent.data.slice(0, 3).map((o) => <OrderCard key={o.id} order={o}><Button variant="outline" size="sm" className="mt-3" onClick={() => reorder(o)}><Icon name="replay" /> Order again</Button></OrderCard>)}</div>
        ) : <EmptyState icon="receipt_long" title="No orders yet">Your past orders will show up here.</EmptyState>}
      </section>
    </div>
  );
}
