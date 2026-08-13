import type { BuiltinTransition, LazyComponent, MissingRouteConfig, NavStackAPI, NavigationMap, OverlayRender, RedirectFn, RenderRecord, StackEntry, SwipeBackOptions, TransitionRenderer, TransitionState } from './types';
import type { GroupNavigationContextType } from './core/contexts';
import { DEFAULT_MAX_STACK_SIZE, DEFAULT_TRANSITION_DURATION, GROUP_STYLE_CSS, useIsomorphicLayoutEffect } from './constants';
import { NavContext, CurrentPageContext, GroupNavigationContext, GroupStackIdContext, PageBodyContext, findParentNavContext, useGroupNavigation, useGroupStackId, _currentPageUidByStack } from './core/contexts';
import { PageMemoryManager, TransitionManager } from './core/managers';
import { getRegistry, type RegistryEntry } from './core/registry';
import { buildUrlPath, decodeStackPath, generateCompositeUid, isEqual, parseCombinedNavParam, parseRawKey, parseUrlPathIntoStacks, readPersistedStack, removeNavQueryParamForStack, updateNavQueryParamForStack, writePersistedStack } from './core/persistence';
import { createApiFor } from './core/api';
import { scrollBroadcaster, useUnifiedScrollRestoration } from './scroll';
import { useSwipeBack } from './gestures/swipe-back';
import { subscribeOverlays, getOverlayStore, notifyOverlays, clampOffset } from './overlay/registry';

let _groupStyleMountCount = 0;
// Rendered components: loaders, transitions, error boundary, group + main stack.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export function LazyRouteLoader({ lazyComponent }: { lazyComponent: () => LazyComponent }) {
  const LazyComponent = lazy(lazyComponent);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

export function MissingRoute({
  entry,
  isTop,
  api,
  config = {}
}: {
  entry: StackEntry;
  isTop: boolean;
  api: NavStackAPI;
  config?: MissingRouteConfig;
}) {
  const defaultLabels = {
    missingRoute: 'Missing route',
    goBack: 'Go Back',
    goToRoot: 'Go to Root'
  };

  const {
    className = '',
    containerClassName = '',
    textClassName = '',
    buttonClassName = '',
    labels = {}
  } = config;

  const mergedLabels = { ...defaultLabels, ...labels };

  const handleNavigation = () => {
    if (api.length() > 1) {
      api.pop();
    } else {
      api.popToRoot();
    }
  };

  return (
    <div
      className={`navstack-page ${className} ${containerClassName}`}
      inert={!isTop}
      data-nav-uid={entry.uid}
      ref={(el) => {
        if (!el) {
          try {
            scrollBroadcaster.unregisterContainer(entry.uid);
          } catch (e) { }
          return;
        }

        try {
          scrollBroadcaster.registerContainer(entry.uid, el);

          requestAnimationFrame(() => {
            if (!document.contains(el)) return;

            const clientHeight = el.clientHeight;
            const scrollHeight = el.scrollHeight;
            const position = el.scrollTop;
            const max = Math.max(scrollHeight - clientHeight, 0);
            const percentage = max > 0 ? (position / max) * 100 : 0;

            scrollBroadcaster.broadcast({
              uid: entry.uid,
              pageKey: entry.key || entry.uid,
              position,
              scrollPosition: position,
              scrollPercentage: percentage,
              container: el,
              clientHeight,
              scrollHeight,
              timestamp: Date.now(),
            });
          });
        } catch (e) {
          console.error(`[RefCallback] Error for uid=${entry.uid}:`, e);
        }
      }}
    >
      <div className={`navstack-missing-route ${textClassName}`} style={{ padding: 16 }}>
        <strong>{mergedLabels.missingRoute}:</strong> {entry.key}
        <button
          className={`navstack-missing-route-button ${buttonClassName}`}
          onClick={handleNavigation}
        >
          {api.length() > 1 ? mergedLabels.goBack : mergedLabels.goToRoot}
        </button>
      </div>
    </div>
  );
}

/**
 * Shared per-page wrapper used by every transition renderer. It renders the
 * `.navstack-page` div and owns scroll registration. By default it IS the page
 * scroller (current behavior). When a ColumnBody/RowBody inside it claims the
 * scroll (via PageBodyContext), it switches to a keyboard-aware flex column
 * (`overflow:hidden` + `padding-bottom: var(--ax-keyboard-inset)`) so a header/
 * bottom-bar sibling stays pinned and the claimed body scrolls under it — and the
 * claimed element becomes the scroll-restore target instead of the wrapper.
 */
function NavPageShell({
  uid,
  isTop,
  transitionClassName = '',
  children,
}: {
  uid: string;
  isTop: boolean;
  transitionClassName?: string;
  children: React.ReactNode;
}) {
  const [bodyEl, setBodyEl] = useState<HTMLElement | null>(null);
  const claimed = bodyEl != null;

  const claimScroll = useCallback((el: HTMLElement | null) => setBodyEl(el), []);
  const ctxValue = useMemo(() => ({ uid, claimScroll }), [uid, claimScroll]);

  // Attach a scroll relay + registration to a scroll element: registers it as the
  // scroll-restore target and broadcasts every scroll so a NavigationBar in
  // autohide mode keeps getting events. Returns a cleanup.
  const attachScroll = useCallback((el: HTMLElement) => {
    const emit = () => {
      if (!document.contains(el)) return;
      const clientHeight = el.clientHeight;
      const scrollHeight = el.scrollHeight;
      const position = el.scrollTop;
      const max = Math.max(scrollHeight - clientHeight, 0);
      const percentage = max > 0 ? (position / max) * 100 : 0;
      scrollBroadcaster.broadcast({
        uid,
        pageKey: uid,
        position,
        scrollPosition: position,
        scrollPercentage: percentage,
        container: el,
        clientHeight,
        scrollHeight,
        timestamp: Date.now(),
      });
    };
    scrollBroadcaster.registerContainer(uid, el);
    el.addEventListener('scroll', emit, { passive: true });
    const raf = requestAnimationFrame(emit);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', emit);
    };
  }, [uid]);

  // The wrapper's scroll relay is wired via a CALLBACK REF (not a useEffect) so it
  // always re-attaches to the LIVE wrapper element. A plain page's `bodyEl` never
  // changes, so a `[uid, bodyEl]` effect would leave the scroll listener on a
  // stale, detached wrapper after any re-render — which silently broke autohide on
  // every non-Scaffold page. Only relays while NOT claimed (when claimed, the
  // ColumnBody below is the scroller).
  const wrapCleanup = useRef<null | (() => void)>(null);
  const setWrapperEl = useCallback(
    (el: HTMLDivElement | null) => {
      if (wrapCleanup.current) {
        wrapCleanup.current();
        wrapCleanup.current = null;
      }
      if (el && bodyEl == null) {
        wrapCleanup.current = attachScroll(el);
      }
    },
    [attachScroll, bodyEl],
  );

  // When a ColumnBody claims the scroll, it becomes the scroller — relay + register
  // it (overriding the wrapper). `bodyEl` in deps → robustly re-attaches on change.
  useEffect(() => {
    if (!bodyEl) return;
    return attachScroll(bodyEl);
  }, [bodyEl, attachScroll]);

  useEffect(
    () => () => {
      try {
        scrollBroadcaster.unregisterContainer(uid);
      } catch (e) { }
    },
    [uid],
  );

  const style: React.CSSProperties = claimed
    ? {
        // Keyboard-agnostic: the ColumnBody just fills its wrapper as a flex column.
        // Keyboard-awareness belongs to the app shell, which sizes itself to the
        // visible viewport (see academix-web ViewInsetsProvider + mainContainer).
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }
    : {
        overflowY: isTop ? 'auto' : 'hidden',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        width: '100%',
        height: '100%',
      };

  return (
    <PageBodyContext.Provider value={ctxValue}>
      <div
        ref={setWrapperEl}
        className={`navstack-page ${transitionClassName}`.trim()}
        inert={!isTop}
        data-nav-uid={uid}
        style={style}
      >
        {children}
      </div>
    </PageBodyContext.Provider>
  );
}

export function SlideTransitionRenderer({
  children,
  state,
  isTop,
  uid,
  baseClass,
}: {
  children: React.ReactNode;
  state: TransitionState;
  isTop: boolean;
  uid: string;
  baseClass: string;
}) {
  const [stage, setStage] = useState<"init" | "active" | "done">(state === "enter" ? "init" : "done");

  useEffect(() => {
    if (state === "enter") {
      setStage("init");
      const frame = requestAnimationFrame(() => {
        setStage("active");
        setTimeout(() => setStage("done"), DEFAULT_TRANSITION_DURATION);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [state]);

  const slideCls =
    state === "enter"
      ? stage === "init"
        ? "nav-slide-enter"
        : stage === "active"
          ? "nav-slide-enter-active"
          : ""
      : state === "exit"
        ? "nav-slide-exit nav-slide-exit-active"
        : "";

  return (
    <NavPageShell uid={uid} isTop={isTop} transitionClassName={slideCls}>
      {children}
    </NavPageShell>
  );
}

export function FadeTransitionRenderer({
  children,
  state,
  isTop,
  uid,
  baseClass
}: {
  children: React.ReactNode;
  state: TransitionState;
  isTop: boolean;
  uid: string;
  baseClass: string;
}) {
  const [stage, setStage] = useState<"active" | "done">(state === "enter" ? "active" : "done");

  useEffect(() => {
    if (state === "enter") {
      setStage("active");
      setTimeout(() => setStage("done"), DEFAULT_TRANSITION_DURATION);
    }
  }, [state]);

  const fadeCls =
    state === "enter"
      ? stage === "active"
        ? "nav-fade-enter nav-fade-enter-active"
        : ""
      : state === "exit"
        ? "nav-fade-exit nav-fade-exit-active"
        : "";

  return (
    <NavPageShell uid={uid} isTop={isTop} transitionClassName={fadeCls}>
      {children}
    </NavPageShell>
  );
}

// ==================== Error Boundary & Safety Utilities ====================

/**
 * Error Boundary Component for lazy-loaded components and navigation
 * Prevents crashes from propagating up the component tree
 */
export class NavigationErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[NavigationErrorBoundary] Error caught:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#d32f2f',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Check if code is running in browser (not SSR)
 */

export type GroupNavigationStackProps = {
  id: string;
  navStack: Map<string, React.ReactElement>;
  current: string;
  onCurrentChange?: (id: string) => void;
  persist?: boolean;
  preloadAll?: boolean;
  defaultStack?: string;
};

export const GROUP_STATE_STORAGE_KEY = 'navstack-group-state';

export function readGroupState(groupId: string): { activeStack: string; } | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(`${GROUP_STATE_STORAGE_KEY}:${groupId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return null;
  }
}

export function writeGroupState(groupId: string, activeStack: string) {
  try {
    if (typeof window === "undefined") return;
    const state = { activeStack, timestamp: Date.now() };
    sessionStorage.setItem(`${GROUP_STATE_STORAGE_KEY}:${groupId}`, JSON.stringify(state));
  } catch (e) { }
}

export function clearGroupState(groupId: string) {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(`${GROUP_STATE_STORAGE_KEY}:${groupId}`);
  } catch (e) { }
}

export function GroupNavigationStack({
  id,
  navStack,
  current,
  onCurrentChange,
  persist = false,
  preloadAll = true,
  defaultStack
}: GroupNavigationStackProps) {

  const [hydrated, setHydrated] = useState(false);
  const previousActiveStackId = useRef<string | null>(null);

  // Group-specific CSS injection
  useEffect(() => {
    if (typeof document === "undefined") return;

    _groupStyleMountCount++;

    let styleEl = document.getElementById("navstack-group-styles") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "navstack-group-styles";
      styleEl.innerHTML = GROUP_STYLE_CSS;
      document.head.appendChild(styleEl);
    }

    return () => {
      _groupStyleMountCount--;
      if (_groupStyleMountCount === 0) {
        const styleElement = document.getElementById("navstack-group-styles");
        if (styleElement && styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      }
    };
  }, []);

  // Get initial active stack from URL or persisted storage
  const getInitialActiveStackId = (): string => {
    if (typeof window === 'undefined') return current;

    try {
      // First priority: URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const urlGroup = urlParams.get('group');
      if (urlGroup && navStack.has(urlGroup)) {
        return urlGroup;
      }

      // Second priority: Persisted storage
      if (persist) {
        const savedState = readGroupState(id);
        if (savedState?.activeStack && navStack.has(savedState.activeStack)) {
          return savedState.activeStack;
        }
      }

      // Fallback: current prop
      return current;
    } catch (e) {
      console.warn('Failed to parse URL for group navigation:', e);
      return current;
    }
  };
  const [activeStackId, setActiveStackId] = useState<string>(getInitialActiveStackId);

  // Hydrate on mount
  useEffect(() => {
    const initialActiveStackId = getInitialActiveStackId();

    // Only update if different from current state
    if (initialActiveStackId !== activeStackId) {
      setActiveStackId(initialActiveStackId);
      onCurrentChange?.(initialActiveStackId);
    } else {
      onCurrentChange?.(initialActiveStackId);
    }

    // Mark as hydrated after a small delay to ensure all stacks are initialized
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Sync activeStackId with current prop when it changes from external
  useEffect(() => {
    if (current === activeStackId || !hydrated) return;
    restUrl();
    setActiveStackId(current);
  }, [current]);


  const restUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('group');
    url.searchParams.delete('nav');
    const newHref = url.toString();
    if (window.location.href !== newHref) {
      window.history.replaceState({ group: null }, "", newHref);
      window.history.replaceState({ navStack: null }, "", newHref);
    }
  }

  // Group context implementation
  const groupContext: GroupNavigationContextType = useMemo(() => ({
    getGroupId: () => id,

    getCurrent: () => activeStackId,

    goToGroupId: async (groupId: string) => {
      if (navStack.has(groupId)) {
        restUrl();
        setActiveStackId(groupId);
        onCurrentChange?.(groupId);
        return true;
      }
      return false;
    },

    isActiveStack: (stackId: string) => {
      return stackId === activeStackId;
    }
  }), [id, activeStackId, navStack, persist]);

  // Save group state to storage when it changes
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      writeGroupState(id, activeStackId);
    }
  }, [id, activeStackId, persist]);


  // Handle back/forward browser buttons
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;

    const handler = (e: PopStateEvent) => {
      // Small delay to ensure all stacks are ready
      setTimeout(() => {
        if (e.state && e.state.group && navStack.has(e.state.group)) {
          const newGroupId = e.state.group;
          // DELIBERATELY no restUrl() here.
          //
          // restUrl() deletes `nav` and `group` from the CURRENT entry — which, during popstate,
          // is the entry the browser has just restored. Wiping it leaves that history entry
          // describing nothing, so navigating back onto it later finds no state and falls back to
          // the stack root.
          //
          // Observed on a three-deep walk (profile → redeem_codes → giveback_page): Back onto the
          // middle entry re-derived the stack correctly and then blanked its URL —
          //   after push C   nav=profile-stack:1.a1.c1.v1
          //   back -> B      nav=null          <-- destroyed here
          // so a later Forward onto that entry restored the root instead of B, and the user saw
          // "Forward once stays on A, Forward twice jumps to C".
          //
          // Clearing the URL is only meaningful when the app SWITCHES tabs itself; on popstate the
          // browser already restored the correct URL and there is nothing to clean up.
          setActiveStackId(newGroupId);
          onCurrentChange?.(newGroupId);
        }
      }, 10);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [navStack, hydrated]);

  return (
    <GroupNavigationContext.Provider value={groupContext}>
      <div className="group-navigation-stack">
        {Array.from(navStack.entries()).map(([stackId, stackEl]) => {
          const isActive = (hydrated || (!hydrated && current === stackId)) && stackId === activeStackId;

          return (
            <div
              key={stackId}
              className={`group-stack-container ${isActive ? 'group-stack-active' : 'group-stack-hidden'}`}
              style={{
                display: isActive ? "block" : "none",
                visibility: isActive ? "visible" : "hidden"
              }}
              aria-hidden={!isActive}
              data-stack-id={stackId}
              data-active={isActive}
            >
              <GroupStackIdContext.Provider value={stackId}>
                {(isActive || preloadAll) && stackEl}
              </GroupStackIdContext.Provider>
            </div>
          );
        })}
        {/*
          Group-scoped overlays. Deliberately a SIBLING of the per-tab containers rather than a
          child of one: those containers are display:none'd on tab switch, so an overlay hosted
          inside one would vanish (or reappear in the wrong tab) when the user changes tabs.
          Rendering here is what lets a sheet opened in one tab survive a switch.
        */}
        <GroupOverlayHost groupId={id} />
      </div>
    </GroupNavigationContext.Provider>
  );
}

/**
 * Overlay controller for a GROUP scope — the layer that sits above every tab.
 *
 * Same shape as `nav.overlay` (which is stack-scoped), but addressed by group id, so the two
 * layers stay independent: a dialog belongs to a stack and travels with it, while a bottom sheet /
 * selection sheet / picker belongs to the group and outlives a tab switch.
 *
 * This package still has no idea what any of those components ARE. The caller passes a render
 * function; wiring a specific viewer to this is the app's job, per the Library Charter.
 */
export function getGroupOverlay(groupId: string) {
  return {
    insert(render: OverlayRender, opts: { id?: string; offset?: number; barrier?: boolean | string; barrierDismiss?: boolean } = {}) {
      const store = getOverlayStore(groupId);
      const oid = opts.id ?? `gov-${Math.random().toString(36).slice(2, 10)}`;
      store.entries.set(oid, {
        id: oid,
        render,
        abovePage: null, // group overlays are never bound to a page in a child stack
        offset: clampOffset(opts.offset),
        barrier: opts.barrier,
        barrierDismiss: opts.barrierDismiss,
      });
      notifyOverlays(groupId);
      return {
        id: oid,
        remove: () => { if (store.entries.delete(oid)) notifyOverlays(groupId); },
        update: (r: OverlayRender) => {
          const e = store.entries.get(oid);
          if (e) { e.render = r; notifyOverlays(groupId); }
        },
      };
    },
    remove(oid: string) {
      const store = getOverlayStore(groupId);
      if (store.entries.delete(oid)) notifyOverlays(groupId);
    },
    clear() {
      const store = getOverlayStore(groupId);
      if (store.entries.size > 0) { store.entries.clear(); notifyOverlays(groupId); }
    },
    list(): string[] {
      return Array.from(getOverlayStore(groupId).entries.keys());
    },
  };
}

function GroupOverlayHost({ groupId }: { groupId: string }) {
  const [, force] = useState(0);
  useEffect(() => subscribeOverlays(groupId, () => force((n) => n + 1)), [groupId]);

  const entries = Array.from(getOverlayStore(groupId).entries.values());
  if (entries.length === 0) return null;

  return (
    <>
      {entries.map((e) => {
        const content = typeof e.render === 'function' ? e.render() : e.render;
        return (
          <div
            key={e.id}
            data-ax-group-overlay={e.id}
            // pointerEvents:none on the wrapper so an empty/!barrier overlay never swallows taps
            // meant for the app underneath; the content re-enables it for itself.
            style={{ position: 'fixed', inset: 0, zIndex: e.offset, pointerEvents: 'none' }}
          >
            {e.barrier != null && e.barrier !== false && (
              <div
                onClick={e.barrierDismiss ? () => getGroupOverlay(groupId).remove(e.id) : undefined}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: typeof e.barrier === 'string' ? e.barrier : 'rgba(0,0,0,0.32)',
                  pointerEvents: 'auto',
                }}
              />
            )}
            <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
              {content}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ==================== Component Aggregation Utilities ====================

// ============ C1: OverlayHost ============
// Renders this stack's overlay entries above the pages, inside the stack
// container (which is position:relative). Z contract: page-bound overlays at
// bandIndex*1000+offset, stack-level at stack.length*1000+offset. v1 visibility:
// page-bound overlays show while their page is the current top; they are
// auto-removed here when their page leaves the stack.
function OverlayHost({ api, stack }: { api: NavStackAPI; stack: StackEntry[] }) {
  const [, force] = useState(0);

  useEffect(() => subscribeOverlays(api.id, () => force((n) => n + 1)), [api.id]);

  // Auto-cleanup: drop page-bound overlays whose page left the stack.
  useEffect(() => {
    const store = getOverlayStore(api.id);
    let changed = false;
    store.entries.forEach((e, k) => {
      if (e.abovePage && !stack.some((s) => s.uid === e.abovePage || s.key === e.abovePage)) {
        store.entries.delete(k);
        changed = true;
      }
    });
    if (changed) notifyOverlays(api.id);
  }, [api.id, stack]);

  const top = stack[stack.length - 1];
  const entries = Array.from(getOverlayStore(api.id).entries.values());
  if (entries.length === 0) return null;

  return (
    <>
      {entries.map((e) => {
        if (e.abovePage && !(top && (top.uid === e.abovePage || top.key === e.abovePage))) {
          return null;
        }
        const bandIndex = e.abovePage
          ? Math.max(0, stack.findIndex((s) => s.uid === e.abovePage || s.key === e.abovePage))
          : stack.length;
        const z = bandIndex * 1000 + e.offset;
        const content = typeof e.render === 'function' ? e.render() : e.render;
        return (
          <div
            key={e.id}
            data-ax-overlay={e.id}
            style={{ position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none' }}
          >
            {e.barrier != null && e.barrier !== false && (
              <div
                onClick={e.barrierDismiss ? () => api.overlay.remove(e.id) : undefined}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'auto',
                  background: typeof e.barrier === 'string' ? e.barrier : 'rgba(0,0,0,0.4)',
                }}
              />
            )}
            <div style={{ display: 'inline-block', pointerEvents: 'auto' }}>{content}</div>
          </div>
        );
      })}
    </>
  );
}

export default function NavigationStack(props: {
  id: string;
  navLink: NavigationMap;
  entry: string;
  onExitStack?: () => void;
  transition?: BuiltinTransition;
  transitionDuration?: number;
  renderTransition?: TransitionRenderer;
  className?: string;
  style?: React.CSSProperties;
  maxStackSize?: number;
  autoDispose?: boolean;
  syncHistory?: boolean;
  /**
   * Whether a `push` creates a real browser history entry (and pop/popUntil/popToRoot give those
   * entries back), so the browser's back/forward — and therefore the platform's own back gesture —
   * step through the stack. Defaults to `true`.
   *
   * Only takes effect when `syncHistory` is enabled; without URL sync there is nothing meaningful
   * to push. Set to `false` to keep the older behaviour where every navigation merely *replaces*
   * the current entry (in which case Back leaves the site rather than popping a page).
   */
  historyPush?: boolean;
  lazyComponents?: Record<string, () => LazyComponent>;
  missingRouteConfig?: MissingRouteConfig;
  persist?: boolean;
  enableScrollRestoration?: boolean;
  /**
   * Additional navLinks to merge with the primary navLink
   * Useful for component aggregation from multiple sources
   * Lower priority than main navLink - will be overridden if keys conflict
   */
  additionalNavLinks?: NavigationMap[];
  /**
   * Tag-based component registry for organizing components
   * Maps tag names to collections of navigation links
   * Allows retrieving related components by tag
   */
  componentTags?: Record<string, NavigationMap>;
  swipeBack?: boolean | SwipeBackOptions;
  /**
   * C2 — go_router-style stack-level redirect. Runs before guards on
   * push/replace/go (and deep links). Return a target to redirect, null to allow.
   */
  redirect?: RedirectFn;
  /**
   * C2 — per-route options. `routeOptions[key].redirect` runs only when
   * navigating to that key. NavigationMap itself stays untouched.
   */
  routeOptions?: Record<string, { redirect?: RedirectFn }>;
}) {
  const {
    id,
    navLink,
    entry,
    onExitStack,
    transition = "fade",
    transitionDuration = DEFAULT_TRANSITION_DURATION,
    renderTransition,
    className,
    style,
    maxStackSize,
    autoDispose = true,
    syncHistory = false,
    historyPush = true,
    lazyComponents,
    missingRouteConfig,
    persist = false,
    enableScrollRestoration = true,
    additionalNavLinks = [],
    componentTags = {},
    swipeBack = true,
    redirect,
    routeOptions,
  } = props;

  // Memoize additional navlinks to prevent unnecessary recalculations
  const additionalNavLinksString = useMemo(() => JSON.stringify(additionalNavLinks), [additionalNavLinks]);
  const componentTagsString = useMemo(() => JSON.stringify(componentTags), [componentTags]);

  // Merge navLinks with additionalNavLinks and componentTags
  // Primary navLink takes precedence, then additionalNavLinks, then componentTags
  const mergedNavLink = useMemo(() => {
    const merged = { ...navLink };

    // Apply additional navLinks in order (later ones override earlier)
    for (const additionalMap of additionalNavLinks) {
      Object.entries(additionalMap).forEach(([key, value]) => {
        // Only add if not already in primary navLink
        if (!(key in navLink)) {
          merged[key] = value;
        }
      });
    }

    // Apply tagged components (only if not already defined)
    for (const tagMap of Object.values(componentTags)) {
      Object.entries(tagMap).forEach(([key, value]) => {
        // Only add if not already defined
        if (!(key in navLink) && !(key in merged)) {
          merged[key] = value;
        }
      });
    }

    return merged;
  }, [navLink, additionalNavLinksString, componentTagsString]);

  // Auto-detect parent navigation context
  const parentApi = findParentNavContext();
  const groupContext = useGroupNavigation();
  const groupStackId = useGroupStackId();

  const [isInitialized, setInitialized] = useState(false);
  const [stackSnapshot, setStackSnapshot] = useState<StackEntry[]>([]);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const currentPathRef = useRef(
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    currentPathRef.current = window.location.pathname;
  }, []);

  const api = useMemo(() => {
    const registry = getRegistry();
    const newApi = createApiFor(id, mergedNavLink, syncHistory || false, parentApi, currentPathRef.current, groupContext, groupStackId, historyPush);

    if (parentApi) {
      const parentReg = registry.get(parentApi.id);
      if (parentReg) {
        parentReg.childIds.add(id);
      }
    }

    return newApi;
  }, [id, mergedNavLink, syncHistory, historyPush, parentApi, groupContext]);

  // C2: register the stack-level redirect + per-route redirects on the api.
  useEffect(() => {
    const disposers: Array<() => void> = [];
    if (redirect) disposers.push(api.addRedirect(redirect));
    if (routeOptions) {
      for (const [routeKey, opts] of Object.entries(routeOptions)) {
        const routeRedirect = opts?.redirect;
        if (routeRedirect) {
          disposers.push(
            api.addRedirect((ctx) => (ctx.to.key === routeKey ? routeRedirect(ctx) : null))
          );
        }
      }
    }
    return () => { disposers.forEach((d) => d()); };
  }, [api, redirect, routeOptions]);

  // Trigger onCreate lifecycle when API is created
  useEffect(() => {
    const lifecycleManager = api._getLifecycleManager();
    lifecycleManager.trigger('onCreate', {
      stack: api.getStack(),
      current: api.peek()
    });
  }, [api]);

  // App state tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const regEntry = getRegistry().get(id);
    if (!regEntry) return;

    const lifecycleManager = api._getLifecycleManager();

    // Enable app state tracking
    const getCurrentContext = () => ({
      stack: regEntry.stack.slice(),
      current: regEntry.stack[regEntry.stack.length - 1]
    });

    const cleanupAppState = lifecycleManager.enableAppStateTracking(getCurrentContext);

    return cleanupAppState;
  }, [api, id]);

  // Update the registry with the current path reference
  useEffect(() => {
    const regEntry = getRegistry().get(id);
    if (regEntry) {
      regEntry.currentPath = currentPathRef.current;
    }
  }, [id]);

  useIsomorphicLayoutEffect(() => {
    const registry = getRegistry();
    let regEntry = registry.get(id);
    if (!regEntry) {
      regEntry = {
        stack: [],
        listeners: new Set(),
        guards: new Set(),
        middlewares: new Set(),
        maxStackSize: DEFAULT_MAX_STACK_SIZE,
        historySyncEnabled: false,
        snapshotBuffer: [],
        parentId: parentApi?.id || null,
        childIds: new Set(),
        navLink,
        lifecycleHandlers: new Map(),
        currentState: 'active',
        lastActiveEntry: undefined,
      };
      registry.set(id, regEntry);
    } else {
      regEntry.navLink = navLink;
      regEntry.parentId = parentApi?.id || null;
    }


    // First priority: Parse from URL
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const navPathCombined = searchParams.get('nav');

      if (navPathCombined) {
        const map = parseCombinedNavParam(navPathCombined);
        const ourPath = map[id];
        if (ourPath) {
          const tokenizedStacks = parseUrlPathIntoStacks(ourPath);

          const ourTokens = tokenizedStacks[0] || [];

          if (ourTokens.length > 0) {
            regEntry.stack = ourTokens.map(t => {
              const resolvedKey = decodeStackPath(navLink, t.code) || (t.code.startsWith('k:') ? (() => {
                try { return decodeURIComponent(t.code.slice(2)); } catch { return t.code.slice(2); }
              })() : t.code);
              return {
                uid: generateCompositeUid(id, groupContext, groupStackId, resolvedKey, t.params),
                key: resolvedKey,
                params: t.params
              } as StackEntry;
            });
            setStackSnapshot([...regEntry.stack]);
            setInitialized(true);
            return;
          }
        }
      }
    }

    // Second priority: Fall back to persisted storage
    if (persist) {
      const persisted = readPersistedStack(id, groupContext, groupStackId);
      if (persisted && persisted.length > 0) {
        regEntry.stack = persisted;
        setStackSnapshot([...persisted]);
        setInitialized(true);
        return;
      }
    }

    // Final fallback: Use initial entry
    const { key, params } = parseRawKey(entry);
    if (!navLink[key]) {
      console.error(`Entry route "${key}" not found in navLink`);
      return;
    }
    regEntry.stack = [{
      uid: generateCompositeUid(id, groupContext, groupStackId, key, params),
      key,
      params
    }];
    setStackSnapshot([...regEntry.stack]);
    if (persist) writePersistedStack(id, regEntry.stack);
    setInitialized(true);
  }, [id, entry, navLink, groupContext, groupStackId]);


  useEffect(() => {
    const currentRegEntry = getRegistry().get(id);
    if (!currentRegEntry || !groupContext || !groupStackId) return;
    const active = groupContext.isActiveStack(groupStackId);
    if ((syncHistory || currentRegEntry.historySyncEnabled) && active) {
      const localPath = buildUrlPath([{ navLink, stack: currentRegEntry.stack }]);
      updateNavQueryParamForStack(id, localPath, groupContext, groupStackId);
    } else if (!(syncHistory || currentRegEntry.historySyncEnabled)) {
      removeNavQueryParamForStack(id, groupContext, groupStackId)
    }
  }, [id, navLink, syncHistory, groupContext?.getCurrent]);

  useEffect(() => {
    const unsub = api.subscribe((stack) => {
      setStackSnapshot(stack);
      if (persist) writePersistedStack(id, stack);
    });
    return unsub;
  }, [api, persist, id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      const currentRegEntry = getRegistry().get(id);
      if (!currentRegEntry) return;

      if (!api.isActiveStack()) return;

      // The browser has already moved. Mark the re-derive so emit() does not ALSO hand history
      // entries back for the resulting pop — that would consume a second entry and skip a page.
      currentRegEntry.popstateInFlight = true;
      try {
        handlePopStateInner(currentRegEntry);
      } finally {
        currentRegEntry.popstateInFlight = false;
      }
    };

    const handlePopStateInner = (currentRegEntry: RegistryEntry) => {

      // Restoring the stack to its ROOT when the URL carries no state for it is the whole point of
      // these two cases, and returning early here was why browser Back appeared to do nothing.
      //
      // The very first history entry has no `?nav=` at all: the param is only written once
      // something has been pushed. So going Back to it lands on a URL with no nav state, and
      // treating that as "leave the stack alone" left the pushed page on top forever — the URL
      // went back while the stack did not.
      //
      // Truncating to the existing first entry (rather than re-resolving the `entry` prop) keeps
      // the root's uid and params exactly as they were, so nothing re-mounts unnecessarily.
      const restoreToRoot = () => {
        const rootStack = currentRegEntry.stack.slice(0, 1);
        if (!isEqual(currentRegEntry.stack, rootStack)) {
          currentRegEntry.stack = rootStack;
          setStackSnapshot([...rootStack]);
          if (persist) writePersistedStack(id, rootStack);
        }
      };

      const searchParams = new URLSearchParams(window.location.search);
      const navPathCombined = searchParams.get('nav');
      if (!navPathCombined) { restoreToRoot(); return; }

      const map = parseCombinedNavParam(navPathCombined);
      const ourPath = map[id];
      if (!ourPath) { restoreToRoot(); return; }

      const tokenized = parseUrlPathIntoStacks(ourPath);
      const ourSlice = tokenized[0] || [];

      const newStack = ourSlice.map(t => {
        const resolvedKey = decodeStackPath(navLink, t.code) || (t.code.startsWith('k:') ? (() => {
          try { return decodeURIComponent(t.code.slice(2)); } catch { return t.code.slice(2); }
        })() : t.code);
        return {
          uid: generateCompositeUid(id, groupContext, groupStackId, resolvedKey, t.params),
          key: resolvedKey,
          params: t.params,
        };
      });

      if (!isEqual(currentRegEntry.stack, newStack)) {
        currentRegEntry.stack = newStack;
        setStackSnapshot([...newStack]);
        if (persist) writePersistedStack(id, newStack);
      }
    };

    if (syncHistory) {
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      if (syncHistory) {
        window.removeEventListener('popstate', handlePopState);
      }
      if (autoDispose && !groupContext) api.dispose();
    };
  }, [id, navLink, syncHistory, autoDispose, api, persist, groupContext]);

  const lastLen = useRef(stackSnapshot.length);

  useEffect(() => {
    const handleStackEmpty = () => {
      if (onExitStack) {
        try {
          onExitStack();
          return;
        } catch (e) {
          console.warn('onExit error:', e);
        }
      }

      if (parentApi) {
        parentApi.pop().catch(() => {
          if (typeof window !== "undefined" && window.history.length > 0) {
            window.history.back();
          }
        });
        return;
      }

      if (typeof window !== "undefined" && window.history.length > 0) {
        window.history.back();
      }
    };

    const unsub = api.subscribe((stack) => {
      setStackSnapshot(stack);

      if (lastLen.current > 0 && stack.length === 0) {
        if (!groupContext) handleStackEmpty();
      }
      lastLen.current = stack.length;
    });

    return unsub;
  }, [api, onExitStack, parentApi]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "navstack-builtins";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      .navstack-root {  display: block; width: 100%; height: auto; overflow: hidden;}
      .navstack-page {  display: block; width: 100%; height: auto; overflow: visible; }
      .navstack-page[inert] {  pointer-events: none; display: none !important;}
      .nav-fade-enter { opacity: 0; transform: translateY(6px); }
      .nav-fade-enter-active { opacity: 1; transform: translateY(0); transition: opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease; }
      .nav-fade-exit { opacity: 1; transform: translateY(0); }
      .nav-fade-exit-active { opacity: 0; transform: translateY(6px); transition: opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease; }
      .nav-slide-enter { opacity: 0; transform: translateX(8%); }
      .nav-slide-enter-active { opacity: 1; transform: translateX(0); transition: transform ${transitionDuration}ms ease, opacity ${transitionDuration}ms ease; }
      .nav-slide-exit { opacity: 1; transform: translateX(0); }
      .nav-slide-exit-active { opacity: 0; transform: translateX(8%); transition: transform ${transitionDuration}ms ease, opacity ${transitionDuration}ms ease; }
      .navstack-missing-route { padding: 1rem; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.25rem; display: flex; flex-direction: column}
      .navstack-missing-route-button { margin-top: 0.5rem; padding: 0.375rem 0.75rem; background-color: #0d6efd; color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
      .navstack-missing-route-button:hover { background-color: #0b5ed7; }
    `;
  }, [transitionDuration]);

  const [renders, setRenders] = useState<RenderRecord[]>(
    () => stackSnapshot.map((e) => ({ entry: e, state: "idle", createdAt: Date.now() }))
  );

    useLayoutEffect(() => {
      const topEntry = stackSnapshot[stackSnapshot.length - 1];
      if (topEntry) {
        _currentPageUidByStack.set(id, topEntry.uid);
      } else {
        _currentPageUidByStack.delete(id);
      }

      return () => {
        _currentPageUidByStack.delete(id);
      };
    }, [id, stackSnapshot]);

  const transitionManager = useRef<TransitionManager>(new TransitionManager()).current;
  const memoryManager = useRef<PageMemoryManager>(new PageMemoryManager()).current;
  const swipeBackOptions = typeof swipeBack === 'object'
    ? swipeBack
    : { disabled: swipeBack === false };

  useUnifiedScrollRestoration(api, renders, stackSnapshot, groupContext, groupStackId, enableScrollRestoration);
  useSwipeBack(swipeContainerRef, api, swipeBackOptions);


  useEffect(() => {
    const handleTransitionEnd = (uid: string) => {
      setRenders(prev => prev.filter(r => r.entry.uid !== uid));
      memoryManager.delete(uid);
    };

    const old = renders.map((r) => r.entry.uid);
    const cur = stackSnapshot.map((s) => s.uid);

    const added = stackSnapshot.filter((s) => !old.includes(s.uid));
    const removed = renders.filter((r) => !cur.includes(r.entry.uid)).map((r) => r.entry.uid);

    if (added.length === 0 && removed.length === 0) {
      if (stackSnapshot.length > 0 && renders.length > 0) {
        const topSnap = stackSnapshot[stackSnapshot.length - 1];
        const topRender = renders[renders.length - 1];
        if (topRender && topSnap.uid !== topRender.entry.uid) {
          const newRenders = renders.slice(0, -1)
            .concat([{ entry: topRender.entry, state: "exit", createdAt: Date.now() }, { entry: topSnap, state: "enter", createdAt: Date.now() }]);
          setRenders(newRenders);
          transitionManager.start(topRender.entry.uid, transitionDuration, () => { });
          transitionManager.start(topSnap.uid, transitionDuration, () => { });
        }
      }
      return;
    }

    if (added.length > 0) {
      const newRecords = added.map((a) => ({ entry: a, state: "enter" as const, createdAt: Date.now() }));
      setRenders((prev) => prev.concat(newRecords));
      added.forEach(a => transitionManager.start(a.uid, transitionDuration, () => { }));
    }

    if (removed.length > 0) {
      setRenders((prev) => prev.map((r) => removed.includes(r.entry.uid) ? { ...r, state: "exit", createdAt: Date.now() } : r));
      removed.forEach(uid => transitionManager.start(uid, transitionDuration, () => handleTransitionEnd(uid)));
    }
  }, [stackSnapshot, transitionDuration, transitionManager, memoryManager]);

  function renderEntry(rec: RenderRecord, idx: number) {
    const topEntry = stackSnapshot[stackSnapshot.length - 1];
    const isTop = topEntry ? rec.entry.uid === topEntry.uid : false;
    const pageOrComp = mergedNavLink[rec.entry.key];

    // 🔥 CRITICAL: Always get the FRESH entry from current stack
    const currentEntry = stackSnapshot.find(s => s.uid === rec.entry.uid) || rec.entry;
    const currentParams = currentEntry.params ?? {};

    // 🔥 Check if params changed since last render
    const cached = memoryManager.get(rec.entry.uid);
    const cachedMeta = memoryManager.getMeta(rec.entry.uid);
    const hasParamChanges = cached && cachedMeta
      ? JSON.stringify(currentParams) !== JSON.stringify(cachedMeta.params)
      : false;

    let child: ReactNode = null;

    // 🔥 ONLY use cache if NO parameter changes
    if (cached && !hasParamChanges) {
      child = cached;
    } else {
      // 🔥 ALWAYS create fresh component when params changed or no cache
      if (!pageOrComp) {
        child = (
          <MissingRoute
            entry={currentEntry}
            isTop={isTop}
            api={api}
            config={missingRouteConfig}
          />
        );
      } else if (typeof pageOrComp === 'function') {
        if (currentEntry.metadata?.lazy) {
          child = <LazyRouteLoader lazyComponent={currentEntry.metadata.lazy} />;
        } else if (lazyComponents?.[currentEntry.key]) {
          child = <LazyRouteLoader lazyComponent={lazyComponents[currentEntry.key]} />;
        } else {
          const Component = pageOrComp as ComponentType<any>;
          // 🔥 ALWAYS use currentParams (fresh from stack)
          child = <Component {...currentParams} />;
        }
      }

      // 🔥 ONLY cache if no parameter changes
      if (child && !hasParamChanges) {
        memoryManager.set(rec.entry.uid, child);
      } else if (hasParamChanges) {
        // 🔥 Remove stale cache when params change
        memoryManager.delete(rec.entry.uid);
      }
    }

    const builtInRenderer: TransitionRenderer = ({ children, state: s, isTop: t, index }) => {
      const baseClass = "navstack-page";
      const uid = currentEntry.uid;

      if (transition === "slide" && index > 0) {
        return (
          <SlideTransitionRenderer state={s} isTop={t} uid={uid} baseClass={baseClass}>
            {children}
          </SlideTransitionRenderer>
        );
      }

      if (transition === "fade" && index > 0) {
        return (
          <FadeTransitionRenderer state={s} isTop={t} uid={uid} baseClass={baseClass}>
            {children}
          </FadeTransitionRenderer>
        );
      }

      return (
        <NavPageShell uid={uid} isTop={t}>
          {children}
        </NavPageShell>
      );
    };

    const renderer = renderTransition ?? builtInRenderer;
    return (
      <CurrentPageContext.Provider value={currentEntry.uid}>
        {renderer({
          children: (
            <CurrentPageContext.Provider value={currentEntry.uid}>
              {child}
            </CurrentPageContext.Provider>
          ),
          state: rec.state,
          index: idx,
          isTop
        })}
      </CurrentPageContext.Provider>
    );
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <NavContext.Provider value={api}>
      <div
        ref={swipeContainerRef}
        className={`navstack-root ${className ?? ""}`}
        style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}
      >
        {renders.map((r, idx) => (
          <React.Fragment key={r.entry.uid}>
            {renderEntry(r, idx)}
          </React.Fragment>
        ))}
        <OverlayHost api={api} stack={stackSnapshot} />
      </div>
    </NavContext.Provider>
  );
}

// Dev-only HMR cleanup. Guarded so it is inert in a bundled/published library
// (no bundler `module.hot` shim present) and never touches Node's `module`.
{
  const hotModule = (globalThis as { module?: { hot?: { dispose: (cb: () => void) => void } } }).module;
  if (hotModule?.hot) {
    hotModule.hot.dispose(() => {
      getRegistry().forEach((_, id) => {
        const api = createApiFor(id, {}, false, null, '', null, null);
        api.dispose();
      });
    });
  }
}
