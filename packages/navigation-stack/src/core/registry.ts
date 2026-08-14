import type { AsyncLifecycleHandler, GuardFn, LifecycleHandler, LifecycleHook, MiddlewareFn, NavStackAPI, NavigationMap, RedirectFn, StackChangeListener, StackEntry } from '../types';
// Per-stack registry of live navigation instances.
import type { ComponentType, ReactNode, ReactElement } from 'react';

export type RegistryEntry = {
  stack: StackEntry[];
  listeners: Set<StackChangeListener>;
  guards: Set<GuardFn>;
  middlewares: Set<MiddlewareFn>;
  /** C2 — redirect resolvers (optional: entries created by older code paths may lack it). */
  redirects?: Set<RedirectFn>;
  maxStackSize: number;
  historySyncEnabled: boolean;
  snapshotBuffer: StackEntry[];
  parentId: string | null;
  childIds: Set<string>;
  navLink?: NavigationMap;
  api?: NavStackAPI;
  currentPath?: string;
  isInGroup?: boolean;
  groupId?: string;
  lifecycleHandlers: Map<LifecycleHook, Set<LifecycleHandler | AsyncLifecycleHandler>>;
  currentState: 'active' | 'paused' | 'background';
  lastActiveEntry?: StackEntry;
  /**
   * Set while the popstate handler is re-deriving the stack from the restored URL. A pop caused by
   * the browser must not hand history entries back again — the browser has already moved. Without
   * this, browser-back would pop one page and then consume a second entry, skipping a page.
   */
  popstateInFlight?: boolean;
  /**
   * Serial of the last history entry this stack applied. Lets a popstate for a generation we have
   * already applied be skipped rather than re-derived — the browser can deliver one for state we
   * just wrote ourselves when an async history.go lands after the stack was mutated.
   */
  lastAppliedSerial?: number;
};

export const _clientRegistry =
  typeof window !== 'undefined' ? new Map<string, RegistryEntry>() : null;

export function getRegistry(): Map<string, RegistryEntry> {
  if (typeof window !== 'undefined') {
    return _clientRegistry!;
  }
  return new Map<string, RegistryEntry>();
}

/**
 * Imperatively pop a registered stack to its root, from anywhere — even outside the React tree
 * (e.g. a NavigationBar rendered as a sibling of the stacks). Powers the native "tap the already-active
 * tab to return to that tab's root page" gesture. Looks the stack up by id in the shared live registry,
 * so callers must share this module's singleton (import from the SAME installed navigation-stack).
 *
 * Safe: resolves `false` (no-op) if the id isn't registered or the stack has no popToRoot, and never
 * throws. `stackId` is the NavigationStack's `id` (which, for a tab bar, matches the tab/nav item id).
 */
export function popStackToRoot(stackId: string): Promise<boolean> {
  try {
    const api = getRegistry().get(stackId)?.api;
    if (!api?.popToRoot) return Promise.resolve(false);
    return Promise.resolve(api.popToRoot())
      .then((r) => r !== false)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}
