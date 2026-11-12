import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";
import PizzaArt from "./PizzaArt.jsx";
import { formatPaise } from "../../utils/money.js";

export default function PizzaCard({ pizza }) {
  const unavailable = pizza.stock === "out";
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <div className="relative flex items-center justify-center bg-crust/40 p-6">
        <PizzaArt variant={pizza.art} className="h-40 w-40" />
        <div className="absolute left-3 top-3"><StatusBadge status={pizza.stock} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold">{pizza.name}</h3>
          <p className="font-semibold tabular-nums">{formatPaise(pizza.price)}</p>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-ink-muted">{pizza.description}</p>
        {/* Guests are sent to login first (Workflow.md 3.1); logged-in users add to the local cart (Phase 3). */}
        <Button to="/login?returnTo=/dashboard" variant="outline" className={unavailable ? "pointer-events-none opacity-40" : ""} aria-disabled={unavailable}>
          <Icon name="add" /> Add to order
        </Button>
      </div>
    </article>
  );
}
