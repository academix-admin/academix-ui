// C1 — per-stack overlay entry store (mirrors the client-side registry pattern).
import type { OverlayRender } from '../types';

export type OverlayEntryRec = {
  id: string;
  render: OverlayRender;
  /** Route key or uid the overlay is bound above; null = stack-level. */
  abovePage: string | null;
  /** Slot within the 1000-wide band (1..999). */
  offset: number;
  barrier?: boolean | string;
  barrierDismiss?: boolean;
};

type StackOverlays = {
  entries: Map<string, OverlayEntryRec>;
  listeners: Set<() => void>;
};

const _stores = typeof window !== 'undefined' ? new Map<string, StackOverlays>() : null;

export function getOverlayStore(stackId: string): StackOverlays {
  if (!_stores) return { entries: new Map(), listeners: new Set() }; // SSR: throwaway
  let s = _stores.get(stackId);
  if (!s) {
    s = { entries: new Map(), listeners: new Set() };
    _stores.set(stackId, s);
  }
  return s;
}

export function notifyOverlays(stackId: string): void {
  _stores?.get(stackId)?.listeners.forEach((fn) => {
    try { fn(); } catch { /* listener errors must not break navigation */ }
  });
}

export function subscribeOverlays(stackId: string, fn: () => void): () => void {
  const s = getOverlayStore(stackId);
  s.listeners.add(fn);
  return () => { s.listeners.delete(fn); };
}

export function disposeOverlays(stackId: string): void {
  _stores?.delete(stackId);
}

export const OVERLAY_BAND = 1000;

export function clampOffset(n: number | undefined): number {
  const v = Math.floor(n ?? 500);
  return Math.min(999, Math.max(1, v));
}
