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

export function findParentNavContext(): NavStackAPI | null {
  try {
    return useContext(NavContext);
  } catch (e) {
    return null;
  }
}

