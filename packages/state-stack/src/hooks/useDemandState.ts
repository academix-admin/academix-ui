// useDemandState — scope/route-scoped state with persistence, TTL and undo/redo.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { StateStackCore } from '../core/StateStackCore';
import { _globalConfig, useResolvedPathname, getDefaultStorage } from '../config';
import type { StorageAdapter } from '../types';

/** Options for a demand-loader `set`. */
export interface DemandSetOptions {
  /**
   * Force the write even when `v` is "empty" (null/undefined/[]) and a non-empty value is already
   * cached. Default `false`: for persisted state, an empty value does NOT overwrite an existing
   * non-empty one — so a demand-loader re-run whose fetch was blocked/failed (e.g. a session-gated
   * request during an app-lock, or a cold start) can't wipe the hydrated cache. Pass `true` for
   * intentional resets/clears (e.g. `set(null, { override: true })`).
   */
  override?: boolean;
}

/**
 * Whether `v` counts as "nothing loaded" for the persisted-cache guard. Covers the shapes a
 * demand loader typically returns on a blocked/failed fetch, across data types:
 *   • null / undefined
 *   • empty array []                       (lists)
 *   • empty Map / Set (size 0)             (keyed / unique collections)
 *   • plain object / class instance with no own enumerable keys  ({}), e.g. an empty Record
 * Primitives (number/string/boolean — including 0, '', false) are treated as REAL values, never
 * empty. Anything this misjudges for a given shape can be forced with `set(v, { override: true })`.
 */
export const isEmptyValue = (v: unknown): boolean => {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (v instanceof Map || v instanceof Set) return v.size === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
};

export function useDemandState<T>(
  initial: T,
  opts?: {
    key?: string;
    persist?: boolean;
    ttl?: number;
    storage?: StorageAdapter;
    historyDepth?: number;
    clearOnUnmount?: boolean;
    clearOnBack?: boolean;
    deps?: React.DependencyList;
    clearOnZeroSubscribers?: boolean;
    scope?: string;
    /**
     * Whether a fresh mount re-runs the demand loader. Default `true` (revalidate on every mount —
     * the historical behaviour). Set `false` for "load once" caching: after the first load, a remount
     * (navigation back, PWA cold start, app-lock) reuses the persisted value and does NOT re-run the
     * loader. `deps` changes and TTL expiry still force a reload regardless of this flag.
     */
    revalidateOnMount?: boolean;
    /**
     * Rebuild the persisted value on hydration — e.g. reconstruct class instances that JSON storage
     * flattened to plain objects: `revive: (raw) => (raw as Row[]).map((r) => Model.from(r))`. Applied
     * once when the value is loaded from storage; fail-safe (a throw keeps the raw parsed value).
     */
    revive?: (raw: unknown) => T;
  }
): [
  T,
  (
    loader: (
      helpers: { get: () => T; set: (v: T, opts?: DemandSetOptions) => void }
    ) => void | Promise<void>
  ) => void,
  (v: T | ((prev: T) => T)) => void,
  {
    clear: (removePersist?: boolean) => void;
    clearByScope: (scope: string, removePersist?: boolean) => void;
    clearByPathname: (removePersist?: boolean) => void;
    clearByPrefix: (prefix: string, removePersist?: boolean) => void;
    clearByCondition: (
      condition: (scope: string, key: string) => boolean,
      removePersist?: boolean
    ) => void;
    isHydrated: boolean;
  }
] {
  const pathname = useResolvedPathname();

  if (!pathname && _globalConfig.debug) {
    console.warn(
      '[StateStack] useDemandState: resolved pathname is null. ' +
        "State will be scoped to 'route:unknown', risking key collisions. " +
        'Provide an explicit `scope` via opts, or configure `usePathname` via ' +
        'initStateStack (or the @academix-admin/state-stack/next adapter) to avoid this.'
    );
  }

  const resolvedPathname = pathname || 'unknown';
  const scope = opts?.scope || `route:${resolvedPathname}`;
  const key = opts?.key ?? 'demand';
  const ttl = opts?.ttl;
  const persist = opts?.persist ?? true;
  const storage = opts?.storage || getDefaultStorage();
  const historyDepth = opts?.historyDepth ?? 10;
  const clearOnUnmount = opts?.clearOnUnmount ?? false;
  const clearOnBack = opts?.clearOnBack ?? false;
  const deps = opts?.deps ?? [];
  const clearOnZeroSubscribers = opts?.clearOnZeroSubscribers ?? false;
  const revalidateOnMount = opts?.revalidateOnMount ?? true;
  const reviveRef = useRef(opts?.revive);
  reviveRef.current = opts?.revive;

  const core = StateStackCore.instance;
  const initialRef = useRef(initial);

  const [isHydrated, setIsHydrated] = useState(() =>
    core.isHydrated(scope, key)
  );

  useEffect(() => {
    const unsubscribe = core.subscribeToHydration(scope, key, () => {
      const next = core.isHydrated(scope, key);
      setIsHydrated((prev) => (prev === next ? prev : next));
    });
    return unsubscribe;
  }, [scope, key]);

  const state = useSyncExternalStore(
    useCallback((cb) => core.subscribe(scope, key, cb), [scope, key]),
    useCallback(
      () => core.getStateSync(scope, key, initialRef.current),
      [scope, key]
    ),
    useCallback(() => initialRef.current, [])
  );

  useEffect(() => {
    if (!persist) return;
    let mounted = true;
    (async () => {
      try {
        const didHydrate = await core.ensureHydrated(
          scope,
          key,
          initialRef.current,
          persist,
          storage,
          reviveRef.current
        );
        if (mounted && didHydrate) core.notify(scope, key);
      } catch (err) {
        console.error('[useDemandState] hydrate error:', err);
      }
    })();
    return () => { mounted = false; };
  }, [scope, key, persist, storage]);

  useEffect(() => {
    core.setHistoryDepth(scope, key, historyDepth);
  }, [scope, key, historyDepth]);

  useEffect(() => {
    if (!clearOnUnmount) return;
    return () => { core.clearScope(scope); };
  }, [scope, clearOnUnmount]);

  useEffect(() => {
    if (!clearOnBack || typeof window === 'undefined') return;
    const handler = () => core.clearScope(scope);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [scope, clearOnBack]);

  useEffect(() => {
    if (clearOnZeroSubscribers) core.enableAutoClearOnZero(scope);
    return () => {
      if (clearOnZeroSubscribers) core.disableAutoClearOnZero(scope);
    };
  }, [scope, clearOnZeroSubscribers]);

  // Reset the demand flag when `deps` change so the loader re-runs with fresh inputs. On MOUNT we
  // reset only when revalidateOnMount is true (the default); when false, a remount reuses the cached
  // value (the singleton demand flag survives unmount) instead of re-running the loader.
  const firstDepsRunRef = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (firstDepsRunRef.current) {
      firstDepsRunRef.current = false;
      if (revalidateOnMount) core.resetDemand(scope, key);
      return;
    }
    core.resetDemand(scope, key);
  }, deps);

  // Dev footgun guard: a `deps` entry that changes identity every render but stays deep-equal (a fresh
  // object/array literal) resets the demand every render → constant refetch. Warn once, debug-only.
  const prevDepsRef = useRef<React.DependencyList | null>(null);
  const depsWarnedRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (_globalConfig.debug && !depsWarnedRef.current) {
      const prev = prevDepsRef.current;
      if (prev && prev.length === deps.length) {
        for (let i = 0; i < deps.length; i++) {
          const a = deps[i], b = prev[i];
          if (!Object.is(a, b) && a && typeof a === 'object') {
            let equal = false;
            try { equal = JSON.stringify(a) === JSON.stringify(b); } catch { /* not comparable */ }
            if (equal) {
              depsWarnedRef.current = true;
              console.warn(
                '[StateStack] useDemandState/useDemandResource: a `deps` entry changes identity every ' +
                  'render but is deep-equal (a fresh object/array literal). This resets the demand every ' +
                  'render → constant refetch. Memoize it with useMemo, or pass primitives.'
              );
              break;
            }
          }
        }
      }
    }
    prevDepsRef.current = deps;
  }, deps);

  /*
   * The last loader this consumer supplied.
   *
   * Kept so an INVALIDATION can re-run it. `clearScope` / `clearKey` correctly drop the demand
   * flag, but dropping a flag does not fetch anything: the loader only runs when a consumer calls
   * `demand()`, and a mounted component has no reason to call it again — its effect already ran
   * and neither `deps` nor the callback identity changed. So the value went to empty and stayed
   * there, and a screen that had invalidated its own cache sat on a loading state with nothing in
   * flight. Remembering the loader is what makes "invalidate" mean "fetch again".
   */
  const lastLoaderRef = useRef<
    | ((helpers: { get: () => T; set: (v: T, opts?: DemandSetOptions) => void }) => void | Promise<void>)
    | null
  >(null);

  const demand = useCallback(
    (
      loader: (
        helpers: { get: () => T; set: (v: T) => void }
      ) => void | Promise<void>
    ) => {
      lastLoaderRef.current = loader as typeof lastLoaderRef.current;
      if (core.isDemanded(scope, key)) return;
      core
        .runDemandOperation(scope, key, async () => {
          const ctx = {
            get: () =>
              core.getStateSync(scope, key, initialRef.current) as T,
            set: (v: T, opts?: DemandSetOptions) => {
              // Persisted state: don't let an "empty" load overwrite an existing non-empty value
              // (unless override) — protects the hydrated cache from a blocked/failed demand re-run.
              if (persist && !opts?.override && isEmptyValue(v)) {
                const cur = core.getStateSync(scope, key, initialRef.current) as T;
                if (!isEmptyValue(cur)) {
                  core.markDemanded(scope, key);
                  core.markHydrated(scope, key);
                  return;
                }
              }
              core.setState(scope, key, v, persist, storage);
              if (ttl) core.setTTL(scope, key, ttl);
              core.markDemanded(scope, key);
              core.markHydrated(scope, key);
            },
          };
          await Promise.resolve(loader(ctx));
        })
        .catch((err) =>
          console.error('[useDemandState] loader error:', err)
        );
    },
    [scope, key, ttl, persist, storage]
  );

  /*
   * Re-run the loader when this key is invalidated by someone else.
   *
   * `clearScope` notifies subscribers, so this hears about it. If the demand flag has been dropped
   * and there is a loader to re-run, run it — that is the whole contract of invalidation, and
   * without it every consumer has to arrange its own re-fetch, which in practice means a timer.
   *
   * Guarded three ways so this cannot loop: only with a loader recorded, only when the flag is
   * actually clear (a normal `set` marks it, so ordinary writes do not re-enter), and only while
   * mounted.
   */
  useEffect(() => {
    let mounted = true;
    return core.subscribe(scope, key, () => {
      if (!mounted) return;
      if (!lastLoaderRef.current) return;
      if (core.isDemanded(scope, key)) return;
      // Next tick: the notification arrives mid-clear, and re-demanding inside it would race the
      // rest of the teardown.
      queueMicrotask(() => {
        if (!mounted || !lastLoaderRef.current) return;
        if (core.isDemanded(scope, key)) return;
        demand(lastLoaderRef.current);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, key, demand]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prev = core.getStateSync(scope, key, initialRef.current) as T;
      const next =
        typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      core.setState(scope, key, next, persist, storage);
      if (ttl) core.setTTL(scope, key, ttl);
      core.markDemanded(scope, key);
      core.markHydrated(scope, key);
    },
    [scope, key, ttl, persist, storage]
  );

  const clear = useCallback(
    (removePersist = true) => core.clearKey(scope, key, removePersist),
    [scope, key]
  );

  const clearByScope = useCallback(
    (scopeArg: string, removePersist = true) =>
      core.clearScope(scopeArg, removePersist),
    []
  );

  const clearByPathname = useCallback(
    (removePersist = true) =>
      core.clearByPathname(resolvedPathname, removePersist),
    [resolvedPathname]
  );

  const clearByPrefix = useCallback(
    (prefix: string, removePersist = true) =>
      core.clearByPrefix(prefix, removePersist),
    []
  );

  const clearByCondition = useCallback(
    (
      condition: (scope: string, key: string) => boolean,
      removePersist = true
    ) => core.clearByCondition(condition, removePersist),
    []
  );

  return [
    state,
    demand,
    set,
    {
      clear,
      clearByScope,
      clearByPathname,
      clearByPrefix,
      clearByCondition,
      isHydrated,
    },
  ];
}
