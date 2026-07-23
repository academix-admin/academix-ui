// Public API barrel for @academix-admin/navigation-stack.
// Implementation is split across ./types, ./constants, ./scroll, ./gestures,
// ./di, ./core/* , ./hooks and ./components. The original single-file
// implementation is preserved (reference only) at ./_legacy/NavigationStack.legacy.tsx.

export type {
  ScrollBroadcastEvent,
  SwipeBackOptions,
  NavActionResult,
  NavLocation,
  StackEntry,
  NavStackAPI,
} from './types';

export { scrollBroadcaster, useScrollBroadcast, useUnifiedScrollRestoration } from './scroll';
export { useSwipeBack } from './gestures/swipe-back';

export {
  isBrowser,
  safeWindow,
  useNav,
  useLocation,
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

export { NavigationErrorBoundary, GroupNavigationStack } from './components';
export { default, default as NavigationStack } from './components';
