// useDemandState — scope/route-scoped state with persistence, TTL and undo/redo.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { StateStackCore } from '../core/StateStackCore';
import { _globalConfig, useResolvedPathname, getDefaultStorage } from '../config';
import type { StorageAdapter } from '../types';

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
  }
): [
  T,
  (
    loader: (
      helpers: { get: () => T; set: (v: T) => void }
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
          storage
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { core.resetDemand(scope, key); }, deps);

  const demand = useCallback(
    (
      loader: (
        helpers: { get: () => T; set: (v: T) => void }
      ) => void | Promise<void>
    ) => {
      if (core.isDemanded(scope, key)) return;
      core
        .runDemandOperation(scope, key, async () => {
          const ctx = {
            get: () =>
              core.getStateSync(scope, key, initialRef.current) as T,
            set: (v: T) => {
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
