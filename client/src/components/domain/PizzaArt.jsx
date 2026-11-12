// Illustrated pizza (inline SVG) so the page needs no remote images. Replace with photos when available.
const GOLDEN = 2.39996;
const scatter = (n, radius, seed = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i + seed) * GOLDEN;
    const d = Math.sqrt((i + 0.5) / n) * radius;
    return { x: 100 + d * Math.cos(a), y: 100 + d * Math.sin(a) };
  });

const VARIANTS = {
  margherita: { sauce: "#B80311", cheese: "#FBF3E4", toppings: [{ color: "#485D17", n: 7, r: 8, seed: 2 }] },
  diavola: { sauce: "#B80311", cheese: "#E0983E", toppings: [{ color: "#9C2913", n: 12, r: 8, seed: 1 }, { color: "#D76E25", n: 8, r: 3, seed: 5 }] },
  tartufo: { sauce: "#9D5826", cheese: "#E9C590", toppings: [{ color: "#6B5A48", n: 10, r: 7, seed: 3 }, { color: "#1D2833", n: 5, r: 4, seed: 7 }] },
  quattro: { sauce: "#E9C590", cheese: "#FBF3E4", toppings: [{ color: "#E0983E", n: 6, r: 8, seed: 4 }, { color: "#485D17", n: 5, r: 3, seed: 9 }] },
};

export default function PizzaArt({ variant = "margherita", className = "" }) {
  const v = VARIANTS[variant] ?? VARIANTS.margherita;
  const leopard = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return { x: 100 + 86 * Math.cos(a), y: 100 + 86 * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="97" fill="#9D5826" />
      <circle cx="100" cy="100" r="93" fill="#E9C590" />
      {leopard.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i % 3 ? 2.2 : 3.2} fill="#5A1A35" opacity="0.55" />)}
      <circle cx="100" cy="100" r="78" fill={v.sauce} />
      {scatter(15, 64, 3).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="11" fill={v.cheese} opacity="0.92" />)}
      {v.toppings.map((t, ti) =>
        scatter(t.n, 62, t.seed).map((p, i) => <circle key={`${ti}-${i}`} cx={p.x} cy={p.y} r={t.r} fill={t.color} />),
      )}
    </svg>
  );
}
