import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { who, signOut } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const link = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50 ${isActive ? 'text-tomato underline decoration-2 underline-offset-8' : ''}`;
  const items = [
    { to: who ? '/dashboard' : '/#menu', label: 'Menu' },
    { to: '/builder', label: 'Build custom' },
    ...(who ? [{ to: '/orders', label: 'My orders' }] : []),
    { to: '/#story', label: 'Our story' },
  ];
  const out = () => { signOut(); nav('/'); };
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-parchment/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold"><Icon name="local_fire_department" className="text-2xl text-tomato" />Forno &amp; Farina</Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">{items.map((n) => <NavLink key={n.label} to={n.to} className={link} end>{n.label}</NavLink>)}</nav>
        <div className="flex items-center gap-2">
          {who ? (
            <>
              <Link to="/profile" className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50 sm:flex"><Icon name="account_circle" />{who.name.split(' ')[0]}</Link>
              <button type="button" onClick={out} className="hidden rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50 sm:block">Sign out</button>
            </>
          ) : <Link to="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50 sm:block">Sign in</Link>}
          <Link to="/checkout" className="inline-flex items-center gap-2 rounded-md bg-tomato px-4 py-2 text-sm font-semibold text-white hover:bg-brick"><Icon name="shopping_bag" />Cart ({count})</Link>
          <button type="button" className="rounded-md p-2 hover:bg-crust/50 md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}><Icon name={open ? 'close' : 'menu'} className="text-2xl" /></button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="flex flex-col border-t border-line px-4 py-2 md:hidden">
          {items.map((n) => <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50">{n.label}</Link>)}
          {who ? (<><Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50">Profile</Link><button type="button" onClick={out} className="rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-crust/50">Sign out</button></>)
            : <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50">Sign in</Link>}
        </nav>
      )}
    </header>
  );
}
