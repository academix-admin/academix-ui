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
};

export const _clientRegistry =
  typeof window !== 'undefined' ? new Map<string, RegistryEntry>() : null;

export function getRegistry(): Map<string, RegistryEntry> {
  if (typeof window !== 'undefined') {
    return _clientRegistry!;
  }
  return new Map<string, RegistryEntry>();
}
