import { useEffect, useRef } from 'react';

/** Calls `fn` every `ms` while the tab is visible, and once when the tab regains focus. Real-time stand-in until Socket.IO lands. */
export function usePolling(fn, ms = 5000) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const tick = () => { if (!document.hidden) ref.current(); };
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [ms]);
}
