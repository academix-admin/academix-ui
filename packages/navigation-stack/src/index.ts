// Public API barrel for @academix-admin/navigation-stack.
// Implementation is split across ./types, ./constants, ./scroll, ./gestures,
// ./di, ./core/* , ./hooks and ./components. The original single-file
// implementation is preserved (reference only) at ./_legacy/NavigationStack.legacy.tsx.

export type {
  ScrollBroadcastEvent,
  SwipeBackOptions,
  NavActionResult,
  NavLocation,
  RedirectFn,
  RedirectTarget,
  OverlayRender,
  OverlayOptions,
  OverlayHandle,
  NavOverlayAPI,
  StackEntry,
  NavStackAPI,
} from './types';

export {
  scrollBroadcaster,
  useScrollBroadcast,
  useUnifiedScrollRestoration,
  useScrollEvents,
  useInfiniteScroll,
  useInfiniteScrollObserver,
  usePullToRefresh,
  scrollIntoViewBelow,
  useScrollIntoViewBelow,
} from './scroll';
export type {
  UseScrollEventsHandlers,
  UseScrollEventsOptions,
  UseInfiniteScrollOptions,
  UseInfiniteScrollObserverOptions,
  UsePullToRefreshOptions,
  PullToRefreshState,
  ScrollIntoViewOptions,
  ScrollIntoViewResult,
} from './scroll';
export { useSwipeBack } from './gestures/swipe-back';

export {
  isBrowser,
  safeWindow,
  useNav,
  useLocation,
  useOverlayEntry,
  useIsTop,
  useDebugObjects,
  usePageLifecycle,
  usePageState,
  usePageSpecificLifecycle,
  useProvideObject,
  useObject,
  useProvideRequestHandler,
  useSendRequest,
  useObjectWithFallback,
  useObjectExists,
  useObjectSync,
  createObjectGetter,
  createReactiveObjectGetter,
  createObjectTypeGuard,
  aggregateNavigationMaps,
  getComponentsByTag,
  getAvailableTags,
  createTaggedNavigation,
  useComponentsByTag,
} from './hooks';

export { NavigationErrorBoundary, GroupNavigationStack, getGroupOverlay } from './components';
export { default, default as NavigationStack } from './components';

// Imperative helper to pop a stack (by id) to its root from outside the React tree — used by
// NavigationBar for the "re-tap the active tab to return to its root" gesture.
export { popStackToRoot } from './core/registry';

// Keyboard-safe page layout primitives (Flutter-style). Opt-in + non-breaking:
// pages that don't use these render exactly as before.
export { ColumnBody, RowBody, Scaffold } from './bodies';
export type { AppBarBehavior, BodyProps, ScaffoldProps } from './bodies';

// Keyboard / viewport-inset primitives for a keyboard-safe app shell.
export { useViewportInsets, ViewportInsetsProvider, useResizeToAvoidKeyboard } from './keyboard';
export type { ResizeToAvoidKeyboardOptions } from './keyboard';

// Overlay URL state (step 3) and reconstructible named overlays (step 4).
export {
  OVERLAY_FRAGMENT_KEY,
  parseFragment,
  buildFragment,
  setInFragment,
  readOverlayFragment,
  writeOverlayFragment,
  closeUnrestoredOverlay,
  settleOverlayFragment,
  resetOverlaySettle,
  claimOverlay,
  releaseOverlay,
  isOverlayClaimed,
  overlayClaims,
  resetOverlayClaims,
  /**
   * Give any overlay its own history entry, so the platform's Back closes the SHEET rather than the
   * page under it. Re-exported from `@academix-admin/overlay-route`, which is where it lives so
   * that an app wanting a back-closable sheet does not have to take a router with it. Importing it
   * from here also registers this library's ledger behind it, so the overlay's entry is counted by
   * every pop.
   */
  useOverlayRoute,
} from './overlay/hash';
export {
  /** Ledger health and teardown, for devtools and tests. */
  getPopHealth,
  resetNavigationLedgers,
} from './core/persistence';
export type { ParsedFragment } from './overlay/hash';
export {
  registerOverlayFactory,
  getOverlayFactory,
  clearOverlayFactories,
  serializeOverlays,
  parseOverlays,
  descriptorId,
} from './overlay/named';
export type { OverlayDescriptor, OverlayFactory, OverlayParams } from './overlay/named';
export { hasNativeBackGesture } from './gestures/swipe-back';

// Dev-only inspector on window.__NAV_STACK__ (mirrors state-stack's __STATE_STACK__).
// Installed at import time so it is present before any app code runs -- Playwright's
// addInitScript can set window.__NAV_STACK_DEVTOOLS__ = true to force it on in a prod build.
/**
 * Overlay routing: a sheet gets a history entry, so the platform's Back closes the SHEET rather
 * than the page under it. Works with any overlay, whoever drew it.
 */
export { navDevtools, installNavDevtools, devtoolsEnabled } from './devtools';
export type { NavEvent, NavSnapshot, NavEntrySnapshot } from './devtools';
export { NavigationDevtools } from './devtools-ui';
export type { NavigationDevtoolsProps } from './devtools-ui';
import { installNavDevtools as _installNavDevtools } from './devtools';
_installNavDevtools();

// Opt-in compile-time route-key safety: useNav<RouteKeys<typeof routes>>()
export type { RouteKeys } from './types';
