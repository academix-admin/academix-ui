import { NavContext, CurrentPageContext, GroupNavigationContext, GroupStackIdContext } from './core/contexts';
import type { NavStackAPI, NavigationMap, NavLocation } from './types';
import { globalObjectRegistry } from './di/object-registry';
// Public hooks + tagged-navigation helpers.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safe window access for SSR-safe code
 */
export function safeWindow<T>(
  callback: (win: Window) => T,
  fallback?: T
): T | undefined {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    return callback(window);
  } catch (err) {
    console.warn('[SafeWindow] Error accessing window:', err);
    return fallback;
  }
}

/**
 * C3 — Reactive location for the enclosing stack. Re-renders whenever the
 * stack changes; returns null outside a NavigationStack.
 */
export function useLocation(): NavLocation | null {
  const nav = useContext(NavContext);
  const [location, setLocation] = useState<NavLocation | null>(() =>
    nav ? nav.getLocation() : null
  );

  useEffect(() => {
    if (!nav) return;
    setLocation(nav.getLocation());
    return nav.subscribe(() => setLocation(nav.getLocation()));
  }, [nav]);

  return location;
}

export function useNav() {
  const context = useContext(NavContext);
  if (!context) throw new Error("useNav must be used within a NavigationStack");
  return context;
}

export function useIsTop(): boolean {
  const nav = useContext(NavContext);
  const currentUid = useContext(CurrentPageContext);
  const [isTop, setIsTop] = useState(() => {
    if (!nav || !currentUid) return false;
    return nav.peek()?.uid === currentUid;
  });

  useEffect(() => {
    if (!nav || !currentUid) return;

    setIsTop(nav.peek()?.uid === currentUid);

    return nav.subscribe((stack) => {
      setIsTop(stack[stack.length - 1]?.uid === currentUid);
    });
  }, [nav, currentUid]);

  return isTop;
}

/**
 * Debug hook to inspect available objects in current stack
 * Useful for troubleshooting object availability
 */
export function useDebugObjects() {
  const nav = useContext(NavContext);

  if (!nav) {
    return {
      stackId: null,
      availableObjects: [],
      hasGlobal: false,
      hasStackScoped: false,
      isInGroup: false,
      groupId: null,
    };
  }

  const objects = nav.listObjects();

  return {
    stackId: nav.id,
    availableObjects: objects,
    hasGlobal: objects.length > 0,
    hasStackScoped: objects.length > 0,
    isInGroup: nav.isInGroup(),
    groupId: nav.getGroupId(),
    registeredCount: objects.length,
  };
}

// ==================== Custom Hooks ====================

/**
 * Hook for managing page lifecycle events
 * Supports both stack-level events (push, pop, replace) and group-level events (pause, resume)
 * @param nav - The navigation stack API
 * @param callbacks - Object containing lifecycle callback functions
 * @param dependencies - Additional dependencies for the callbacks
 */
export function usePageLifecycle(
  nav: NavStackAPI,
  callbacks: {
    onEnter?: (context: any) => void;
    onExit?: (context: any) => void;
    onPause?: (context: any) => void;
    onResume?: (context: any) => void;
    onBeforePush?: (context: any) => Promise<void>;
    onAfterPush?: (context: any) => void;
    onBeforePop?: (context: any) => Promise<void>;
    onAfterPop?: (context: any) => void;
    onBeforeReplace?: (context: any) => Promise<void>;
    onAfterReplace?: (context: any) => void;
  },
  dependencies: any[] = []
) {
  const stableCallbacks = useMemo(() => callbacks, dependencies);
  const currentPageUid = useContext(CurrentPageContext);
  const groupContext = useContext(GroupNavigationContext);
  const groupStackId = useContext(GroupStackIdContext);
  const isMounted = useRef(false);
  const hasTriggeredInitialEnter = useRef(false);
  const hasOnEnterBeenCalled = useRef(false); // Track if onEnter has EVER been called for this page
  const isStackActive = useRef(true);

  // Helper to check if stack is active in its group
  const isStackCurrentlyActive = () => {
    if (!groupContext || !groupStackId) {
      return true; // Not in a group, always active
    }
    return groupContext.isActiveStack(groupStackId);
  };

  useEffect(() => {
    isMounted.current = true;
    const cleanupFunctions: (() => void)[] = [];

    // Get current page info
    const currentEntry = nav.peek();
    const isCurrentPageActive = currentEntry?.uid === currentPageUid;
    const stackIsActive = isStackCurrentlyActive();

    // Helper to check if context belongs to current page
    const isOurPageEntering = (context: any) =>
      context.current?.uid === currentPageUid;

    const isOurPageExiting = (context: any) =>
      context.previous?.uid === currentPageUid;

    const isOurPageCurrent = (context: any) =>
      context.current?.uid === currentPageUid;

    // Handle initial page load - only for the current page and only if stack is active
    if (isCurrentPageActive && currentEntry && stableCallbacks.onEnter && !hasOnEnterBeenCalled.current && stackIsActive) {
      hasOnEnterBeenCalled.current = true;

      const initialContext = {
        stack: nav.getStack(),
        current: currentEntry,
        previous: undefined,
        action: { type: 'initial' }
      };

      // Use microtask to ensure component is mounted
      Promise.resolve().then(() => {
        if (isMounted.current) {
          stableCallbacks.onEnter!(initialContext);
        }
      });
    }

    // Register scoped lifecycle handlers

    // PAGE TRANSITION EVENTS (scoped to specific page)
    if (stableCallbacks.onEnter) {
      const handler = (context: any) => {
        if (!isMounted.current) return;

        // CRITICAL CHECK: onEnter can only fire ONCE per page lifecycle
        // Once it has been called, it NEVER fires again
        if (hasOnEnterBeenCalled.current) {
          return;
        }

        // Stack must be CURRENTLY active in group
        if (!isStackCurrentlyActive()) {
          return;
        }

        // This must be our page entering
        if (!isOurPageEntering(context)) {
          return;
        }

        // Mark that onEnter has been called - permanently
        hasOnEnterBeenCalled.current = true;

        // Now fire onEnter - and it will never fire again for this page
        stableCallbacks.onEnter!(context);
      };
      cleanupFunctions.push(nav.addOnEnter(handler));
    }

    if (stableCallbacks.onExit) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // Only fire if stack was active when exiting
        if (!isStackCurrentlyActive()) return;
        if (isOurPageExiting(context)) {
          stableCallbacks.onExit!(context);
        }
      };
      cleanupFunctions.push(nav.addOnExit(handler));
    }

    // APP-LEVEL EVENTS (not scoped - fire for active page)
    if (stableCallbacks.onPause) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // Only if stack is active (not paused by group switch) and page is on top
        if (!isStackCurrentlyActive()) return;
        const currentTopPage = nav.peek();
        if (currentTopPage?.uid === currentPageUid) {
          stableCallbacks.onPause!(context);
        }
      };
      cleanupFunctions.push(nav.addOnPause(handler));
    }

    if (stableCallbacks.onResume) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // Only if stack is active (not paused by group switch) and page is on top
        if (!isStackCurrentlyActive()) return;
        const currentTopPage = nav.peek();
        if (currentTopPage?.uid === currentPageUid) {
          stableCallbacks.onResume!(context);
        }
      };
      cleanupFunctions.push(nav.addOnResume(handler));
    }

    // NAVIGATION ACTION EVENTS (scoped to initiating page)
    if (stableCallbacks.onBeforePush) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // onBeforePush: only when pushing FROM our current page
        if (isOurPageCurrent(context)) {
          return stableCallbacks.onBeforePush!(context);
        }
      };
      cleanupFunctions.push(nav.addOnBeforePush(handler));
    }

    if (stableCallbacks.onAfterPush) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // onAfterPush: only when push was initiated FROM our page
        if (context.previous?.uid === currentPageUid) {
          stableCallbacks.onAfterPush!(context);
        }
      };
      cleanupFunctions.push(nav.addOnAfterPush(handler));
    }

    if (stableCallbacks.onBeforePop) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // onBeforePop: only when popping FROM our current page
        if (isOurPageCurrent(context)) {
          return stableCallbacks.onBeforePop!(context);
        }
      };
      cleanupFunctions.push(nav.addOnBeforePop(handler));
    }

    if (stableCallbacks.onAfterPop) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // onAfterPop: only when our page was popped
        if (isOurPageExiting(context)) {
          stableCallbacks.onAfterPop!(context);
        }
      };
      cleanupFunctions.push(nav.addOnAfterPop(handler));
    }

    if (stableCallbacks.onBeforeReplace) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // onBeforeReplace: only when replacing our current page
        if (isOurPageCurrent(context)) {
          return stableCallbacks.onBeforeReplace!(context);
        }
      };
      cleanupFunctions.push(nav.addOnBeforeReplace(handler));
    }

    if (stableCallbacks.onAfterReplace) {
      const handler = (context: any) => {
        if (!isMounted.current) return;
        // onAfterReplace: only when our page was replaced
        if (isOurPageExiting(context)) {
          stableCallbacks.onAfterReplace!(context);
        }
      };
      cleanupFunctions.push(nav.addOnAfterReplace(handler));
    }

    return () => {
      isMounted.current = false;
      hasTriggeredInitialEnter.current = false;
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [nav, stableCallbacks, currentPageUid]);

  // Track group-level visibility changes (pause/resume when stack becomes inactive/active)
  useEffect(() => {
    if (!groupContext || !groupStackId || !stableCallbacks.onPause && !stableCallbacks.onResume) {
      return; // Not in a group or no pause/resume callbacks
    }

    if (!isMounted.current) return;

    // Check if the page is currently visible in its group
    const wasActive = isStackActive.current;
    const isCurrentlyActive = groupContext.isActiveStack(groupStackId);

    // Only fire events if page is the active page in its stack
    const currentTopPage = nav.peek();
    const isTopPage = currentTopPage?.uid === currentPageUid;

    if (!isTopPage) {
      return; // Only fire group events for the top page
    }

    // Stack became inactive (switched to another stack in group)
    if (wasActive && !isCurrentlyActive && stableCallbacks.onPause) {
      isStackActive.current = false;
      stableCallbacks.onPause({
        stack: nav.getStack(),
        current: currentTopPage,
        reason: 'group-switch',
        action: { type: 'group-paused' }
      });
    }

    // Stack became active (returned to this stack in group)
    if (!wasActive && isCurrentlyActive && stableCallbacks.onResume) {
      isStackActive.current = true;
      stableCallbacks.onResume({
        stack: nav.getStack(),
        current: currentTopPage,
        reason: 'group-switch',
        action: { type: 'group-resumed' }
      });
    }
  }, [
    groupContext, // Watch for all group context changes (including activeStackId changes)
    groupStackId,
    nav,
    stableCallbacks,
    currentPageUid
  ]);
}

/**
 * Advanced hook with page state management
 * @param nav - The navigation stack API
 * @param pageKey - Optional page key to filter events
 */
export function usePageState(nav: NavStackAPI, pageKey?: string) {
  const [state, setState] = useState({
    isActive: false,
    isPaused: false,
    enterTime: null as number | null,
    exitTime: null as number | null
  });

  usePageLifecycle(nav, {
    onEnter: (context) => {
      if (pageKey && context.current?.key !== pageKey) return;

      setState(prev => ({
        ...prev,
        isActive: true,
        isPaused: false,
        enterTime: Date.now(),
        exitTime: null
      }));
    },

    onExit: (context) => {
      if (pageKey && context.current?.key !== pageKey) return;

      setState(prev => ({
        ...prev,
        isActive: false,
        exitTime: Date.now()
      }));
    },

    onPause: () => {
      setState(prev => ({ ...prev, isPaused: true }));
    },

    onResume: () => {
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [pageKey]);

  return state;
}

/**
 * Hook for page-specific lifecycle with automatic cleanup
 * @param nav - The navigation stack API
 * @param pageKey - The specific page key to watch
 * @param callbacks - Lifecycle callbacks
 */
export function usePageSpecificLifecycle(
  nav: NavStackAPI,
  pageKey: string,
  callbacks: {
    onEnter?: (context: any) => void;
    onExit?: (context: any) => void;
    onPause?: (context: any) => void;
    onResume?: (context: any) => void;
  }
) {
  usePageLifecycle(nav, {
    onEnter: (context) => {
      if (context.current?.key === pageKey) {
        callbacks.onEnter?.(context);
      }
    },
    onExit: (context) => {
      if (context.current?.key === pageKey) {
        callbacks.onExit?.(context);
      }
    },
    onPause: (context) => {
      if (context.current?.key === pageKey) {
        callbacks.onPause?.(context);
      }
    },
    onResume: (context) => {
      if (context.current?.key === pageKey) {
        callbacks.onResume?.(context);
      }
    }
  }, [pageKey]);
}

// ==================== Enhanced Object Hooks ====================

export interface UseObjectOptions {
  scope?: string;
  global?: boolean;
}

/**
 * Enhanced hook to provide an object with scoping options
 */
export function useProvideObject<T>(
  key: string,
  getter: () => T,
  options?: UseObjectOptions & { dependencies?: any[] }
): void {
  const nav = useContext(NavContext);
  const { dependencies = [], ...objectOptions } = options || {};
  const currentPageUid = useContext(CurrentPageContext);

  useEffect(() => {
    if (!nav) return;

    // If no scoping options specified, default to page scope
    const finalOptions = { ...objectOptions };

    if (!finalOptions.scope && !finalOptions.global) {
      // Default to page scope using current page UID
      if (currentPageUid) {
        finalOptions.scope = currentPageUid;
      }
    }

    const cleanup = nav.provideObject(key, getter, finalOptions);
    return cleanup;
  }, [nav, key, currentPageUid, ...dependencies]);
}

export type UseObjectResult<T> =
  | { isProvided: false; getter: undefined }
  | { isProvided: true; getter: () => T };

export function useObject<T>(
  key: string,
  options?: UseObjectOptions
): UseObjectResult<T> {
  const nav = useContext(NavContext);
  const currentPageUid = useContext(CurrentPageContext);
  const [getter, setGetter] = useState<(() => T) | undefined>(undefined);
  const [isProvided, setIsProvided] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const optionsRef = useRef(options);

  if (!nav) {
    throw new Error("useObject must be used within a NavigationStack");
  }

  // Memoize string representation of options to detect actual changes
  const optionsString = useMemo(() => JSON.stringify(options), [options]);

  // Update ref when options actually change
  useEffect(() => {
    optionsRef.current = options;
  }, [optionsString]);

  const finalOptions = useMemo(() => {
    const opts = { ...optionsRef.current };
    // stack was removed from ObjectOptions in the new version.
    // Delete it in case any call site still passes it.
    delete (opts as any).stack;
    return opts;
  }, [optionsString]);

  useEffect(() => {
    // Reset mounted flag when effect runs
    isMountedRef.current = true;

    if (!nav) return;

    // Try to get the getter
    const foundGetter = nav.getObject<() => T>(key, finalOptions);

    if (!foundGetter) {
      // Getter not yet provided - wait for it
      setGetter(undefined);
      setIsProvided(false);

      // Subscribe to getter registration
      unsubscribeRef.current = nav.onGetterRegistered?.(key, () => {
        if (!isMountedRef.current) return;
        setTimeout(() => {
          if (!isMountedRef.current) return;
          const newGetter = nav.getObject<() => T>(key, finalOptions);
          if (newGetter) {
            setGetter(() => newGetter);
            setIsProvided(true);
          }
        }, 0);
      }, finalOptions) || (() => { });
      return;
    }

    // Clean up old subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Provider has established the link - set getter and isProvided
    setGetter(() => foundGetter);
    setIsProvided(true);
  }, [nav, key, finalOptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [key]);

  return { getter, isProvided } as UseObjectResult<T>;
}

// ==================== Request/Response Pattern Hooks ====================

/**
 * Provider hook: Register a request handler
 * The handler receives requests from consumers and returns responses
 * 
 * Example:
 * useProvideRequestHandler('user-action', async (request: {action: string}) => {
 *   // Handle request and return response
 *   return {success: true, result: ...}
 * })
 */
export function useProvideRequestHandler<TRequest = any, TResponse = any>(
  key: string,
  handler: (request: TRequest) => TResponse | Promise<TResponse>,
  options?: UseObjectOptions & { dependencies?: any[] }
): void {
  const nav = useContext(NavContext);
  const { dependencies = [], ...objectOptions } = options || {};
  const currentPageUid = useContext(CurrentPageContext);

  useEffect(() => {
    if (!nav || !nav.provideRequestHandler) return;

    // If no scoping options specified, default to page scope
    const finalOptions = { ...objectOptions };

    if (!finalOptions.scope && !finalOptions.global) {
      // Default to page scope using current page UID
      if (currentPageUid) {
        finalOptions.scope = currentPageUid;
      }
    }

    const cleanup = nav.provideRequestHandler<TRequest, TResponse>(key, handler, finalOptions);
    return cleanup;
  }, [nav, key, currentPageUid, ...dependencies]);
}

/**
 * Consumer hook: Send a request and wait for response
 * Returns [sendRequest, isHandlerAvailable] tuple
 * 
 * Example:
 * const [sendRequest, isAvailable] = useSendRequest('user-action')
 * 
 * // When ready to send:
 * const response = await sendRequest({action: 'delete'})
 */
export function useSendRequest<TRequest = any, TResponse = any>(
  key: string,
  options?: UseObjectOptions
): [(request: TRequest) => Promise<TResponse>, boolean] {
  const nav = useContext(NavContext);
  const [isHandlerAvailable, setIsHandlerAvailable] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  if (!nav) {
    throw new Error("useSendRequest must be used within a NavigationStack");
  }

  const finalOptions = useMemo(() => {
    const opts = { ...options };
    return opts;
  }, [options, nav.id]);

  // Check if handler is available and subscribe for registration
  useEffect(() => {
    isMountedRef.current = true;

    if (!nav.onRequestHandlerRegistered) {
      setIsHandlerAvailable(false);
      return;
    }

    // Subscribe to handler registration
    unsubscribeRef.current = nav.onRequestHandlerRegistered(key, () => {
      if (isMountedRef.current) {
        setIsHandlerAvailable(true);
      }
    }, finalOptions) || (() => { });

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [nav, key, finalOptions]);

  // The send function
  const sendRequest = useCallback(
    async (request: TRequest): Promise<TResponse> => {
      if (!nav.sendRequest) {
        throw new Error("sendRequest is not available");
      }
      return nav.sendRequest<TRequest, TResponse>(key, request, finalOptions);
    },
    [nav, key, finalOptions]
  );

  return [sendRequest, isHandlerAvailable];
}

/**
 * Hook to get an object with multiple fallback strategies
 * Returns [data, isProvided] tuple for better control
 * Optimized to prevent excessive re-renders
 */
export function useObjectWithFallback<T>(
  key: string,
  fallbackStrategies: UseObjectOptions[] = [
    {}, // Try page scope
    { global: true }, // Try global scope
  ]
): [T | undefined, boolean] {
  const nav = useContext(NavContext);
  const [data, setData] = useState<T | undefined>(undefined);
  const [isProvided, setIsProvided] = useState(false);
  const resolutionRef = useRef<{ key: string; strategies: string } | null>(null);

  if (!nav) {
    throw new Error("useObjectWithFallback must be used within a NavigationStack");
  }

  const strategiesKey = useMemo(() => JSON.stringify(fallbackStrategies), [fallbackStrategies]);

  useEffect(() => {
    if (!nav) return;

    // Skip if we're already resolving the same key with same strategies
    if (resolutionRef.current?.key === key && resolutionRef.current?.strategies === strategiesKey) {
      return;
    }

    resolutionRef.current = { key, strategies: strategiesKey };

    for (const strategy of fallbackStrategies) {
      const getter = nav.getObject<T>(key, strategy);

      if (getter !== undefined) {
        // Check if it's a promise
        if (getter && typeof getter === 'object' && 'then' in getter) { } else {
          setData(getter as T);
          setIsProvided(true);
        }
        return;
      }
    }

    setData(undefined);
    setIsProvided(false);
  }, [nav, key, fallbackStrategies, strategiesKey]);

  return [data, isProvided];
}

/**
 * Hook to check if object exists with specific scoping
 */
export function useObjectExists(
  key: string,
  options?: UseObjectOptions
): boolean {
  const nav = useContext(NavContext);
  const [exists, setExists] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!nav) return;

    // Check immediately
    setExists(nav.hasObject(key, options));

    // Subscribe to getter registration to detect when object becomes available
    const { scope, global = false } = options || {};
    let patternKey: string;
    if (global) {
      if (scope) {
        patternKey = `global:${scope}:${key}`;
      } else {
        patternKey = `global:${key}`;
      }
    } else if (scope) {
      patternKey = `${scope}:${key}`;
    } else {
      patternKey = `${nav.id}:${key}`;
    }

    unsubscribeRef.current = globalObjectRegistry.onGetterRegistered(patternKey, () => {
      setExists(true);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [nav, key, JSON.stringify(options)]);

  return exists;
}

/**
 * Hook to get an object synchronously without promise handling
 * Useful when you know the object is sync and already provided
 * For promise support or async handling, use useObject instead
 */
export function useObjectSync<T>(
  key: string,
  options?: UseObjectOptions
): T | undefined {
  const nav = useContext(NavContext);

  if (!nav) {
    throw new Error("useObjectSync must be used within a NavigationStack");
  }

  const finalOptions = useMemo(() => {
    const opts = { ...options };

    if (!opts.scope && !opts.global) {
      opts.scope = nav.id;
    }

    return opts;
  }, [options, nav.id]);

  return nav.getObject<T>(key, finalOptions);
}

// ==================== Object Utilities ====================

/**
 * Create a memoized object getter with type safety
 */
export function createObjectGetter<T>(factory: () => T): () => T {
  let instance: T | undefined;

  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}

/**
 * Create a reactive object getter that updates when dependencies change
 */
export function createReactiveObjectGetter<T>(
  factory: () => T,
  dependencies: any[]
): () => T {
  const ref = { current: factory() };

  useEffect(() => {
    ref.current = factory();
  }, dependencies);

  return () => ref.current;
}

/**
 * Type guard for object validation
 */
export function createObjectTypeGuard<T>(
  check: (obj: any) => obj is T
): (obj: any) => obj is T {
  return check;
}



export function aggregateNavigationMaps(...maps: NavigationMap[]): NavigationMap {
  const result: NavigationMap = {};

  for (const map of maps) {
    Object.assign(result, map);
  }

  return result;
}

/**
 * Extract components for a specific tag from a tag registry
 * Returns a navigation map containing only components tagged with the given tag
 */
export function getComponentsByTag(
  componentTags: Record<string, NavigationMap>,
  tag: string
): NavigationMap | undefined {
  return componentTags[tag];
}

/**
 * Get all available tags in a component tag registry
 */
export function getAvailableTags(componentTags: Record<string, NavigationMap>): string[] {
  return Object.keys(componentTags);
}

/**
 * Merge a component tag registry with a primary navigation map
 * Tags provide additional organization without affecting primary routing
 */
export function createTaggedNavigation(
  primary: NavigationMap,
  componentTags: Record<string, NavigationMap>,
  tagsToInclude?: string[]
): {
  primary: NavigationMap;
  tags: Record<string, NavigationMap>;
  merged: NavigationMap;
} {
  let merged = { ...primary };
  const filteredTags = tagsToInclude
    ? Object.fromEntries(
      Object.entries(componentTags).filter(([tag]) => tagsToInclude.includes(tag))
    )
    : componentTags;

  // Merge all tagged components (primary takes precedence)
  for (const tagMap of Object.values(filteredTags)) {
    for (const [key, value] of Object.entries(tagMap)) {
      if (!(key in primary)) {
        merged[key] = value;
      }
    }
  }

  return { primary, tags: filteredTags, merged };
}

/**
 * Hook to retrieve components by a specific tag
 * Returns the navigation map for that tag and a function to navigate to a component in it
 */
export function useComponentsByTag(tag: string) {
  const nav = useContext(NavContext);

  if (!nav) {
    throw new Error("useComponentsByTag must be used within a NavigationStack");
  }

  // This would require storing component tags in the API
  // For now, return a placeholder that components can use
  return {
    tag,
    available: true,
    components: {},
  };
}

// ==================== Main NavigationStack Component ====================
