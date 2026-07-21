// AtomStore — lightweight global key-value atoms with serialized updates.

import { safeClone } from '../utils';

/**
 * Per-key promise chain guarantees all concurrent set() calls
 * are applied in order with none silently dropped.
 */
export class AtomStore {
  private atoms = new Map<string, unknown>();
  private subs = new Map<string, Set<() => void>>();
  private updateChains = new Map<string, Promise<void>>();

  private notifySubscribers(key: string) {
    queueMicrotask(() => {
      const s = this.subs.get(key);
      if (!s) return;
      for (const fn of s) {
        try { fn(); } catch (err) {
          console.error('[Atom] subscriber error', err);
        }
      }
    });
  }

  get<T>(key: string, initial: T): T {
    if (!this.atoms.has(key)) this.atoms.set(key, safeClone(initial));
    return this.atoms.get(key) as T;
  }

  set<T>(key: string, value: T) {
    const prev = this.updateChains.get(key) ?? Promise.resolve();
    const next: Promise<void> = prev
      .then(() => {
        this.atoms.set(key, safeClone(value));
        this.notifySubscribers(key);
      })
      .catch((err) => console.error('[Atom] set error:', err));
    this.updateChains.set(key, next);
    next.finally(() => {
      if (this.updateChains.get(key) === next)
        this.updateChains.delete(key);
    });
  }

  subscribe(key: string, fn: () => void): () => void {
    if (!this.subs.has(key)) this.subs.set(key, new Set());
    this.subs.get(key)!.add(fn);
    return () => this.subs.get(key)?.delete(fn);
  }

  debug() {
    const atoms: Record<string, unknown> = {};
    for (const [k, v] of this.atoms) atoms[k] = v;
    return {
      atoms,
      subscribers: Array.from(this.subs.keys()),
      pendingChains: Array.from(this.updateChains.keys()),
    };
  }
}

export const atomStore = new AtomStore();
