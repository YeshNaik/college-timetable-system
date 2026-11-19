import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage, isCancelled } from '../api/client';

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs `fetcher` whenever `deps` change, cancels the in-flight request on change/unmount.
 * Pass `enabled = false` to skip fetching (e.g. until a filter is chosen).
 */
export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  enabled = true,
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current(controller.signal)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (isCancelled(e) || controller.signal.aborted) return;
        setError(getErrorMessage(e));
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
