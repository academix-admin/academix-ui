import type { ScrollBroadcastEvent, ScrollListener, NavStackAPI, RenderRecord, StackEntry } from '../types';
import type { GroupNavigationContextType } from '../core/contexts';
import { getRegistry } from '../core/registry';
// Scroll broadcast + unified scroll restoration.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export class ScrollBroadcaster {
  private listeners: Set<ScrollListener> = new Set();
  private containerRegistry: Map<string, HTMLElement> = new Map();
  private lastEvents: Map<string, ScrollBroadcastEvent> = new Map();

  // ✅ Track which UIDs are "ready" (container detected and initial broadcast sent)
  private readyUids: Set<string> = new Set();

  // ✅ Queue of listeners waiting for specific UIDs to become ready
  private pendingListeners: Map<string, Set<ScrollListener>> = new Map();

  /**
   * Subscribe to scroll events globally
   * Immediately delivers cached events for ready UIDs
   * Queues listener for UIDs that aren't ready yet
   */
  subscribe(listener: ScrollListener): () => void {
    this.listeners.add(listener);

    // ✅ Deliver all cached events for READY UIDs synchronously
    this.lastEvents.forEach((evt, uid) => {
      // Only deliver if UID is marked as ready (container detected + initial broadcast sent)
      if (this.readyUids.has(uid)) {
        try {
          // Skip invalid snapshots
          if ((evt.clientHeight === undefined) &&
            (evt.scrollHeight === undefined)) {
            return;
          }

          listener(evt);
        } catch (e) {
          console.error('[ScrollBroadcaster] Error delivering cached event:', e);
        }
      } else {
        // ✅ Queue listener for this UID - will be notified when ready
        if (!this.pendingListeners.has(uid)) {
          this.pendingListeners.set(uid, new Set());
        }
        this.pendingListeners.get(uid)!.add(listener);
      }
    });

    return () => {
      this.listeners.delete(listener);
      // Clean up from pending queues
      this.pendingListeners.forEach((set) => set.delete(listener));
    };
  }

  /**
   * Register a container element for a UID
   * This marks the UID as detected but not yet ready
   */
  registerContainer(uid: string, el: HTMLElement | null) {
    try {
      if (el) {
        this.containerRegistry.set(uid, el);
        // Note: NOT marking as ready yet - waiting for initial broadcast
      } else {
        this.containerRegistry.delete(uid);
        this.readyUids.delete(uid);
        this.pendingListeners.delete(uid);
      }
    } catch (err) {
      console.warn('[ScrollBroadcaster] registerContainer error:', err);
    }
  }

  getRegisteredContainer(uid: string): HTMLElement | undefined {
    return this.containerRegistry.get(uid);
  }

  unregisterContainer(uid: string) {
    this.containerRegistry.delete(uid);
    this.readyUids.delete(uid);
    this.pendingListeners.delete(uid);
  }

  /**
   * Broadcast a scroll event
   * If this is the first broadcast for a UID, notify all pending listeners
   */
  broadcast(event: ScrollBroadcastEvent): void {
    const { uid } = event;
    const wasReady = this.readyUids.has(uid);

    // Cache the event
    this.lastEvents.set(uid, event);

    // ✅ If this is the FIRST broadcast for this UID, mark it as ready
    if (!wasReady) {
      this.readyUids.add(uid);

      // ✅ Notify all pending listeners that were waiting for this UID
      const pending = this.pendingListeners.get(uid);
      if (pending && pending.size > 0) {
        pending.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('[ScrollBroadcaster] Error notifying pending listener:', error);
          }
        });
        // Clear pending queue for this UID
        this.pendingListeners.delete(uid);
      }
    }

    // Broadcast to all current listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[ScrollBroadcaster] Error in listener:', error);
      }
    });
  }

  hasListeners(): boolean {
    return this.listeners.size > 0;
  }
}

export const scrollBroadcaster = new ScrollBroadcaster();


export const useScrollBroadcast = (callback: (event: ScrollBroadcastEvent) => void) => {
  useEffect(() => {
    return scrollBroadcaster.subscribe(callback);
  }, [callback]);
};


export const globalScrollData = {
  scrollPositions: new Map<string, number>(),
  lastUid: null as string | null,
  lastGroupStackKey: null as string | null,
  // lastActive: true,
};

export interface ContainerData {
  element: HTMLElement;
  level: number;
  maxHeight: string;
  overflowX: string;
  overflowY: string;
  clientHeight: number;
  clientWidth: number;
  scrollHeight: number;
  scrollWidth: number;
  score: number;
}

// ==================== Unified Scroll Restoration ====================
// Works for both standalone and group NavigationStacks with the same sophisticated logic

export function useUnifiedScrollRestoration(
  api: NavStackAPI,
  renders: RenderRecord[],
  stackSnapshot: StackEntry[],
  groupContext: GroupNavigationContextType | null,
  groupStackId: string | null,
  enabled: boolean = true
) {
  // Composite key: groupId:stackId for groups, or 'standalone:stackId' for standalone
  const groupStackKey = groupContext
    ? `${groupContext.getGroupId()}:${groupStackId}`
    : `standalone:${api.id}`;

  const scrollData = useRef<{
    scrollContainers: Map<string, ContainerData>;
    wasActiveGroup: boolean;
    activeListeners: Map<string, () => void>;
    pendingListeners: Set<string>;
    pendingCleanups?: Map<string, { observer: MutationObserver; timeoutId: ReturnType<typeof setTimeout> }>;
  }>({
    scrollContainers: new Map(),
    wasActiveGroup: false,
    activeListeners: new Map(),
    pendingListeners: new Set()
  }).current;

  // For standalone: always active. For groups: check if active in group
  const isActiveGroup = groupContext ? groupContext.isActiveStack(groupStackId || '') : true;

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Same scrollable container detection as group version
  const findScrollableContainer = (uid: string): ContainerData | null => {
    const pageElement = document.querySelector(`[data-nav-uid="${uid}"]`) as HTMLElement;

    if (!pageElement) {
      return null;
    }

    const style = getComputedStyle(pageElement);
    const overflowY = style.overflowY;

    return {
      element: pageElement,
      level: 0,
      maxHeight: 'auto',
      overflowX: style.overflowX,
      overflowY: overflowY,
      clientHeight: pageElement.clientHeight,
      clientWidth: pageElement.clientWidth,
      scrollHeight: pageElement.scrollHeight,
      scrollWidth: pageElement.scrollWidth,
      score: 100
    };
  };

  const getScrollableContainer = (uid: string): HTMLElement | null => {
    if (typeof document === 'undefined') return null;

    const cached = scrollData.scrollContainers.get(uid);
    if (cached) {
      if (document.contains(cached.element)) {
        return cached.element;
      } else {
        scrollData.scrollContainers.delete(uid);
      }
    }

    const container = findScrollableContainer(uid);
    if (container?.element) scrollData.scrollContainers.set(uid, container);
    return container?.element ?? null;
  };

  const getCurrentScrollPosition = (container: HTMLElement): number => {
    return container.scrollTop;
  };

  const setScrollPosition = (position: number, container: HTMLElement) => {
    container.scrollTop = position;
  };

  const addScrollListener = (container: HTMLElement, handler: () => void) => {
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  };

  // Set up listeners for ALL pages in the stack (same as group version)
  useEffect(() => {
    if (!enabled) return;
    const registry = getRegistry();
    // Get ALL current UIDs from this stack
    const currentUids = new Set<string>();
    const collected = new Set<string>();

    const collectUidsFromStack = (stackId: string) => {
      if (collected.has(stackId)) return;
      collected.add(stackId);

      const regEntry = registry.get(stackId);
      if (!regEntry) return;

      if (regEntry.stack && Array.isArray(regEntry.stack)) {
        regEntry.stack.forEach((entry: StackEntry) => {
          currentUids.add(entry.uid);
        });
      }

      if (regEntry.childIds && regEntry.childIds.size > 0) {
        regEntry.childIds.forEach((childId: string) => {
          collectUidsFromStack(childId);
        });
      }
    };

    // For standalone: only collect from current stack. For groups: collect from entire tree
    if (typeof window !== 'undefined') {
      if (groupContext) {
        // Group mode: collect from entire tree
        registry.forEach((regEntry, stackId) => {
          if (!regEntry.parentId) {
            collectUidsFromStack(stackId);
          }
        });
      } else {
        // Standalone mode: only collect from current stack
        collectUidsFromStack(api.id);
      }
    }
    
    const trackedUids = new Set(scrollData.activeListeners.keys());

    // Add listeners for NEW pages that aren't already tracked
    currentUids.forEach(uid => {
      if (trackedUids.has(uid) || scrollData.pendingListeners.has(uid)) {
        return;
      }

      const entry = stackSnapshot.find(e => e.uid === uid);
      if (!entry) return;
      
      scrollData.pendingListeners.add(uid);

      const container = getScrollableContainer(uid);
      if (container) {
        attachScrollListener(uid, container, entry);
        scrollData.pendingListeners.delete(uid);
        return;
      }

      // Use MutationObserver to watch for DOM insertion
      const observer = new MutationObserver(() => {
        const container = getScrollableContainer(uid);
        if (container) {
          observer.disconnect();
          attachScrollListener(uid, container, entry);
          scrollData.pendingListeners.delete(uid);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        scrollData.pendingListeners.delete(uid);
      }, 5000);

      if (!scrollData.pendingCleanups) {
        scrollData.pendingCleanups = new Map();
      }
      scrollData.pendingCleanups.set(uid, { observer, timeoutId });
    });

    const attachScrollListener = (uid: string, container: HTMLElement, entry: StackEntry) => {
      const handleScroll = () => {
        const scrollPosition = getCurrentScrollPosition(container);
        globalScrollData.scrollPositions.set(uid, scrollPosition);

        const scrollHeight = container?.scrollHeight ?? 0;
        const clientHeight = container?.clientHeight ?? 0;
        const maxScroll = Math.max(scrollHeight - clientHeight, 0);
        const scrollPercentage = maxScroll > 0 ? (scrollPosition / maxScroll) * 100 : 0;

        scrollBroadcaster.broadcast({
          uid,
          pageKey: entry.key,
          position: scrollPosition,
          scrollPosition,
          scrollPercentage,
          container,
          clientHeight,
          scrollHeight,
          timestamp: Date.now(),
        });
      };

      const removeListener = addScrollListener(container, handleScroll);
      scrollData.activeListeners.set(uid, removeListener);
    };

    return () => {
      // Empty return - listeners stay active even when stack changes
    };
  }, [stackSnapshot, groupStackKey, api.id, groupContext, enabled]);

  // Restore scroll position when page becomes active
  useEffect(() => {
    if (!enabled) return;
    const topEntry = stackSnapshot.at(-1);
    if (!topEntry) {
      return;
    }

    const { uid } = topEntry;
    const { lastUid, lastGroupStackKey } = globalScrollData;

    const groupStackKeyChanged = lastGroupStackKey !== groupStackKey;
    const uidChanged = uid !== lastUid;
    const becameActive = !scrollData.wasActiveGroup && isActiveGroup;

    scrollData.wasActiveGroup = isActiveGroup;

    // Restore position when becoming active
    if (isActiveGroup && (groupStackKeyChanged || uidChanged || becameActive)) {
      const restoreScroll = () => {
        const scrollKey = uid;
        const container = getScrollableContainer(uid);
        if (!container) {
          return;
        }
        const savedPosition = globalScrollData.scrollPositions.get(scrollKey) ?? 0;
        setScrollPosition(savedPosition, container);
      };

      // Immediate restore
      restoreScroll();

      // Fallback restores
      requestAnimationFrame(() => {
        restoreScroll();
      });
      setTimeout(() => {
        restoreScroll();
      }, 20);
    }

    // Update global state
    globalScrollData.lastUid = uid;
    globalScrollData.lastGroupStackKey = groupStackKey;
  }, [stackSnapshot, isActiveGroup, groupStackKey, enabled]);

  // Clean up scroll for pages no longer in navigation system
  useEffect(() => {
    if (!enabled) return;
    const registry = getRegistry();
    const validUids = new Set<string>();
    const visited = new Set<string>();

    const collectUidsRecursive = (stackId: string) => {
      if (visited.has(stackId)) return;
      visited.add(stackId);

      const regEntry = registry.get(stackId);
      if (!regEntry) return;

      if (regEntry.stack && Array.isArray(regEntry.stack)) {
        regEntry.stack.forEach((entry: StackEntry) => {
          validUids.add(entry.uid);
        });
      }

      if (regEntry.childIds && regEntry.childIds.size > 0) {
        regEntry.childIds.forEach((childId: string) => {
          collectUidsRecursive(childId);
        });
      }
    };

    if (typeof window !== 'undefined') {
      if (groupContext) {
        // Group mode: traverse entire registry
        registry.forEach((regEntry, stackId) => {
          if (!regEntry.parentId) {
            collectUidsRecursive(stackId);
          }
        });
      } else {
        // Standalone mode: only traverse current stack
        collectUidsRecursive(api.id);
      }
    }

    // Delete scroll entries that don't exist in the navigation
    const keysToDelete: string[] = [];
    globalScrollData.scrollPositions.forEach((_, key) => {
      if (!validUids.has(key)) {
        keysToDelete.push(key);
      }
    });

    if (keysToDelete.length > 0) {
      keysToDelete.forEach(key => {
        const removeListener = scrollData.activeListeners.get(key);
        if (removeListener) {
          removeListener();
          scrollData.activeListeners.delete(key);
        }

        if (scrollData.pendingCleanups) {
          const cleanup = scrollData.pendingCleanups.get(key);
          if (cleanup) {
            cleanup.observer.disconnect();
            clearTimeout(cleanup.timeoutId);
            scrollData.pendingCleanups.delete(key);
          }
        }

        globalScrollData.scrollPositions.delete(key);
        scrollData.pendingListeners.delete(key);
      });
    }
  }, [stackSnapshot, api, groupContext, enabled]);
}

