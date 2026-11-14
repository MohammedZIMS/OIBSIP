import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { API_MODE } from '../../api/index.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'inventory_2' },
  { to: '/admin/ledger', label: 'Stock ledger', icon: 'history' },
];

export default function AdminLayout() {
  const { who, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const link = ({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-white/10 text-cheese' : 'hover:bg-white/10'}`;
  return (
    <div data-theme="dark" className="on-dark min-h-screen bg-pan text-parchment">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-pan/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2 font-display text-lg font-extrabold text-crust"><Icon name="local_fire_department" className="text-2xl text-cheese" />Kitchen console</Link>
          <nav aria-label="Admin" className="hidden items-center gap-1 md:flex">{NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}><Icon name={n.icon} className="text-lg" />{n.label}</NavLink>)}</nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 sm:flex" title="Order and stock data refresh every few seconds"><span className="h-2 w-2 rounded-full bg-basil-soft" aria-hidden="true" />Live (auto-refresh){API_MODE === 'mock' ? ' · demo data' : ''}</span>
            <span className="hidden text-ink-dark lg:inline">{who?.name}</span>
            <button type="button" onClick={() => { signOut(); nav('/admin/login'); }} className="rounded-md px-3 py-1.5 font-semibold hover:bg-white/10">Sign out</button>
            <button type="button" className="rounded-md p-1.5 hover:bg-white/10 md:hidden" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}><Icon name={open ? 'close' : 'menu'} /></button>
          </div>
        </div>
        {open && <nav aria-label="Admin mobile" className="flex flex-col border-t border-white/10 px-4 py-2 md:hidden">{NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={link}><Icon name={n.icon} className="text-lg" />{n.label}</NavLink>)}</nav>}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
