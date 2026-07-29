// useDemandResource — an async "resource" on top of useDemandState.
//
// useDemandState is a great scoped/persistent state container, but it makes every call site hand-roll
// firstLoaded/loading/error around `demand`. useDemandResource models that for you: it returns
// { data, status, error, isValidating, refetch } and adds the things a data layer needs — request
// dedup (via demand-once), AbortSignal cancellation, retry with backoff, and keep-previous-data on
// revalidation — while inheriting persistence, scope, TTL and the demand-set cache protection.
//
// Contract: the `fetcher` RESOLVES with data on success and THROWS on failure (like React Query/SWR).
// A thrown fetch never overwrites the cache; a resolved empty value is protected by the demand-set
// guard (see useDemandState), so a blocked/failed load can't wipe already-loaded data.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDemandState, isEmptyValue, type DemandSetOptions } from './useDemandState';
import type { StorageAdapter } from '../types';

export type DemandStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DemandResourceOptions {
  key?: string;
  persist?: boolean;
  ttl?: number;
  storage?: StorageAdapter;
  historyDepth?: number;
  clearOnUnmount?: boolean;
  clearOnBack?: boolean;
  clearOnZeroSubscribers?: boolean;
  deps?: React.DependencyList;
  scope?: string;
  revalidateOnMount?: boolean;
  /** Retry attempts if the fetcher throws (default 0). */
  retry?: number;
  /** Base delay (ms) between retries; grows linearly per attempt (default 500). */
  retryDelay?: number;
  /** Keep showing the previous data while a manual refetch runs, and never let an empty refetch
   *  result replace non-empty data. Default true. */
  keepPreviousData?: boolean;
}

export interface DemandResource<T> {
  data: T;
  status: DemandStatus;
  error: unknown;
  /** A background fetch (revalidation / refetch) is in flight while data is already shown. */
  isValidating: boolean;
  /** First load with nothing to show yet (status === 'loading'). */
  isLoading: boolean;
  /** Manually re-run the fetcher (cancels any in-flight fetch). */
  refetch: () => Promise<void>;
  /** Imperative setter (pagination / optimistic updates); same semantics as useDemandState's set. */
  setData: (v: T | ((prev: T) => T), opts?: DemandSetOptions) => void;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useDemandResource<T>(
  initial: T,
  fetcher: (ctx: { signal: AbortSignal; get: () => T }) => Promise<T>,
  options: DemandResourceOptions & {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
    /** Rebuild the persisted value on hydration (e.g. reconstruct class instances). See useDemandState. */
    revive?: (raw: unknown) => T;
  } = {}
): DemandResource<T> {
  const {
    retry = 0,
    retryDelay = 500,
    keepPreviousData = true,
    onSuccess,
    onError,
    ...demandOpts
  } = options;

  const [data, demand, setData] = useDemandState<T>(initial, demandOpts);

  // Latest data for the fetcher's get() and emptiness checks, without re-creating callbacks.
  const dataRef = useRef(data);
  dataRef.current = data;

  const [status, setStatus] = useState<DemandStatus>(() =>
    isEmptyValue(initial) ? 'idle' : 'success'
  );
  const [error, setError] = useState<unknown>(null);
  const [isValidating, setIsValidating] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const cbRef = useRef({ onSuccess, onError });
  cbRef.current = { onSuccess, onError };

  // Run the fetcher and commit the result via `commit` (which may be guarded). Handles cancellation,
  // retry/backoff, and the loading-vs-validating distinction. Never commits on failure → cache kept.
  const runFetch = useCallback(
    async (commit: (v: T) => void) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const hadData = !isEmptyValue(dataRef.current);
      if (hadData) setIsValidating(true);
      else setStatus('loading');
      setError(null);

      let attempt = 0;
      for (;;) {
        try {
          const result = await fetcherRef.current({ signal: ctrl.signal, get: () => dataRef.current });
          if (ctrl.signal.aborted || !mountedRef.current) return;
          commit(result);
          setStatus('success');
          setError(null);
          setIsValidating(false);
          cbRef.current.onSuccess?.(result);
          return;
        } catch (e) {
          if (ctrl.signal.aborted || !mountedRef.current) return;
          if (attempt < retry) {
            attempt++;
            await delay(retryDelay * attempt);
            if (ctrl.signal.aborted || !mountedRef.current) return;
            continue;
          }
          setError(e);
          // Keep showing cached data if we have any; only surface 'error' when there's nothing to show.
          setStatus(isEmptyValue(dataRef.current) ? 'error' : 'success');
          setIsValidating(false);
          cbRef.current.onError?.(e);
          return;
        }
      }
    },
    [retry, retryDelay]
  );

  // Initial load — deduped by demand-once (per scope+key). Re-runs when `deps` change (the demand flag
  // is reset by useDemandState) or on mount when revalidateOnMount is true. The demand-loader `set`
  // carries the cache protection, so a blocked/empty load won't wipe hydrated data.
  useEffect(() => {
    demand(async ({ set }) => {
      await runFetch((v) => set(v));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demand, runFetch, ...(demandOpts.deps ?? [])]);

  // Reflect hydrated/cached data as success even if the loader short-circuited (revalidateOnMount:false).
  useEffect(() => {
    if (status === 'idle' && !isEmptyValue(data)) setStatus('success');
  }, [data, status]);

  const refetch = useCallback(async () => {
    await runFetch((v) => {
      if (keepPreviousData && isEmptyValue(v)) return; // don't wipe on an empty manual refetch
      setData(v);
    });
  }, [runFetch, setData, keepPreviousData]);

  return {
    data,
    status,
    error,
    isValidating,
    isLoading: status === 'loading',
    refetch,
    setData,
  };
}
