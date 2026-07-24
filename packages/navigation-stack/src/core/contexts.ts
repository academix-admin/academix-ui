import type { NavStackAPI } from '../types';
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

