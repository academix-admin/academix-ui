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
} from './scroll';
export type {
  UseScrollEventsHandlers,
  UseScrollEventsOptions,
  UseInfiniteScrollOptions,
  UseInfiniteScrollObserverOptions,
  UsePullToRefreshOptions,
  PullToRefreshState,
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
export type { BodyProps, ScaffoldProps } from './bodies';

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
} from './overlay/hash';
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
