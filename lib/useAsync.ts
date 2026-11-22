'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Tiny data hook used by route containers (never by screens). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const v = await fnRef.current();
      setData(v);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}
