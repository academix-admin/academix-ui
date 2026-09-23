'use client';

/**
 * A READ, WITH EVERYTHING A READ ACTUALLY NEEDS.
 *
 * `useDemandState` holds a value and re-runs a loader on demand. What it leaves to every call site
 * is the bookkeeping around that: is this the first load or a refresh, is there anything to show
 * yet, did it fail, what do I say to somebody when it did, and how does a screen read again when
 * something elsewhere changed. Hand-rolled once per screen, that bookkeeping is where the bugs are.
 *
 * ── THE SHAPE, AND WHY IT IS THIS SHAPE ──────────────────────────────────────────────
 *
 * `data` is `T | null`, and there is NO initial value to pass. This hook used to take one and return
 * `T`, which reads harmlessly and is not: it means a screen renders a default before any answer
 * exists, and a default is indistinguishable from an answer. A zero that means "we could not ask"
 * looks exactly like a zero that means "none" — reported from a real shop as stock counts of 0, a
 * customer list reading "no customers", and a till saying "not counted" when nothing had been asked.
 * `null` until the first real answer is the only shape that cannot lie.
 *
 * `error` is a string, because somebody has to read it. `cause` is the thrown thing, for a caller
 * that wants to decide rather than display.
 *
 * ── WHAT COUNTS AS AN ANSWER ─────────────────────────────────────────────────────────
 *
 * The fetcher RESOLVES with data or THROWS. That distinction does all the work:
 *
 *   - It threw. Nothing is committed. Whatever is on screen stays, and `error` says the newer answer
 *     did not arrive. A failed refresh must never blank a screen.
 *   - It resolved. That is committed, INCLUDING an empty one. An empty answer is an answer: a
 *     customer who has paid everything off has an empty history and must not keep the one from
 *     before. This hook used to drop empty results on a refetch to protect the cache, which quietly
 *     kept settled debts on screen — protection against the wrong thing, since a failed read cannot
 *     reach the commit at all.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDemandState } from './useDemandState';
import { StateStackCore } from '../core/StateStackCore';
import type { StorageAdapter } from '../types';

export type DemandStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DemandResourceOptions<T> {
  /** Names the VALUE. Include every id the read depends on, e.g. `account:${id}`. */
  key: string;
  /**
   * The scope a writer invalidates. Given one, this re-reads whenever anything says that scope
   * changed — which is how a sale recorded on another till reaches a screen that is already open,
   * without either of them knowing the other exists.
   */
  scope?: string;
  /** `false` holds the read — no account chosen yet, no id yet, nobody signed in yet. */
  enabled?: boolean;
  persist?: boolean;
  ttl?: number;
  storage?: StorageAdapter;
  historyDepth?: number;
  clearOnUnmount?: boolean;
  clearOnBack?: boolean;
  clearOnZeroSubscribers?: boolean;
  deps?: React.DependencyList;
  revalidateOnMount?: boolean;
  /** Rebuild the persisted value on hydration — e.g. reconstruct class instances. */
  revive?: (raw: unknown) => T;
  /** Attempts if the fetcher throws. Default 0. */
  retry?: number;
  /** Base delay between retries, growing linearly per attempt. Default 500ms. */
  retryDelay?: number;
  /** What to say when the thrown thing says nothing useful. */
  fallbackMessage?: string;
  onSuccess?: (data: T) => void;
  /** Once per failed read, with the message — for a screen that opens a dialog. */
  onError?: (message: string, cause: unknown) => void;
}

export interface DemandResource<T> {
  /** The last answer, or `null` if there has never been one. Never a made-up default. */
  data: T | null;
  /** There is an answer to show — possibly one from before, while a newer read runs. */
  loaded: boolean;
  /** A read is in flight. With `loaded`, a background refresh; without it, the first load. */
  loading: boolean;
  /** A read is in flight while data is already on screen. */
  isValidating: boolean;
  status: DemandStatus;
  /** The last read failed, in words. What was on screen stays. */
  error: string | null;
  /** The thrown thing, for a caller that wants to decide rather than display. */
  cause: unknown;
  /** Read again now, keeping what is shown until the answer lands. */
  refetch: () => Promise<void>;
  /**
   * Write the value directly — an optimistic update, or a change this device just made and does not
   * need to ask about. Unconditional: the empty-value guard is for reads that might have failed, and
   * a caller writing a value on purpose is not one.
   */
  setData: (next: T | ((prev: T | null) => T)) => void;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** What to show somebody when a read failed. */
function messageOf(e: unknown, fallback: string): string {
  if (typeof e === 'string' && e.trim()) return e;
  if (e && typeof e === 'object') {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return fallback;
}

export function useDemandResource<T>(
  fetcher: (ctx: { signal: AbortSignal; get: () => T | null }) => Promise<T>,
  options: DemandResourceOptions<T>,
): DemandResource<T> {
  const {
    key,
    scope,
    enabled = true,
    retry = 0,
    retryDelay = 500,
    fallbackMessage = 'That could not be read.',
    onSuccess,
    onError,
    ...demandOpts
  } = options;

  const [data, demand, setDataRaw] = useDemandState<T | null>(null, {
    ...demandOpts,
    key,
    scope,
    // The key stands for the value, so a change of key is a change of value.
    deps: [key, ...(demandOpts.deps ?? [])],
    revalidateOnMount: demandOpts.revalidateOnMount ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cause, setCause] = useState<unknown>(null);

  /* Refs, so a fresh closure on every render is not a reason to read again. */
  const dataRef = useRef(data);
  dataRef.current = data;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const cbRef = useRef({ onSuccess, onError });
  cbRef.current = { onSuccess, onError };

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const runFetch = useCallback(
    async (commit: (v: T) => void) => {
      // One read at a time: a screen opened, left and reopened must not have two answers racing to
      // land, and the loser is whichever the network happens to finish second.
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const hadData = dataRef.current !== null;
      setLoading(true);
      setIsValidating(hadData);

      let attempt = 0;
      for (;;) {
        try {
          const got = await fetcherRef.current({ signal: ctrl.signal, get: () => dataRef.current });
          if (ctrl.signal.aborted || !mountedRef.current) return;
          /*
           * `override`, because a resolved value is an ANSWER even when it is empty. The guard that
           * protects a cache from being wiped is for reads that FAIL, and those throw — they never
           * arrive here.
           */
          commit(got);
          setError(null);
          setCause(null);
          setLoading(false);
          setIsValidating(false);
          cbRef.current.onSuccess?.(got);
          return;
        } catch (e) {
          if (ctrl.signal.aborted || !mountedRef.current) return;
          if (attempt < retry) {
            attempt += 1;
            await delay(retryDelay * attempt);
            if (ctrl.signal.aborted || !mountedRef.current) return;
            continue;
          }
          // KEPT. Only the error is set; the last answer stays where it is.
          const said = messageOf(e, fallbackMessage);
          setError(said);
          setCause(e);
          setLoading(false);
          setIsValidating(false);
          cbRef.current.onError?.(said, e);
          return;
        }
      }
    },
    [retry, retryDelay, fallbackMessage],
  );

  const load = useCallback(() => {
    if (!enabled) return;
    void demand(async ({ set }) => {
      await runFetch((v) => set(v as T | null, { override: true }));
    });
  }, [enabled, demand, runFetch]);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * A real re-read, not a no-op.
   *
   * `demand()` returns early on a key it has already served, so handing a screen its own `load` as
   * "try again" gives it a button that does nothing. The demanded flag is cleared first — the VALUE
   * is kept, so nothing blanks while the new answer is on its way.
   */
  const refetch = useCallback(async () => {
    if (!enabled) return;
    if (scope) StateStackCore.instance.resetDemand(scope, key);
    await runFetch((v) => setDataRaw(v as T | null));
  }, [enabled, scope, key, runFetch, setDataRaw]);

  /*
   * Something elsewhere said this scope changed, and this re-reads — but not from here.
   *
   * `useDemandState` already re-runs its loader when its scope is invalidated (0.3.0), so an
   * explicit `useInvalidation(scope, refetch)` here changed nothing: the test for it passed with
   * the line deleted, and the read count after one invalidation was 1 either way. It is the
   * contract of this hook, which is why the test stays; it is not this hook's job to deliver it.
   */

  const setData = useCallback(
    (next: T | ((prev: T | null) => T)) => {
      setDataRaw((prev) => (typeof next === 'function' ? (next as (p: T | null) => T)(prev) : next));
    },
    [setDataRaw],
  );

  const loaded = data !== null;
  const status: DemandStatus = loading && !loaded ? 'loading' : error && !loaded ? 'error' : loaded ? 'success' : 'idle';

  return { data, loaded, loading, isValidating, status, error, cause, refetch, setData };
}
