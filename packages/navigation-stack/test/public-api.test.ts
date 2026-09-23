/**
 * THE PUBLIC SURFACE, WRITTEN DOWN.
 *
 * Every name below is something an app outside this repo may already import. Removing or renaming
 * one is a breaking change whether or not anybody meant it to be, and nothing else in this suite
 * would notice: the other tests import what they need from `../src/core/*`, so a name could vanish
 * from the barrel with all 168 of them still green.
 *
 * This exists to make the barrel a DECISION rather than a side effect. A deliberate addition is one
 * line here and a minor release. A deletion that is really deliberate is a line removed here and a
 * major one. Anything else failing this test is a refactor that leaked.
 *
 * It is deliberately dumb — a sorted list compared to a sorted list — because a clever version
 * would re-derive the surface from the same file it is meant to be checking.
 */
import { describe, it, expect } from 'vitest';
import * as api from '../src/index';
import * as playwrightApi from '../src/playwright';
import * as devtoolsApi from '../src/devtools-ui';
import * as testingApi from '../src/testing';

/** Values, components and hooks: importable at runtime. `default` is `NavigationStack`. */
const PUBLIC_EXPORTS = [
  // The stack itself
  'default',
  'NavigationStack',
  'GroupNavigationStack',
  'NavigationErrorBoundary',
  'getGroupOverlay',
  'useIsActiveStack',
  'popStackToRoot',

  // Navigating, and knowing where you are
  'useNav',
  'useNavOptional',
  'useLocation',
  'useIsTop',
  'usePageLifecycle',
  'usePageState',
  'usePageSpecificLifecycle',
  'aggregateNavigationMaps',
  'createTaggedNavigation',
  'getComponentsByTag',
  'getAvailableTags',
  'useComponentsByTag',

  // Records travelling between pages (never in a push)
  'useProvideObject',
  'useObject',
  'useObjectWithFallback',
  'useObjectExists',
  'useObjectSync',
  'createObjectGetter',
  'createReactiveObjectGetter',
  'createObjectTypeGuard',
  'useProvideRequestHandler',
  'useSendRequest',
  'useDebugObjects',

  // Scroll: restoration, paging, pull-to-refresh
  'scrollBroadcaster',
  'useScrollBroadcast',
  'useUnifiedScrollRestoration',
  'useScrollEvents',
  'useInfiniteScroll',
  'useInfiniteScrollObserver',
  'usePullToRefresh',
  'scrollIntoViewBelow',
  'useScrollIntoViewBelow',

  // Gestures
  'useSwipeBack',
  'hasNativeBackGesture',

  // A keyboard-safe shell
  'ColumnBody',
  'RowBody',
  'Scaffold',
  'useViewportInsets',
  'ViewportInsetsProvider',
  'useResizeToAvoidKeyboard',

  // Overlays that own a history entry
  'useOverlayRoute',
  'useOverlayEntry',
  'OVERLAY_FRAGMENT_KEY',
  'parseFragment',
  'buildFragment',
  'setInFragment',
  'readOverlayFragment',
  'writeOverlayFragment',
  'closeUnrestoredOverlay',
  'settleOverlayFragment',
  'resetOverlaySettle',
  'claimOverlay',
  'releaseOverlay',
  'isOverlayClaimed',
  'overlayClaims',
  'resetOverlayClaims',
  'registerOverlayFactory',
  'getOverlayFactory',
  'clearOverlayFactories',
  'serializeOverlays',
  'parseOverlays',
  'descriptorId',

  // Ledger health, devtools, and the environment guards apps use around them
  'getPopHealth',
  'resetNavigationLedgers',
  'navDevtools',
  'installNavDevtools',
  'devtoolsEnabled',
  'NavigationDevtools',
  'isBrowser',
  'safeWindow',
].sort();

/** The inspector entry point, `@academix-admin/navigation-stack/devtools`. */
const DEVTOOLS_EXPORTS = ['NavigationDevtools', 'default'].sort();

/** The unit-test entry point, `@academix-admin/navigation-stack/testing`. */
const TESTING_EXPORTS = ['renderInStack', 'forgetStack'].sort();

/** The Playwright entry point, `@academix-admin/navigation-stack/playwright`. */
const PLAYWRIGHT_EXPORTS = ['installNavDevtools', 'navStack', 'navStackIds'].sort();

/** Names each side has that the other does not — a far more useful failure than "not equal". */
const drift = (actual: string[], expected: string[]) => ({
  added: actual.filter((n) => !expected.includes(n)),
  removed: expected.filter((n) => !actual.includes(n)),
});

/*
 * THE TYPES, which vanish before the assertions above ever run.
 *
 * A type is as public as a function: an app writing `const opts: UseInfiniteScrollOptions = {...}`
 * stops compiling if it is renamed. Nothing here executes — the guard is that this file is in
 * `tsconfig.test.json`, so `npm run typecheck:test` fails on a name that no longer exists.
 */
import type {
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
  RouteKeys,
  UseScrollEventsHandlers,
  UseScrollEventsOptions,
  UseInfiniteScrollOptions,
  UseInfiniteScrollObserverOptions,
  UsePullToRefreshOptions,
  PullToRefreshState,
  ScrollIntoViewOptions,
  ScrollIntoViewResult,
  AppBarBehavior,
  BodyProps,
  ScaffoldProps,
  ResizeToAvoidKeyboardOptions,
  ParsedFragment,
  OverlayDescriptor,
  OverlayFactory,
  OverlayParams,
  NavEvent,
  NavSnapshot,
  NavEntrySnapshot,
  NavigationDevtoolsProps,
} from '../src/index';

/** Naming each one is the assertion: a type that is gone cannot be named. */
type PublicTypes = [
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
  RouteKeys<Record<string, never>>,
  UseScrollEventsHandlers,
  UseScrollEventsOptions,
  UseInfiniteScrollOptions,
  UseInfiniteScrollObserverOptions,
  UsePullToRefreshOptions,
  PullToRefreshState,
  ScrollIntoViewOptions,
  ScrollIntoViewResult,
  AppBarBehavior,
  BodyProps,
  ScaffoldProps,
  ResizeToAvoidKeyboardOptions,
  ParsedFragment,
  OverlayDescriptor,
  OverlayFactory,
  OverlayParams,
  NavEvent,
  NavSnapshot,
  NavEntrySnapshot,
  NavigationDevtoolsProps,
];

/*
 * How many there are, so that DELETING a name from the list above is a failure too. Without this
 * the tuple only catches renames: a removed line takes its own assertion with it.
 */
const PUBLIC_TYPE_COUNT = 33;

describe('the public API', () => {
  it('exports exactly what is written down here', () => {
    const actual = Object.keys(api).sort();
    expect(drift(actual, PUBLIC_EXPORTS)).toEqual({ added: [], removed: [] });
    expect(actual).toEqual(PUBLIC_EXPORTS);
  });

  it('exports exactly what is written down for /playwright', () => {
    const actual = Object.keys(playwrightApi).sort();
    expect(drift(actual, PLAYWRIGHT_EXPORTS)).toEqual({ added: [], removed: [] });
    expect(actual).toEqual(PLAYWRIGHT_EXPORTS);
  });

  it('exports exactly what is written down for /devtools', () => {
    // Its own entry so an app that never opens the inspector need not carry its UI. The barrel
    // still re-exports it, which is why the main bundle has not shrunk yet — see the CHANGELOG.
    const actual = Object.keys(devtoolsApi).sort();
    expect(drift(actual, DEVTOOLS_EXPORTS)).toEqual({ added: [], removed: [] });
  });

  it('exports exactly what is written down for /testing', () => {
    const actual = Object.keys(testingApi).sort();
    expect(drift(actual, TESTING_EXPORTS)).toEqual({ added: [], removed: [] });
  });

  it('ships the stack as both a default and a name, and they are the same thing', () => {
    expect(api.default).toBe(api.NavigationStack);
  });

  it('still publishes every type that is written down', () => {
    // `PublicTypes` is erased, so what is checked at runtime is that nobody quietly shortened the
    // list; the names themselves are checked by `npm run typecheck:test`.
    const declared: PublicTypes['length'] = PUBLIC_TYPE_COUNT;
    expect(declared).toBe(PUBLIC_TYPE_COUNT);
  });
});
