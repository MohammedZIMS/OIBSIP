import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken } from '../api/client.js';

/** Builds a provider and hook for one role ('user' or 'admin'). `loadMe` validates a stored token on startup. */
export function makeAuthContext(role, loadMe) {
  const Ctx = createContext(null);

  function Provider({ children }) {
    const [who, setWho] = useState(null);
    const [ready, setReady] = useState(!getToken(role));

    const signOut = useCallback(() => { setToken(role, null); setWho(null); }, []);
    const signIn = useCallback((token, profile) => { setToken(role, token); setWho(profile); }, []);

    useEffect(() => {
      if (!getToken(role)) return;
      let live = true;
      loadMe().then((p) => live && setWho(p)).catch(() => live && setToken(role, null)).finally(() => live && setReady(true));
      return () => { live = false; };
    }, []);

    useEffect(() => {
      const h = (e) => e.detail === role && signOut();
      window.addEventListener('ff:unauthorized', h);
      return () => window.removeEventListener('ff:unauthorized', h);
    }, [signOut]);

    const value = useMemo(() => ({ who, ready, signIn, signOut, setWho }), [who, ready, signIn, signOut]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }
  const useIt = () => useContext(Ctx);
  return [Provider, useIt];
}
