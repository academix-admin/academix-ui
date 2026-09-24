import type { GroupRef, NavStackAPI, StackEntry } from '../types';
// React contexts for navigation + group coordination.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export type GroupNavigationContextType = {
  getGroupId: () => string | null;
  getCurrent: () => string;
  goToGroupId: (groupId: string) => Promise<boolean>;
  isActiveStack: (stackId: string) => boolean;
};

export const GroupNavigationContext = createContext<GroupNavigationContextType | null>(null);
export const GroupStackIdContext = createContext<string | null>(null);

/**
 * The live group, read once, as a value the pure rules can take.
 *
 * Read AT THE CALL SITE rather than inside the rule: same synchronous frame, same answer, and the
 * rule stops needing anything it cannot be handed in a test.
 */
export function toGroupRef(groupContext: GroupNavigationContextType | null): GroupRef {
  return groupContext ? { id: groupContext.getGroupId() } : null;
}

export function useGroupNavigation() {
  const context = useContext(GroupNavigationContext);
  return context;
}

export function useGroupStackId() {
  const context = useContext(GroupStackIdContext);
  return context;
}

export const NavContext = createContext<NavStackAPI | null>(null);
export const CurrentPageContext = createContext<string | null>(null);

/**
 * The ENTRY a page is being rendered as — its key and its params.
 *
 * `useLocation` normally asks the api, which reads the live stack out of the registry. On a server
 * the registry is a fresh Map for every call (deliberately: a shared one would leak one request's
 * stack into another's HTML), so there is no stack to ask and a page rendered on a server would see
 * no params at all. Reading them from the entry being rendered works on both sides, which is the
 * only acceptable answer — a page must not need to know where it is running.
 */
export const CurrentEntryContext = createContext<StackEntry | null>(null);
export const _currentPageUidByStack = new Map<string, string>();

/**
 * Lets a ColumnBody/RowBody inside a page tell its page wrapper "I am the scroll
 * region." When claimed, the wrapper stops being a scroller and becomes a
 * keyboard-aware flex column (so a header/bottom-bar sibling stays pinned and the
 * body scrolls under it); the claimed element becomes the scroll-restore target.
 */
export type PageBodyContextValue = {
  uid: string;
  claimScroll: (el: HTMLElement | null) => void;
};
export const PageBodyContext = createContext<PageBodyContextValue | null>(null);

export function findParentNavContext(): NavStackAPI | null {
  try {
    return useContext(NavContext);
  } catch (e) {
    return null;
  }
}

