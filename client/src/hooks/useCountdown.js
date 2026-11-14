import { useCallback, useEffect, useState } from 'react';

/** Seconds left for a cooldown. start(n) begins an n-second countdown. */
export function useCountdown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const start = useCallback((n) => setLeft(n), []);
  return [left, start];
}
