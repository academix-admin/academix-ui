// useAtom — read/write a global atom by key.

import { useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { atomStore } from '../core/AtomStore';

export function useAtom<T>(
  key: string,
  initial: T
): [T, (v: T | ((prev: T) => T)) => void] {
  const state = useSyncExternalStore(
    useCallback((cb) => atomStore.subscribe(key, cb), [key]),
    useCallback(() => atomStore.get(key, initial), [key, initial]),
    useCallback(() => initial, [initial])
  );

  const setter = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next =
        typeof v === 'function'
          ? (v as (p: T) => T)(atomStore.get(key, initial))
          : v;
      atomStore.set(key, next);
    },
    [key, initial]
  );

  return [state, setter];
}
