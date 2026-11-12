import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="on-dark bg-pan text-parchment">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-xl font-extrabold text-crust">Forno &amp; Farina</p>
          <p className="mt-2 max-w-xs text-sm text-ink-dark">Wood-fired pizza, baked to order. Online ordering, live status.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link className="hover:text-cheese" to="/#menu">Menu</Link>
          <Link className="hover:text-cheese" to="/builder">Build custom</Link>
          <Link className="hover:text-cheese" to="/#story">Our story</Link>
          <Link className="hover:text-cheese" to="/login">Sign in</Link>
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-ink-dark">
        © {new Date().getFullYear()} Forno &amp; Farina. All rights reserved.
      </p>
    </footer>
  );
}
