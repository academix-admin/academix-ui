import type { EnhancedLifecycleManager } from './core/managers';
// Shared type definitions for @academix/navigation-stack.
import type { ComponentType, ReactNode, ReactElement } from 'react';

export type ScrollBroadcastEvent = {
  uid: string;
  pageKey: string;
  position: number;
  scrollPosition: number;
  scrollPercentage: number;
  container: HTMLElement | 'window';
  clientHeight: number;
  scrollHeight: number;
  timestamp: number;
};

export type ScrollListener = (event: ScrollBroadcastEvent) => void;

export type SwipeBackOptions = {
  edgeWidth?: number;
  threshold?: number;
  maxTranslate?: number | string;
  cancelDuration?: number;
  commitDuration?: number;
  disabled?: boolean;
};

// ==================== Types ====================
export type NavParams = Record<string, any> | undefined;
export type LazyComponent = Promise<{ default: ComponentType<any> }>;
export type TransitionState = "enter" | "idle" | "exit" | "done";
export type ParsedStack = { code: string; params?: NavParams }[];
export type NavActionResult =
  | { ok: true }
  | { ok: false; reason: 'guard' | 'lock' | 'empty-stack' | 'parent-only' };

export type StackEntry = {
  // uid format: "groupId:stackId:pageUid" (composite key for scroll restoration)
  uid: string;
  key: string;
  params?: NavParams;
  metadata?: {
    title?: string;
    icon?: ReactNode;
    breadcrumb?: string;
    lazy?: () => LazyComponent;
  };
};

export type StackChangeListener = (stack: StackEntry[]) => void;
export type RenderRecord = {
  entry: StackEntry;
  state: TransitionState;
  createdAt: number;
};

export type MissingRouteConfig = {
  className?: string;
  containerClassName?: string;
  textClassName?: string;
  buttonClassName?: string;
  labels?: {
    missingRoute?: string;
    goBack?: string;
    goToRoot?: string;
  };
};

export type NavStackAPI = {
  id: string;
  push: (rawKey: string, params?: NavParams, metadata?: StackEntry['metadata']) => Promise<boolean | NavActionResult>;
  replace: (rawKey: string, params?: NavParams, metadata?: StackEntry['metadata']) => Promise<boolean | NavActionResult>;
  pop: () => Promise<boolean | NavActionResult>;
  popUntil: (predicate: (entry: StackEntry, idx: number, stack: StackEntry[]) => boolean) => Promise<boolean | NavActionResult>;
  popToRoot: () => Promise<boolean | NavActionResult>;
  pushAndPopUntil: (rawKey: string, predicate: (entry: StackEntry, idx: number, stack: StackEntry[]) => boolean, params?: NavParams, metadata?: StackEntry['metadata']) => Promise<boolean | NavActionResult>;
  pushAndReplace: (rawKey: string, params?: NavParams, metadata?: StackEntry['metadata']) => Promise<boolean | NavActionResult>;
  peek: () => StackEntry | undefined;
  go: (rawKey: string, params?: NavParams, metadata?: StackEntry['metadata']) => Promise<boolean | NavActionResult>;
  replaceParam: (params: NavParams, merge?: boolean) => Promise<boolean | NavActionResult>;

  provideObject: <T>(
    key: string,
    getter: () => T,
    options?: ObjectOptions
  ) => () => void;

  getObject: <T>(
    key: string,
    options?: ObjectOptions
  ) => T | undefined;

  hasObject: (
    key: string,
    options?: ObjectOptions
  ) => boolean;

  removeObject: (key: string) => void;
  clearObjects: () => void;
  listObjects: () => string[];

  // Subscribe to object provision events
  onObjectProvision: <T>(
    key: string,
    callback: (value: T) => void,
    options?: ObjectOptions
  ) => () => void;

  // Subscribe to getter registration - called when a new getter is registered
  onGetterRegistered?: (
    key: string,
    callback: () => void,
    options?: ObjectOptions
  ) => () => void;

  // ============ Optional Request/Response Pattern ============

  provideRequestHandler?: <TRequest = any, TResponse = any>(
    key: string,
    handler: (request: TRequest) => TResponse | Promise<TResponse>,
    options?: ObjectOptions
  ) => () => void;

  sendRequest?: <TRequest = any, TResponse = any>(
    key: string,
    request: TRequest,
    options?: ObjectOptions
  ) => Promise<TResponse>;

  onRequestHandlerRegistered?: (
    key: string,
    callback: () => void,
    options?: ObjectOptions
  ) => () => void;

  pushWith: (
    rawKey: string,
    params?: NavParams,
    options?: {
      requireObjects?: string[];
      provideObjects?: Record<string, () => any>;
      metadata?: StackEntry['metadata'];
    }
  ) => Promise<boolean | NavActionResult>;

  replaceWith: (
    rawKey: string,
    params?: NavParams,
    options?: {
      requireObjects?: string[];
      provideObjects?: Record<string, () => any>;
      metadata?: StackEntry['metadata'];
    }
  ) => Promise<boolean | NavActionResult>;

  goWith: (
    rawKey: string,
    params?: NavParams,
    options?: {
      requireObjects?: string[];
      provideObjects?: Record<string, () => any>;
      metadata?: StackEntry['metadata'];
    }
  ) => Promise<boolean | NavActionResult>;

  getStack: () => StackEntry[];
  length: () => number;
  subscribe: (fn: StackChangeListener) => () => void;
  registerGuard: (guard: GuardFn) => () => void;
  registerMiddleware: (middleware: MiddlewareFn) => () => void;
  dispose: () => void;
  clearAllPersistedStacks: () => void;
  syncWithBrowserHistory: (enabled: boolean) => void;
  isTop: (uid?: string) => boolean;
  getFullPath: () => string;
  getNavLink: () => NavigationMap;
  isActiveStack: () => boolean;
  isInGroup: () => boolean;
  getGroupId: () => string | null;
  goToGroupId(groupId: string): Promise<NavStackAPI>;
  addOnCreate: (handler: LifecycleHandler) => () => void;
  addOnDispose: (handler: LifecycleHandler) => () => void;
  addOnPause: (handler: LifecycleHandler) => () => void;
  addOnResume: (handler: LifecycleHandler) => () => void;
  addOnEnter: (handler: LifecycleHandler) => () => void;
  addOnExit: (handler: LifecycleHandler) => () => void;
  addOnBeforePush: (handler: AsyncLifecycleHandler) => () => void;
  addOnAfterPush: (handler: LifecycleHandler) => () => void;
  addOnBeforePop: (handler: AsyncLifecycleHandler) => () => void;
  addOnAfterPop: (handler: LifecycleHandler) => () => void;
  addOnBeforeReplace: (handler: AsyncLifecycleHandler) => () => void;
  addOnAfterReplace: (handler: LifecycleHandler) => () => void;
  clearAllLifecycleHandlers: (hook?: LifecycleHook) => void;
  getLifecycleHandlers: (hook: LifecycleHook) => LifecycleHandler[];
  _getLifecycleManager: () => EnhancedLifecycleManager;
};

export type NavigationMap = Record<string, ComponentType<any> | (() => LazyComponent)>;
export type BuiltinTransition = "fade" | "slide" | "none";
export type TransitionRenderer = (props: {
  children: ReactNode;
  state: TransitionState;
  index: number;
  isTop: boolean;
  style?: React.CSSProperties;
}) => ReactNode;

export type GuardFn = (action: {
  type: "push" | "replace" | 'replaceParam' | "pop" | "popUntil" | "popToRoot";
  from?: StackEntry | undefined;
  to?: StackEntry | undefined;
  stackSnapshot: StackEntry[];
}) => boolean | Promise<boolean>;

export type MiddlewareFn = (action: {
  type: "push" | "replace" | 'replaceParam' | "pop" | "popUntil" | "popToRoot" | "init";
  from?: StackEntry | undefined;
  to?: StackEntry | undefined;
  stackSnapshot: StackEntry[];
}) => void;

export type LifecycleHook =
  | 'onCreate'
  | 'onDispose'
  | 'onPause'
  | 'onResume'
  | 'onEnter'
  | 'onExit'
  | 'onBeforePush'
  | 'onAfterPush'
  | 'onBeforePop'
  | 'onAfterPop'
  | 'onBeforeReplace'
  | 'onAfterReplace';

export type LifecycleHandler = (context: {
  stack: StackEntry[];
  current?: StackEntry;
  previous?: StackEntry;
  action?: {
    type: 'push' | 'pop' | 'replace' | 'replaceParam' | 'popUntil' | 'popToRoot';
    target?: StackEntry;
  };
}) => void | Promise<void>;

export type AsyncLifecycleHandler = (context: {
  stack: StackEntry[];
  current?: StackEntry;
  previous?: StackEntry;
  action?: {
    type: 'push' | 'pop' | 'replace' | 'replaceParam' | 'popUntil' | 'popToRoot';
    target?: StackEntry;
  };
}) => Promise<void> | void;

export type ObjectKey = string | string[];

export type ObjectOptions = {
  scope?: string;
  global?: boolean;
};

