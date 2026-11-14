import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addLine, cartCount, removeLine, setQty } from '../utils/cart.js';
import { computeTotals } from '../utils/pricing.js';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
const KEY = 'ff_cart';

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; } };

export function CartProvider({ children }) {
  const [lines, setLines] = useState(read);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ } }, [lines]);
  const value = useMemo(() => ({
    lines,
    count: cartCount(lines),
    totals: computeTotals(lines),
    add: (line) => setLines((l) => addLine(l, line)),
    setQty: (key, qty) => setLines((l) => setQty(l, key, qty)),
    remove: (key) => setLines((l) => removeLine(l, key)),
    replace: (next) => setLines(next),
    clear: () => setLines([]),
  }), [lines]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
