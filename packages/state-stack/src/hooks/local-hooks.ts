// Local ergonomic hooks: useComputed, useToggle, useList.

import { useCallback, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// useComputed
// ---------------------------------------------------------------------------

/**
 * Derives a value via useMemo — always in sync at render time.
 * No one-tick stale-value flash compared to useState + useEffect.
 */
export function useComputed<T>(
  compute: () => T,
  defaultValue: T,
  deps: React.DependencyList = []
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    try {
      return compute();
    } catch (err) {
      console.error('[useComputed] compute error:', err);
      return defaultValue;
    }
  }, deps);
}

// ---------------------------------------------------------------------------
// useToggle / useList
// ---------------------------------------------------------------------------

export function useToggle(initial = false) {
  const [v, setV] = useState(initial);
  const toggle = useCallback(() => setV((p) => !p), []);
  return [v, toggle, setV] as const;
}

export function useList<T>(initial: T[] = []) {
  const [list, setList] = useState<T[]>(initial);
  const push = useCallback(
    (item: T) => setList((l) => [...l, item]),
    []
  );
  const removeAt = useCallback(
    (idx: number) => setList((l) => l.filter((_, i) => i !== idx)),
    []
  );
  const clear = useCallback(() => setList([]), []);
  const updateAt = useCallback(
    (idx: number, item: T) =>
      setList((l) => l.map((x, i) => (i === idx ? item : x))),
    []
  );
  return { list, push, removeAt, clear, updateAt, setList } as const;
}

// ---------------------------------------------------------------------------
// Named adapter exports
// ---------------------------------------------------------------------------
