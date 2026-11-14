// Pure cart helpers (the UI state lives in context/CartContext.jsx).
export const lineKey = (l) => (l.kind === 'preset' ? `p:${l.pizzaId}` : `c:${l.baseId}:${l.sauceId}:${l.cheeseId}:${[...l.veggieIds].sort().join(',')}`);
export function addLine(lines, line) {
  const key = lineKey(line);
  const i = lines.findIndex((l) => l.key === key);
  if (i >= 0) return lines.map((l, j) => (j === i ? { ...l, qty: Math.min(10, l.qty + line.qty) } : l));
  return [...lines, { ...line, key }];
}
export const setQty = (lines, key, qty) => lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l));
export const removeLine = (lines, key) => lines.filter((l) => l.key !== key);
export const cartCount = (lines) => lines.reduce((t, l) => t + l.qty, 0);
// Payload for POST /orders: ids only, never prices.
export const toOrderItems = (lines) =>
  lines.map((l) => (l.kind === 'preset' ? { kind: 'preset', pizzaId: l.pizzaId, qty: l.qty } : { kind: 'custom', baseId: l.baseId, sauceId: l.sauceId, cheeseId: l.cheeseId, veggieIds: l.veggieIds, qty: l.qty }));

/** Turns a past order back into cart lines (prices are display-only and re-checked by the server). */
export function linesFromOrder(order) {
  return order.items.map((i) => {
    const names = i.components.map((c) => c.name);
    if (i.kind === 'preset') return addLine([], { kind: 'preset', pizzaId: i.pizzaId, name: i.name, unitPrice: i.unitPrice, qty: i.qty, components: names })[0];
    const by = (cat) => i.components.filter((c) => c.category === cat).map((c) => c.ingredient);
    return addLine([], { kind: 'custom', baseId: by('base')[0], sauceId: by('sauce')[0], cheeseId: by('cheese')[0], veggieIds: by('veggie'), name: 'Custom pizza', unitPrice: i.unitPrice, qty: i.qty, components: names })[0];
  });
}
