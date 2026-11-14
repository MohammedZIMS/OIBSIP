import { Link, Outlet } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import PizzaArt from '../domain/PizzaArt.jsx';

// Centered card on a warm background, with an illustrated side panel on wide screens.
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="on-dark relative hidden overflow-hidden bg-onion text-crust lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold text-parchment"><Icon name="local_fire_department" className="text-3xl text-cheese" />Forno &amp; Farina</Link>
        <div className="relative">
          <div className="absolute -right-24 -top-10 h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(224,152,62,0.35),transparent_65%)]" />
          <PizzaArt variant="margherita" className="relative h-72 w-72 -rotate-12" />
        </div>
        <p className="max-w-sm text-lg">Wood, flour &amp; time. Order a signature pie or build your own.</p>
      </div>
      <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <Link to="/" className="mb-8 flex items-center gap-2 font-display text-xl font-extrabold lg:hidden"><Icon name="local_fire_department" className="text-2xl text-tomato" />Forno &amp; Farina</Link>
        <div className="mx-auto w-full max-w-md"><Outlet /></div>
      </div>
    </div>
  );
}
