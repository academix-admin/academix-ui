import type { ScrollBroadcastEvent, ScrollListener, NavStackAPI, RenderRecord, StackEntry } from '../types';
import type { GroupNavigationContextType } from '../core/contexts';
import { CurrentPageContext } from '../core/contexts';
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


// ==================== Reusable scroll primitives ====================
// Built on the ScrollBroadcaster (which already tracks every page's scroll container). All are opt-in and
// additive. They latch edge events (fire once per ENTRY into the edge zone, re-arm with hysteresis after
// leaving) so callbacks — especially infinite-scroll loadMore — are STABLE and never loop while the edge
// stays in view.

export interface UseScrollEventsHandlers {
  /** Fires on every scroll of the target page's container. */
  onScrollChange?: (event: ScrollBroadcastEvent) => void;
  /** Fires ONCE when scrolling into `bottomThreshold` px of the bottom; re-arms after leaving the zone. */
  onBottomReached?: (event: ScrollBroadcastEvent) => void;
  /** Fires ONCE when scrolling into `topThreshold` px of the top; re-arms after leaving the zone. */
  onTopReached?: (event: ScrollBroadcastEvent) => void;
}

export interface UseScrollEventsOptions {
  /** Target page uid. Defaults to the current page (CurrentPageContext) — i.e. the page you're rendered in. */
  uid?: string | null;
  /** Distance (px) from the bottom that counts as "reached". Default 300. */
  bottomThreshold?: number;
  /** Distance (px) from the top that counts as "reached". Default 0. */
  topThreshold?: number;
  /** Turn all callbacks off without unmounting. Default true. */
  enabled?: boolean;
}

const REARM_HYSTERESIS = 24; // px past the threshold before re-arming, so a jittery scroll can't double-fire.

/**
 * Subscribe to a page's scroll: `onScrollChange` (continuous) + latched `onBottomReached` / `onTopReached`.
 * Reusable anywhere inside a NavigationStack (Scaffold / ColumnBody / RowBody all broadcast their scroll).
 */
export function useScrollEvents(handlers: UseScrollEventsHandlers, options: UseScrollEventsOptions = {}): void {
  const ctxUid = useContext(CurrentPageContext);
  const uid = options.uid !== undefined ? options.uid : ctxUid;
  const enabled = options.enabled ?? true;
  const bottomThreshold = options.bottomThreshold ?? 300;
  const topThreshold = options.topThreshold ?? 0;

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const armedRef = useRef({ bottom: true, top: true });

  const listener = useCallback(
    (event: ScrollBroadcastEvent) => {
      if (!enabled) return;
      if (uid && event.uid !== uid) return;

      const h = handlersRef.current;
      h.onScrollChange?.(event);

      const distToBottom = event.scrollHeight - (event.scrollPosition + event.clientHeight);
      if (distToBottom <= bottomThreshold) {
        if (armedRef.current.bottom) {
          armedRef.current.bottom = false;
          h.onBottomReached?.(event);
        }
      } else if (distToBottom > bottomThreshold + REARM_HYSTERESIS) {
        armedRef.current.bottom = true;
      }

      const distToTop = event.scrollPosition;
      if (distToTop <= topThreshold) {
        if (armedRef.current.top) {
          armedRef.current.top = false;
          h.onTopReached?.(event);
        }
      } else if (distToTop > topThreshold + REARM_HYSTERESIS) {
        armedRef.current.top = true;
      }
    },
    [uid, enabled, bottomThreshold, topThreshold],
  );

  useScrollBroadcast(listener);
}

export interface UseInfiniteScrollOptions {
  /** Called when the bottom edge is reached and it's allowed to load (guarded by hasMore + loading). */
  onLoadMore: () => void;
  /** Set false when the last page returned no new rows — stops any further loads (kills the loadMore loop). */
  hasMore?: boolean;
  /** Your in-flight flag — while true, no new load fires. */
  loading?: boolean;
  /** Distance (px) from the bottom that triggers a load (prefetch margin). Default 300. */
  threshold?: number;
  /** Target page uid. Defaults to the current page. */
  uid?: string | null;
  /** Turn it off without unmounting. Default true. */
  enabled?: boolean;
}

/**
 * Stable infinite scroll on top of `useScrollEvents`. Because the bottom event is LATCHED and guarded by
 * `hasMore` + `loading`, `onLoadMore` fires at most once per approach to the bottom and never loops when the
 * result is unchanged/exhausted. No sentinel element needed — it reads the page's real scroll container.
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions): void {
  const optsRef = useRef(options);
  optsRef.current = options;

  useScrollEvents(
    {
      onBottomReached: () => {
        const o = optsRef.current;
        if (o.enabled === false) return;
        if (o.hasMore === false) return;
        if (o.loading) return;
        o.onLoadMore();
      },
    },
    { uid: options.uid, bottomThreshold: options.threshold ?? 300, enabled: options.enabled },
  );
}

export interface UseInfiniteScrollObserverOptions {
  /** Called when the sentinel enters view and it's allowed to load (guarded by hasMore + loading). */
  onLoadMore: () => void;
  /** Set false when the last page returned no new rows — stops further loads (kills the loadMore loop). */
  hasMore?: boolean;
  /** Your in-flight flag — while true, no new load fires. */
  loading?: boolean;
  /** Prefetch margin around the root (px or a CSS margin string). Default '320px'. */
  rootMargin?: string;
  /**
   * The scroll container to observe within. Default: the viewport. For a container that mounts after this
   * hook (a ref that starts null), pass a getter `() => scrollRef.current` — it's read when the sentinel
   * attaches. Works for vertical page lists AND horizontal carousels.
   */
  root?: Element | null | (() => Element | null);
  /** Turn it off without unmounting. Default true. */
  enabled?: boolean;
}

/**
 * Stable IntersectionObserver infinite scroll — a drop-in for the common `loaderRef + IntersectionObserver
 * in a useEffect` pattern, but WITHOUT its loop bug. The usual bug: the effect re-runs whenever `loadMore`
 * (or state it closes over) changes, so the observer is torn down and re-created; if the sentinel is still
 * in view, the fresh observer fires immediately → another load → repeat. Here the observer is created ONCE
 * when the sentinel attaches and reads `onLoadMore`/`hasMore`/`loading` from a live ref, so it only fires on
 * a real intersection change and stops when `hasMore` is false.
 *
 * Returns a callback ref — attach it to your sentinel element: `<div ref={useInfiniteScrollObserver(...)} />`.
 */
export function useInfiniteScrollObserver(
  options: UseInfiniteScrollObserverOptions,
): (node: Element | null) => void {
  const optsRef = useRef(options);
  optsRef.current = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);

  const connect = useCallback(() => {
    observerRef.current?.disconnect();
    const node = nodeRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const o = optsRef.current;
    const root = typeof o.root === 'function' ? o.root() : o.root ?? null;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const s = optsRef.current;
        if (s.enabled === false || s.hasMore === false || s.loading) return;
        s.onLoadMore();
      },
      { root, rootMargin: o.rootMargin ?? '320px', threshold: 0 },
    );
    observerRef.current.observe(node);
  }, []);

  const setRef = useCallback(
    (node: Element | null) => {
      nodeRef.current = node;
      if (!node) {
        observerRef.current?.disconnect();
        return;
      }
      // Defer to a microtask: a callback ref fires during commit child-first, so an ANCESTOR scroll
      // container passed as `root: () => ref.current` isn't attached yet. After commit (microtask) it is.
      queueMicrotask(() => {
        if (nodeRef.current === node) connect();
      });
    },
    [connect],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return setRef;
}

export interface UsePullToRefreshOptions {
  /** Called when the user pulls past `threshold` at the top. May be async; `refreshing` is true until it settles. */
  onRefresh: () => void | Promise<void>;
  /** Target page uid. Defaults to the current page. */
  uid?: string | null;
  /** Turn it off. Default true. */
  enabled?: boolean;
  /** Pull distance (px) required to trigger a refresh. Default 72. */
  threshold?: number;
  /** Max reported pull distance. Default 120. */
  maxPull?: number;
  /** Pull resistance factor (0-1). Default 0.5. */
  resistance?: number;
}

export interface PullToRefreshState {
  refreshing: boolean;
  /** Current pull distance (px), for rendering an indicator. 0 when idle. */
  pullDistance: number;
}

/**
 * Swipe-down-to-refresh for a page's scroll container (touch). Returns `{ refreshing, pullDistance }` so the
 * caller can render an indicator. Passive listeners — it never blocks native scrolling; it only acts when the
 * container is already at the top.
 */
export function usePullToRefresh(options: UsePullToRefreshOptions): PullToRefreshState {
  const ctxUid = useContext(CurrentPageContext);
  const uid = options.uid !== undefined ? options.uid : ctxUid;

  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const optsRef = useRef(options);
  optsRef.current = options;
  const pullRef = useRef(0);
  pullRef.current = pullDistance;
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!uid) return;
    if (optsRef.current.enabled === false) return;
    if (typeof document === 'undefined') return;

    let container: HTMLElement | null = null;
    let startY = 0;
    let pulling = false;
    let raf = 0;
    let tries = 0;

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || !container) return;
      if (container.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!pulling || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        pulling = false;
        setPullDistance(0);
        return;
      }
      const o = optsRef.current;
      setPullDistance(Math.min(dy * (o.resistance ?? 0.5), o.maxPull ?? 120));
    };
    const onEnd = async () => {
      if (!pulling) return;
      pulling = false;
      const o = optsRef.current;
      if (pullRef.current >= (o.threshold ?? 72)) {
        refreshingRef.current = true;
        setRefreshing(true);
        try {
          await o.onRefresh();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
        }
      }
      setPullDistance(0);
    };

    const bind = () => {
      container = scrollBroadcaster.getRegisteredContainer(uid) ?? null;
      if (!container) {
        if (tries++ < 60) raf = requestAnimationFrame(bind);
        return;
      }
      container.addEventListener('touchstart', onStart, { passive: true });
      container.addEventListener('touchmove', onMove, { passive: true });
      container.addEventListener('touchend', onEnd, { passive: true });
      container.addEventListener('touchcancel', onEnd, { passive: true });
    };
    bind();

    return () => {
      cancelAnimationFrame(raf);
      if (container) {
        container.removeEventListener('touchstart', onStart);
        container.removeEventListener('touchmove', onMove);
        container.removeEventListener('touchend', onEnd);
        container.removeEventListener('touchcancel', onEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return { refreshing, pullDistance };
}


/**
 * What the container looked like when a scroll position was captured.
 *
 * A pixel offset only means something at the width it was measured at. Capture 200px at 1200px
 * wide, restore it at 430px, and the content has reflowed underneath: 200px is now a different
 * place in the document — usually much further down, since narrower columns make everything taller.
 * The restore "works" and lands somewhere the user never was.
 *
 * Stored in a SEPARATE map rather than widening `scrollPositions`, which is part of the exported
 * `globalScrollData` surface — changing its value type would break anything reading it.
 */
type ScrollMetrics = {
  /** Container width at capture time. */
  width: number;
  /** Maximum scrollable distance at capture time (scrollHeight - clientHeight). */
  maxScroll: number;
};

export const globalScrollData = {
  scrollPositions: new Map<string, number>(),
  scrollMetrics: new Map<string, ScrollMetrics>(),
  lastUid: null as string | null,
  lastGroupStackKey: null as string | null,
  // lastActive: true,
};

/** Widths within this many px count as unchanged — scrollbars and subpixel rounding move it slightly. */
const WIDTH_TOLERANCE_PX = 2;

/**
 * Where to scroll to, given what the container looked like when the position was captured.
 *
 * Same width: the exact pixel offset, which is what the user actually saw.
 * Different width: the same PROPORTION of the document. Not perfect — proportional position is not
 * semantic position, and only a content anchor would be — but it keeps the user near where they
 * were instead of at an offset that now means something else entirely.
 */
export function resolveScrollTarget(
  saved: number,
  captured: ScrollMetrics | undefined,
  currentWidth: number,
  currentMaxScroll: number,
): number {
  if (saved <= 0) return 0;
  if (!captured || captured.maxScroll <= 0) return Math.min(saved, Math.max(currentMaxScroll, 0));

  if (Math.abs(captured.width - currentWidth) <= WIDTH_TOLERANCE_PX) {
    return Math.min(saved, Math.max(currentMaxScroll, 0));
  }

  const ratio = saved / captured.maxScroll;
  return Math.min(Math.round(ratio * currentMaxScroll), Math.max(currentMaxScroll, 0));
}

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

  // Same scrollable container detection as group version.
  // Prefer an explicitly registered scroll element (e.g. a ColumnBody/RowBody that
  // claimed the scroll from its page wrapper) — the wrapper itself is then
  // `overflow:hidden` and would be the wrong element to listen to / restore. Falls
  // back to the page wrapper for default pages (which register themselves).
  const findScrollableContainer = (uid: string): ContainerData | null => {
    const registered = scrollBroadcaster.getRegisteredContainer(uid);
    const pageElement =
      registered && document.contains(registered)
        ? registered
        : (document.querySelector(`[data-nav-uid="${uid}"]`) as HTMLElement);

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

    // Declared as a hoisted `function`, not a `const` arrow.
    //
    // It is CALLED above, in the forEach that wires up new pages -- 33 lines before this point. As a
    // const it sits in the temporal dead zone at that moment, so the synchronous branch (the page's
    // scroll container already in the DOM) threw "Cannot access 'attachScrollListener' before
    // initialization" and killed scroll tracking for that page.
    //
    // It hid because the synchronous branch is the uncommon one: with a single stack the container
    // usually is not mounted yet, so the MutationObserver path runs instead and fires long after
    // this line has executed. A SECOND mounted stack changes that -- its container is already there
    // -- which is why this only showed up with sibling stacks, the exact shape academix-web runs.
    function attachScrollListener(uid: string, container: HTMLElement, entry: StackEntry) {
      const handleScroll = () => {
        const scrollPosition = getCurrentScrollPosition(container);
        globalScrollData.scrollPositions.set(uid, scrollPosition);

        const scrollHeight = container?.scrollHeight ?? 0;
        const clientHeight = container?.clientHeight ?? 0;
        const maxScroll = Math.max(scrollHeight - clientHeight, 0);

        // Recorded with every position: a pixel offset is only meaningful at the width it was taken
        // at, and the width can change between capture and restore (rotation, resize, a responsive
        // breakpoint).
        globalScrollData.scrollMetrics.set(uid, {
          width: container?.clientWidth ?? 0,
          maxScroll,
        });
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
    }

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
        const captured = globalScrollData.scrollMetrics.get(scrollKey);
        const currentMaxScroll = Math.max(
          (container.scrollHeight ?? 0) - (container.clientHeight ?? 0),
          0,
        );
        setScrollPosition(
          resolveScrollTarget(savedPosition, captured, container.clientWidth ?? 0, currentMaxScroll),
          container,
        );
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
        globalScrollData.scrollMetrics.delete(key);
        scrollData.pendingListeners.delete(key);
      });
    }
  }, [stackSnapshot, api, groupContext, enabled]);
}

