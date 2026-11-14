import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async function on mount/deps change. Returns { data, error, loading, reload }. `reload(true)` refreshes silently. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const alive = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (alive.current) setState((s) => ({ data: silent ? s.data : undefined, error: silent ? s.error : error, loading: false }));
    }
  }, []);

  useEffect(() => { alive.current = true; run(); return () => { alive.current = false; }; }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: run };
}
