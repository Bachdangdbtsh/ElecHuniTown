'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export function useApi(path, params) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const query = params ? new URLSearchParams(params).toString() : null;
  const key = query === null ? (path ? `${path}#${tick}` : null) : `${path}?${query}#${tick}`;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    const endpoint = query ? `${path}?${query}` : path;
    apiGet(endpoint, controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResult({ key, data: null, error });
      });
    return () => controller.abort();
  }, [key, path, query]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // A login in another tab replaces the shared session cookie. Recheck on return.
  useEffect(() => {
    if (!path) return;
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [path, reload]);

  if (key === null) return { status: 'idle', data: null, error: null, reload };
  if (result.key === key) {
    return result.error
      ? { status: 'error', data: null, error: result.error, reload }
      : { status: 'success', data: result.data, error: null, reload };
  }
  return { status: 'loading', data: result.error ? null : result.data, error: null, reload };
}
