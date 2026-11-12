import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";

const NAV = [
  { to: "/#menu", label: "Menu" },
  { to: "/builder", label: "Build custom" },
  { to: "/orders", label: "Active orders" },
  { to: "/#story", label: "Our story" },
];

export default function Header({ cartCount = 0 }) {
  const [open, setOpen] = useState(false);
  const link = "rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-parchment/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Icon name="local_fire_department" className="text-2xl text-tomato" />
          Forno &amp; Farina
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => <NavLink key={n.label} to={n.to} className={link}>{n.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold hover:bg-crust/50 sm:block">Sign in</Link>
          <Link to="/checkout" className="inline-flex items-center gap-2 rounded-md bg-tomato px-4 py-2 text-sm font-semibold text-white hover:bg-brick">
            <Icon name="shopping_bag" /> Cart ({cartCount})
          </Link>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-crust/50 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} className="text-2xl" />
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="flex flex-col border-t border-line px-4 py-2 md:hidden">
          {NAV.map((n) => <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className={link}>{n.label}</Link>)}
          <Link to="/login" onClick={() => setOpen(false)} className={link}>Sign in</Link>
        </nav>
      )}
    </header>
  );
}
