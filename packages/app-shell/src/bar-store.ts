import type { NavigationBarVisibility } from '@academix-admin/navigation-bar';

/**
 * WHERE THE TAB BAR IS, for what has to move with it — a floating total, a pill at the bar's line.
 *
 * Held outside React state: the bar reports on every hide and show while the page scrolls, and a
 * state change in the shell would re-render every stack each time. Only what reads it re-renders.
 */
export interface BarStore {
  get(): NavigationBarVisibility | null;
  set(state: NavigationBarVisibility): void;
  subscribe(listener: () => void): () => void;
}

export function createBarStore(): BarStore {
  let current: NavigationBarVisibility | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(state) {
      if (current && current.hidden === state.hidden && current.height === state.height && current.mode === state.mode) return;
      current = state;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
