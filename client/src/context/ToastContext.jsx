import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icon from '../components/ui/Icon.jsx';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

const TONE = {
  success: ['bg-basil text-white', 'check_circle'],
  error: ['bg-tomato text-white', 'error'],
  info: ['bg-onion text-parchment', 'info'],
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback((message, { type = 'info', ms = 6000 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-3), { id, message, type }]);
    if (ms) setTimeout(() => dismiss(id), ms);
  }, [dismiss]);
  const value = useMemo(() => toast, [toast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-md px-4 py-3 shadow-pop ${TONE[t.type][0]}`}>
            <Icon name={TONE[t.type][1]} className="mt-0.5" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-80 hover:opacity-100"><Icon name="close" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
