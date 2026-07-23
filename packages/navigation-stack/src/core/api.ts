import type { GuardFn, MiddlewareFn, NavActionResult, NavParams, NavStackAPI, NavigationMap, ObjectOptions, StackChangeListener, StackEntry } from '../types';
import { DEFAULT_MAX_STACK_SIZE } from '../constants';
import { EnhancedLifecycleManager, PageMemoryManager, TransitionManager } from './managers';
import { _currentPageUidByStack } from './contexts';
import type { GroupNavigationContextType } from './contexts';
import { getRegistry } from './registry';
import { buildUrlPath, generateCompositeUid, parseRawKey, storageKeyFor, updateNavQueryParamForStack, decodeStackPath, parseUrlPathIntoStacks, parseCombinedNavParam, buildCombinedNavParam } from './persistence';
import { globalObjectRegistry } from '../di/object-registry';
// createApiFor — the per-stack navigation API factory.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export function createApiFor(id: string, navLink: NavigationMap, syncHistory: boolean, parentApi: NavStackAPI | null, currentPath: string, groupContext: GroupNavigationContextType | null = null, groupStackId: string | null): NavStackAPI {
  const globalRegistry = getRegistry();
  const transitionManager = new TransitionManager();
  const memoryManager = new PageMemoryManager();
  const lifecycleManager = new EnhancedLifecycleManager(id);

  let safeRegEntry = globalRegistry.get(id);
  if (!safeRegEntry) {
    safeRegEntry = {
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
    globalRegistry.set(id, safeRegEntry);

    if (parentApi) {
      const parentReg = globalRegistry.get(parentApi.id);
      if (parentReg) {
        parentReg.childIds.add(id);
      }
    }
  } else {
    safeRegEntry.navLink = navLink;
    safeRegEntry.parentId = parentApi?.id || null;
  }
  const regEntry = safeRegEntry;


  function emit(previousStack?: StackEntry[], action?: { type: string; target?: StackEntry }) {
    const stackCopy = regEntry!.stack.slice();
    const regEntryCurrentPath = regEntry.currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');

    const previous = previousStack ? previousStack[previousStack.length - 1] : undefined;
    const current = stackCopy[stackCopy.length - 1];

    if (!previousStack) {
      if (current) {
        lifecycleManager.trigger('onEnter', {
          stack: stackCopy,
          current,
          previous: undefined,
          action
        });
      }
    } else {
      const previousTop = previousStack[previousStack.length - 1];
      const currentTop = stackCopy[stackCopy.length - 1];

      const isDifferentPage = !previousTop || !currentTop || previousTop.uid !== currentTop.uid;

      if (isDifferentPage) {
        if (previousTop) {
          lifecycleManager.trigger('onExit', {
            stack: stackCopy,
            current: currentTop,
            previous: previousTop,
            action
          });
        }

        if (currentTop) {
          lifecycleManager.trigger('onEnter', {
            stack: stackCopy,
            current: currentTop,
            previous: previousTop,
            action
          });
        }
      }
    }

    // Update registry state
    regEntry.lastActiveEntry = current;

    if ((syncHistory || regEntry.historySyncEnabled) && regEntryCurrentPath) {
      if (typeof window !== 'undefined' && window.location.pathname !== regEntryCurrentPath) {
        console.warn(`NavigationStack ${id}: Path changed from ${regEntryCurrentPath} to ${window.location.pathname}, disabling URL updates`);
        regEntry.listeners.forEach((l: StackChangeListener) => {
          try { l(stackCopy); } catch (e) { console.warn(e); }
        });
        return;
      }
    }

    if (syncHistory || regEntry.historySyncEnabled) {
      try {
        const localPath = buildUrlPath([{ navLink, stack: stackCopy }]);
        updateNavQueryParamForStack(id, localPath, groupContext, groupStackId);
      } catch (e) {
        try {
          const fallback = buildUrlPath([{ navLink, stack: stackCopy }]);
          updateNavQueryParamForStack(id, fallback, groupContext, groupStackId);
        } catch { }
      }
    }

    regEntry.listeners.forEach((l: StackChangeListener) => {
      try { l(stackCopy); } catch (e) { console.warn(e); }
    });
  }

  function runMiddlewares(action: Parameters<MiddlewareFn>[0]) {
    regEntry.middlewares.forEach((m: MiddlewareFn) => {
      try { m(action); } catch (e) { console.warn("Nav middleware threw:", e); }
    });
  }

  async function runGuards(action: Parameters<GuardFn>[0]): Promise<boolean> {
    const guards = Array.from(regEntry.guards) as GuardFn[];
    for (const g of guards) {
      try {
        const res = await Promise.resolve(g(action));
        if (!res) return false;
      } catch (e) {
        console.warn("Nav guard threw:", e);
        return false;
      }
    }
    return true;
  }

  // ============ Improved Lock Mechanism (Race Condition Prevention) ============
  let actionLock = false;
  let pendingOperations = 0;

  async function withLock<T>(fn: () => Promise<T>): Promise<T | NavActionResult> {
    if (actionLock) {
      return { ok: false, reason: 'lock' } as unknown as T;
    }

    actionLock = true;
    pendingOperations++;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      console.error('[NavStack] Operation failed:', err);
      throw err;
    } finally {
      pendingOperations--;
      actionLock = false;
    }
  }

  /**
   * Wait for all pending navigation operations to complete
   * Useful for ensuring state stability before cleanup
   */
  function awaitPendingOperations(timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      if (pendingOperations === 0) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (pendingOperations === 0) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          console.warn('[NavStack] Timeout waiting for pending operations', { pendingOperations });
          resolve();
        }
      }, 50);
    });
  }

  const api: NavStackAPI = {
    id,
    async push(rawKey, params, metadata) {
      return withLock<boolean | NavActionResult>(async () => {
        const { key, params: p } = parseRawKey(rawKey, params);

        const newEntry: StackEntry = {
          uid: generateCompositeUid(id, groupContext, groupStackId, key, p),
          key,
          params: p,
          metadata
        };

        const previousStack = regEntry.stack.slice();

        // Before push lifecycle
        await lifecycleManager.trigger('onBeforePush', {
          stack: regEntry.stack.slice(),
          current: regEntry.stack[regEntry.stack.length - 1],
          previous: undefined,
          action: { type: 'push', target: newEntry }
        });

        const action = {
          type: "push" as const,
          from: regEntry.stack[regEntry.stack.length - 1],
          to: newEntry,
          stackSnapshot: regEntry.stack.slice()
        };
        const ok = await runGuards(action);
        if (!ok) return false;
        if (regEntry.maxStackSize && regEntry.stack.length >= regEntry.maxStackSize) {
          regEntry.stack.splice(0, regEntry.stack.length - regEntry.maxStackSize + 1);
        }
        regEntry.stack.push(newEntry);
        runMiddlewares(action);
        emit(previousStack, { type: 'push', target: newEntry });

        // After push lifecycle
        lifecycleManager.trigger('onAfterPush', {
          stack: regEntry.stack.slice(),
          current: newEntry,
          previous: action.from,
          action: { type: 'push', target: newEntry }
        });

        return true;
      });
    },

    async replace(rawKey, params, metadata) {
      return withLock<boolean | NavActionResult>(async () => {
        const { key, params: p } = parseRawKey(rawKey, params);
        const newEntry: StackEntry = { uid: generateCompositeUid(id, groupContext, groupStackId, key, p), key, params: p, metadata };
        const previousEntry = regEntry.stack[regEntry.stack.length - 1];

        // Before replace lifecycle
        await lifecycleManager.trigger('onBeforeReplace', {
          stack: regEntry.stack.slice(),
          current: previousEntry,
          previous: undefined,
          action: { type: 'replace', target: newEntry }
        });

        const action = {
          type: "replace" as const,
          from: previousEntry,
          to: newEntry,
          stackSnapshot: regEntry.stack.slice()
        };

        const ok = await runGuards(action);
        if (!ok) return false;

        const previousStack = regEntry.stack.slice();
        if (regEntry.stack.length === 0) {
          regEntry.stack.push(newEntry);
        } else {
          regEntry.stack[regEntry.stack.length - 1] = newEntry;
        }

        runMiddlewares(action);
        emit(previousStack, { type: 'replace', target: newEntry });

        // After replace lifecycle
        lifecycleManager.trigger('onAfterReplace', {
          stack: regEntry.stack.slice(),
          current: newEntry,
          previous: previousEntry,
          action: { type: 'replace', target: newEntry }
        });

        return true;
      });
    },

    async pop() {
      return withLock<boolean | NavActionResult>(async () => {
        if (regEntry.stack.length === 0) {
          if (regEntry.parentId) return false;
          return false;
        }
        const top = regEntry.stack[regEntry.stack.length - 1];
        const pageBelow = regEntry.stack[regEntry.stack.length - 2];

        await lifecycleManager.trigger('onBeforePop', {
          stack: regEntry.stack.slice(),
          current: top,
          previous: pageBelow,
          action: { type: 'pop', target: top }
        });

        const action = {
          type: "pop" as const,
          from: top,
          to: pageBelow,
          stackSnapshot: regEntry.stack.slice()
        };
        const ok = await runGuards(action);
        if (!ok) return false;

        const previousStack = regEntry.stack.slice();

        regEntry.stack.pop();
        runMiddlewares(action);
        emit(previousStack, { type: 'pop', target: top });
        
        // After pop lifecycle
        lifecycleManager.trigger('onAfterPop', {
          stack: regEntry.stack.slice(),
          current: regEntry.stack[regEntry.stack.length - 1],
          previous: top,
          action: { type: 'pop', target: top }
        });
        
        // Trigger onResume for the page we're returning to
        if (pageBelow) {
          lifecycleManager.trigger('onResume', {
            stack: regEntry.stack.slice(),
            current: pageBelow,
            previous: top,
            action: { type: 'pop', target: top }
          });
        }
        
        return true;
      });
    },

    async popUntil(predicate) {
      return withLock<boolean | NavActionResult>(async () => {
        if (regEntry.stack.length === 0) {
          if (regEntry.parentId) return false;
          return false;
        }

        const previousStack = regEntry.stack.slice();
        let i = regEntry.stack.length - 1;
        while (i >= 0 && !predicate(regEntry.stack[i], i, regEntry.stack)) i--;

        if (i < regEntry.stack.length - 1) {
          const poppedEntries = regEntry.stack.slice(i + 1);
          const targetEntry = regEntry.stack[i];

          // Before popUntil lifecycle for each popped entry
          for (const poppedEntry of poppedEntries) {
            await lifecycleManager.trigger('onBeforePop', {
              stack: previousStack,
              current: poppedEntry,
              previous: targetEntry,
              action: { type: 'popUntil', target: poppedEntry }
            });
          }

          const action = {
            type: "popUntil" as const,
            stackSnapshot: previousStack
          };

          const ok = await runGuards(action);
          if (!ok) return false;

          regEntry.stack.splice(i + 1);

          runMiddlewares(action);
          emit(previousStack, { type: 'popUntil', target: targetEntry });

          // After popUntil lifecycle
          lifecycleManager.trigger('onAfterPop', {
            stack: regEntry.stack.slice(),
            current: targetEntry,
            previous: poppedEntries[poppedEntries.length - 1],
            action: { type: 'popUntil', target: targetEntry }
          });

          // Trigger onExit for each popped entry
          poppedEntries.forEach((poppedEntry: StackEntry) => {
            lifecycleManager.trigger('onExit', {
              stack: regEntry.stack.slice(),
              current: targetEntry,
              previous: poppedEntry,
              action: { type: 'popUntil', target: poppedEntry }
            });
          });

          return true;
        }
        return false;
      });
    },

    async popToRoot() {
      return withLock<boolean | NavActionResult>(async () => {
        const action = {
          type: "popToRoot" as const,
          stackSnapshot: regEntry.stack.slice()
        };

        if (regEntry.parentId) return false;

        if (regEntry.stack.length <= 1) return false;

        const previousStack = regEntry.stack.slice();
        const poppedEntries = regEntry.stack.slice(1);
        const targetEntry = regEntry.stack[0];

        // Before popToRoot lifecycle for each popped entry
        for (const poppedEntry of poppedEntries) {
          await lifecycleManager.trigger('onBeforePop', {
            stack: previousStack,
            current: poppedEntry,
            previous: targetEntry,
            action: { type: 'popToRoot', target: poppedEntry }
          });
        }

        const ok = await runGuards(action);
        if (!ok) return false;

        regEntry.stack.splice(1);

        runMiddlewares(action);
        emit(previousStack, { type: 'popToRoot', target: targetEntry });

        // After popToRoot lifecycle
        lifecycleManager.trigger('onAfterPop', {
          stack: regEntry.stack.slice(),
          current: targetEntry,
          previous: poppedEntries[poppedEntries.length - 1],
          action: { type: 'popToRoot', target: targetEntry }
        });

        // Trigger onExit for each popped entry
        poppedEntries.forEach((poppedEntry: StackEntry) => {
          lifecycleManager.trigger('onExit', {
            stack: regEntry.stack.slice(),
            current: targetEntry,
            previous: poppedEntry,
            action: { type: 'popToRoot', target: poppedEntry }
          });
        });

        return true;
      });
    },

    async pushAndPopUntil(rawKey, predicate, params, metadata) {
      return withLock<boolean | NavActionResult>(async () => {
        const { key, params: p } = parseRawKey(rawKey, params);
        const newEntry: StackEntry = { uid: generateCompositeUid(id, groupContext, groupStackId, key, p), key, params: p, metadata };

        const previousStack = regEntry.stack.slice();
        const lastTop = regEntry.stack[regEntry.stack.length - 1];

        // Before push lifecycle
        await lifecycleManager.trigger('onBeforePush', {
          stack: previousStack,
          current: lastTop,
          previous: undefined,
          action: { type: 'pushAndPopUntil', target: newEntry }
        });

        const action = {
          type: "push" as const,
          from: lastTop,
          to: newEntry,
          stackSnapshot: previousStack
        };

        const ok = await runGuards(action);
        if (!ok) return false;

        regEntry.stack.push(newEntry);

        // Pop below the predicate before emitting - single final state
        let i = regEntry.stack.length - 2; // start below newEntry
        const poppedEntries: StackEntry[] = [];

        while (i >= 0 && !predicate(regEntry.stack[i], i, regEntry.stack)) {
          poppedEntries.push(regEntry.stack[i]);
          regEntry.stack.splice(i, 1);
          i--;
        }

        runMiddlewares(action);
        emit(previousStack, { type: 'pushAndPopUntil', target: newEntry });

        // After push lifecycle
        lifecycleManager.trigger('onAfterPush', {
          stack: regEntry.stack.slice(),
          current: newEntry,
          previous: lastTop,
          action: { type: 'pushAndPopUntil', target: newEntry }
        });

        // Trigger onExit for popped entries
        for (const poppedEntry of poppedEntries) {
          lifecycleManager.trigger('onExit', {
            stack: regEntry.stack.slice(),
            current: newEntry,
            previous: poppedEntry,
            action: { type: 'pushAndPopUntil', target: poppedEntry }
          });
        }

        return true;
      });
    },

    async pushAndReplace(rawKey, params, metadata) {
      return withLock<boolean | NavActionResult>(async () => {
        const { key, params: p } = parseRawKey(rawKey, params);
        const newEntry: StackEntry = { uid: generateCompositeUid(id, groupContext, groupStackId, key, p), key, params: p, metadata };
        const previousEntry = regEntry.stack[regEntry.stack.length - 1];

        // Before replace lifecycle
        await lifecycleManager.trigger('onBeforeReplace', {
          stack: regEntry.stack.slice(),
          current: previousEntry,
          previous: undefined,
          action: { type: 'pushAndReplace', target: newEntry }
        });

        const action = {
          type: "replace" as const,
          from: previousEntry,
          to: newEntry,
          stackSnapshot: regEntry.stack.slice()
        };

        const ok = await runGuards(action);
        if (!ok) return false;

        const previousStack = regEntry.stack.slice();
        if (regEntry.stack.length > 0) regEntry.stack.pop();
        regEntry.stack.push(newEntry);

        runMiddlewares(action);
        emit(previousStack, { type: 'pushAndReplace', target: newEntry });

        // After replace lifecycle
        lifecycleManager.trigger('onAfterReplace', {
          stack: regEntry.stack.slice(),
          current: newEntry,
          previous: previousEntry,
          action: { type: 'pushAndReplace', target: newEntry }
        });

        return true;
      });
    },

    async go(rawKey, params, metadata) {
      return withLock<boolean | NavActionResult>(async () => {
        const { key, params: p } = parseRawKey(rawKey, params);
        const newEntry: StackEntry = { uid: generateCompositeUid(id, groupContext, groupStackId, key, p), key, params: p, metadata };
        const previousEntry = regEntry.stack[regEntry.stack.length - 1];

        // Before replace lifecycle (go is essentially a replace)
        await lifecycleManager.trigger('onBeforeReplace', {
          stack: regEntry.stack.slice(),
          current: previousEntry,
          previous: undefined,
          action: { type: 'go', target: newEntry }
        });

        const action = {
          type: "replace" as const,
          from: previousEntry,
          to: newEntry,
          stackSnapshot: regEntry.stack.slice(),
        };

        const ok = await runGuards(action);
        if (!ok) return false;

        const previousStack = regEntry.stack.slice();
        const len = regEntry.stack.length;
        regEntry.stack.push(newEntry);
        regEntry.stack.splice(0, len);

        runMiddlewares(action);
        emit(previousStack, { type: 'go', target: newEntry });

        // After replace lifecycle
        lifecycleManager.trigger('onAfterReplace', {
          stack: regEntry.stack.slice(),
          current: newEntry,
          previous: previousEntry,
          action: { type: 'go', target: newEntry }
        });

        return true;
      });
    },

    async replaceParam(newParams: NavParams, merge: boolean = true) {
      return withLock<boolean | NavActionResult>(async () => {
        const currentEntry = regEntry.stack[regEntry.stack.length - 1];

        if (!currentEntry) {
          console.warn('replaceParam: No current page in stack');
          return false;
        }

        // Calculate the new parameters
        const finalParams = merge
          ? { ...currentEntry.params, ...newParams }
          : newParams;
        // Check if parameters actually changed
        const paramsChanged = JSON.stringify(currentEntry.params) !== JSON.stringify(finalParams);
        if (!paramsChanged) {
          // No changes needed
          return true;
        }

        // Create updated entry but KEEP THE SAME UID
        // This is the key fix - don't generate new UID for param changes
        const updatedEntry: StackEntry = {
          ...currentEntry, // Keep the same UID and all other properties
          params: finalParams
        };

        // Before replace lifecycle
        await lifecycleManager.trigger('onBeforeReplace', {
          stack: regEntry.stack.slice(),
          current: currentEntry,
          previous: undefined,
          action: { type: 'replaceParam', target: updatedEntry }
        });

        const action = {
          type: "replaceParam" as const,
          from: currentEntry,
          to: updatedEntry,
          stackSnapshot: regEntry.stack.slice()
        };

        // Run guards
        const ok = await runGuards(action);
        if (!ok) return false;

        const previousStack = regEntry.stack.slice();

        // Replace the current entry with updated parameters (same position, same UID)
        regEntry.stack[regEntry.stack.length - 1] = updatedEntry;

        // Run middlewares
        runMiddlewares(action);

        // Emit changes to listeners - this should NOT trigger transitions
        // since the UID remains the same
        emit(previousStack, { type: 'replaceParam', target: updatedEntry });

        // After replace lifecycle
        lifecycleManager.trigger('onAfterReplace', {
          stack: regEntry.stack.slice(),
          current: updatedEntry,
          previous: currentEntry,
          action: { type: 'replaceParam', target: updatedEntry }
        });

        return true;
      });
    },

    provideObject<T>(key: string, getter: () => T, options?: ObjectOptions) {
      const { scope, global = false } = options || {};
      const current = regEntry.stack[regEntry.stack.length - 1];

      return globalObjectRegistry.registerWithOptions(id, key, getter, {
        scopeId: scope || current?.uid,
        isGlobal: global
      });
    },

    getObject<T>(key: string, options?: ObjectOptions): T | undefined {
      const { scope, global = false } = options || {};

      return globalObjectRegistry.getWithOptions<T>(id, key, {
        scopeId: scope,
        isGlobal: global
      });
    },

    hasObject(key: string, options?: ObjectOptions): boolean {
      const { scope, global = false } = options || {};

      return globalObjectRegistry.hasWithOptions(id, key, {
        scopeId: scope,
        isGlobal: global
      });
    },

    removeObject(key: string): void {
      globalObjectRegistry.unregister(id, key); // Changed from remove() to unregister()
    },

    clearObjects(): void {
      globalObjectRegistry.clearStack(id);
    },

    listObjects(): string[] {
      return globalObjectRegistry.getRegisteredKeys(id);
    },

    onObjectProvision<T>(
      key: string,
      callback: (value: T) => void,
      options?: ObjectOptions
    ): () => void {
      const { scope, global = false } = options || {};

      // Build the pattern key
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
        patternKey = `${id}:${key}`;
      }

      // Subscribe to getter registration in message bus model
      // When getter is registered, callback is called (backward compat wrapper for callback signature)
      return globalObjectRegistry.onGetterRegistered(patternKey, () => {
        // In message bus model, getter is now available
        // For backward compatibility, we notify the consumer that something changed
        callback(undefined as T);
      });
    },

    onGetterRegistered(
      key: string,
      callback: () => void,
      options?: ObjectOptions
    ): () => void {
      const { scope, global = false } = options || {};

      // Build the pattern key
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
        patternKey = `${id}:${key}`;
      }

      // Subscribe to getter registration events
      return globalObjectRegistry.onGetterRegistered(patternKey, callback);
    },

    // ============ Optional Request/Response Pattern ============

    provideRequestHandler<TRequest = any, TResponse = any>(
      key: string,
      handler: (request: TRequest) => TResponse | Promise<TResponse>,
      options?: ObjectOptions
    ): () => void {
      const { scope, global = false } = options || {};

      // Build the pattern key
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
        patternKey = `${id}:${key}`;
      }

      return globalObjectRegistry.registerRequestHandler(patternKey, handler);
    },

    async sendRequest<TRequest = any, TResponse = any>(
      key: string,
      request: TRequest,
      options?: ObjectOptions
    ): Promise<TResponse> {
      const { scope, global = false } = options || {};

      // Build the pattern key
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
        patternKey = `${id}:${key}`;
      }

      return globalObjectRegistry.sendRequest<TRequest, TResponse>(patternKey, request);
    },

    onRequestHandlerRegistered(
      key: string,
      callback: () => void,
      options?: ObjectOptions
    ): () => void {
      const { scope, global = false } = options || {};

      // Build the pattern key
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
        patternKey = `${id}:${key}`;
      }

      return globalObjectRegistry.onRequestHandlerRegistered(patternKey, callback);
    },

    // ============ OBJECT-ENABLED NAVIGATION METHODS ============

    async pushWith(
      rawKey: string,
      params?: NavParams,
      options?: {
        requireObjects?: string[];
        provideObjects?: Record<string, () => any>;
        metadata?: StackEntry['metadata'];
      }
    ): Promise<boolean> {
      const { requireObjects = [], provideObjects = {}, metadata } = options || {};

      // Verify required objects exist
      for (const objKey of requireObjects) {
        if (!objectExistsInAnyScope(objKey)) {
          console.warn(
            `[NavStack] Cannot push "${rawKey}": required object "${objKey}" not found ` +
            `in any scope for stack "${id}".`
          );
          return false;
        }
      }

      // Create enhanced params with object references
      const enhancedParams = {
        ...params,
        __providedObjects: Object.keys(provideObjects),
      };

      // Push first
      const success = await api.push(rawKey, enhancedParams, metadata);
      if (!success) return false;

      // Register provided objects on the new page
      const current = regEntry.stack[regEntry.stack.length - 1];
      if (current) {
        Object.entries(provideObjects).forEach(([key, getter]) => {
          globalObjectRegistry.register(id, key, getter, current.uid);
        });
      }

      return true;
    },

    async replaceWith(
      rawKey: string,
      params?: NavParams,
      options?: {
        requireObjects?: string[];
        provideObjects?: Record<string, () => any>;
        metadata?: StackEntry['metadata'];
      }
    ): Promise<boolean> {
      const { requireObjects = [], provideObjects = {}, metadata } = options || {};

      // Verify required objects exist
      for (const objKey of requireObjects) {
        if (!objectExistsInAnyScope(objKey)) {
          console.warn(
            `[NavStack] Cannot replace with "${rawKey}": required object "${objKey}" not found ` +
            `in any scope for stack "${id}".`
          );
          return false;
        }
      }

      // Create enhanced params
      const enhancedParams = {
        ...params,
        __providedObjects: Object.keys(provideObjects),
      };

      // Replace
      const success = await api.replace(rawKey, enhancedParams, metadata);
      if (!success) return false;

      // Register provided objects
      const current = regEntry.stack[regEntry.stack.length - 1];
      if (current) {
        Object.entries(provideObjects).forEach(([key, getter]) => {
          globalObjectRegistry.register(id, key, getter, current.uid);
        });
      }

      return true;
    },

    async goWith(
      rawKey: string,
      params?: NavParams,
      options?: {
        requireObjects?: string[];
        provideObjects?: Record<string, () => any>;
        metadata?: StackEntry['metadata'];
      }
    ): Promise<boolean> {
      const { requireObjects = [], provideObjects = {}, metadata } = options || {};

      // Verify required objects exist
      for (const objKey of requireObjects) {
        if (!objectExistsInAnyScope(objKey)) {
          console.warn(
            `[NavStack] Cannot go with "${rawKey}": required object "${objKey}" not found ` +
            `in any scope for stack "${id}".`
          );
          return false;
        }
      }

      // Create enhanced params
      const enhancedParams = {
        ...params,
        __providedObjects: Object.keys(provideObjects),
      };

      // Replace
      const success = await api.go(rawKey, enhancedParams, metadata);
      if (!success) return false;

      // Register provided objects
      const current = regEntry.stack[regEntry.stack.length - 1];
      if (current) {
        Object.entries(provideObjects).forEach(([key, getter]) => {
          globalObjectRegistry.register(id, key, getter, current.uid);
        });
      }

      return true;
    },


    peek() {
      return regEntry.stack[regEntry.stack.length - 1];
    },

    getStack() {
      return regEntry.stack.slice();
    },

    length() {
      return regEntry.stack.length;
    },

    subscribe(fn) {
      regEntry.listeners.add(fn);
      try { fn(regEntry.stack.slice()); } catch (e) { }
      return () => regEntry.listeners.delete(fn);
    },

    // ============ C3: Location & deep links ============

    getLocation() {
      const path = buildUrlPath([{ navLink, stack: regEntry.stack }]);
      const top = regEntry.stack[regEntry.stack.length - 1];
      let href = '';
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          const map = parseCombinedNavParam(url.searchParams.get('nav'));
          map[id] = path;
          url.searchParams.set('nav', buildCombinedNavParam(map));
          href = url.toString();
        } catch { /* keep href = '' */ }
      }
      return { path, key: top?.key ?? null, params: top?.params, href };
    },

    async pushLocation(location) {
      // Accept: a full href with ?nav=, or a bare dotted nav path.
      let path = location;
      if (location.includes('://') || location.startsWith('/') || location.includes('?')) {
        try {
          const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
          const url = new URL(location, base);
          const navParam = url.searchParams.get('nav');
          if (navParam) {
            const map = parseCombinedNavParam(navParam);
            path = map[id] ?? Object.values(map)[0] ?? '';
          }
        } catch { /* fall through: treat input as a bare path */ }
      }

      const stacks = parseUrlPathIntoStacks(path);
      const target = stacks[0] ?? [];

      // Skip the leading segments that already match the current stack, so
      // pushing a captured location is idempotent for the shared prefix
      // (deep-linking from anywhere only pushes what's missing).
      let startIdx = 0;
      for (let i = 0; i < target.length && i < regEntry.stack.length; i++) {
        const k = decodeStackPath(navLink, target[i].code);
        if (k && regEntry.stack[i].key === k) startIdx = i + 1;
        else break;
      }

      let last: boolean | NavActionResult = { ok: false, reason: 'empty-stack' };
      for (let i = startIdx; i < target.length; i++) {
        const key = decodeStackPath(navLink, target[i].code);
        if (!key) continue;
        // Sequential pushes rebuild the missing entries in order.
        last = await api.push(key, target[i].params);
      }
      return last;
    },

    registerGuard(fn) {
      regEntry.guards.add(fn);
      return () => regEntry.guards.delete(fn);
    },

    registerMiddleware(fn) {
      regEntry.middlewares.add(fn);
      return () => regEntry.middlewares.delete(fn);
    },

    syncWithBrowserHistory(enabled) {
      regEntry.historySyncEnabled = enabled;
      if (enabled) {
        try {
          const localPath = buildUrlPath([{ navLink, stack: regEntry.stack }]);
          updateNavQueryParamForStack(id, localPath, groupContext, groupStackId);
        } catch {
          updateNavQueryParamForStack(id, buildUrlPath([{ navLink, stack: regEntry.stack }]), groupContext, groupStackId);
        }
      }
    },

    isTop(uid) {
      if (uid) {
        const top = this.peek();
        return top?.uid === uid;
      }
      const registeredUid = _currentPageUidByStack.get(id);
      if (registeredUid !== undefined) {
        return this.peek()?.uid === registeredUid;
      }
      return false;
    },

    getFullPath() {
      const allStacks: Array<{ navLink: NavigationMap, stack: StackEntry[] }> = [];
      let currentId: string | null = id;
      let currentNavLink = navLink;

      while (currentId) {
        const reg = globalRegistry.get(currentId);
        if (!reg) break;

        if (reg.historySyncEnabled) {
          allStacks.unshift({ navLink: reg.navLink || currentNavLink, stack: reg.stack });
        }

        currentId = reg.parentId;
      }

      if (allStacks.length === 0) {
        allStacks.push({ navLink: navLink, stack: regEntry.stack });
      }

      return buildUrlPath(allStacks);
    },

    getNavLink() {
      return navLink;
    },

    isActiveStack() {
      if (!regEntry.historySyncEnabled) return false;

      const childIds = Array.from(regEntry.childIds || []) as string[];
      for (const childId of childIds) {
        const childReg = globalRegistry.get(childId as string);
        if (childReg?.historySyncEnabled) return false;
      }

      return true;
    },

    isInGroup() {
      return groupContext !== null;
    },

    getGroupId() {
      return groupContext ? groupContext.getGroupId() : null;
    },

    goToGroupId(groupId: string): Promise<NavStackAPI> {
      if (!groupContext) {
        return Promise.reject(new Error(`Stack ${id} is not in a group`));
      }

      // The groupId IS the stackId - each NavigationStack in the group has a unique id
      const targetStack = globalRegistry.get(groupId);
      const targetApi = targetStack?.api;

      if (!targetApi) {
        return Promise.reject(new Error(`Stack ${groupId} not found in group`));
      }

      // Switch to the group
      return groupContext.goToGroupId(groupId).then(async (success) => {
        if (!success) {
          throw new Error(`Failed to switch to group ${groupId}`);
        }

        return targetApi;
      });
    },

    addOnCreate: (handler) => lifecycleManager.addHandler('onCreate', handler),
    addOnDispose: (handler) => lifecycleManager.addHandler('onDispose', handler),
    addOnPause: (handler) => lifecycleManager.addHandler('onPause', handler),
    addOnResume: (handler) => lifecycleManager.addHandler('onResume', handler),
    addOnEnter: (handler) => lifecycleManager.addHandler('onEnter', handler),
    addOnExit: (handler) => lifecycleManager.addHandler('onExit', handler),
    addOnBeforePush: (handler) => lifecycleManager.addHandler('onBeforePush', handler),
    addOnAfterPush: (handler) => lifecycleManager.addHandler('onAfterPush', handler),
    addOnBeforePop: (handler) => lifecycleManager.addHandler('onBeforePop', handler),
    addOnAfterPop: (handler) => lifecycleManager.addHandler('onAfterPop', handler),
    addOnBeforeReplace: (handler) => lifecycleManager.addHandler('onBeforeReplace', handler),
    addOnAfterReplace: (handler) => lifecycleManager.addHandler('onAfterReplace', handler),

    clearAllLifecycleHandlers: (hook) => lifecycleManager.clear(hook),
    getLifecycleHandlers: (hook) => lifecycleManager.getHandlers(hook),
    _getLifecycleManager: () => lifecycleManager,

    dispose() {

      globalObjectRegistry.clearStack(id);

      lifecycleManager.trigger('onDispose', {
        stack: regEntry.stack.slice(),
        current: regEntry.stack[regEntry.stack.length - 1]
      });

      lifecycleManager.dispose();
      transitionManager.dispose();
      memoryManager.dispose();
      regEntry.listeners.clear();
      regEntry.guards.clear();
      regEntry.middlewares.clear();

      try {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(storageKeyFor(id));
        }
      } catch (e) {
        console.warn(`Failed to clear persisted storage for stack ${id}:`, e);
      }

      if (regEntry.parentId) {
        const parentReg = globalRegistry.get(regEntry.parentId);
        if (parentReg) {
          parentReg.childIds.delete(id);
        }
      }

      regEntry.childIds?.forEach((childId: string) => {
        const childReg = globalRegistry.get(childId as string);
        if (childReg) {
          childReg.parentId = null;
        }
      });

      try {
        updateNavQueryParamForStack(id, null, groupContext, groupStackId);
      } catch { }

      globalRegistry.delete(id);
    },

    clearAllPersistedStacks() {
      if (typeof window === "undefined") return;

      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('navstack:')) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Failed to clear all persisted stacks:', e);
      }
    }
  };

  // Helper to check object existence across all scopes
  function objectExistsInAnyScope(key: string): boolean {
    return (
      globalObjectRegistry.hasWithOptions(id, key, { isGlobal: true }) ||
      globalObjectRegistry.hasWithOptions(id, key, { isGlobal: true, scopeId: undefined }) ||
      globalObjectRegistry.hasWithOptions(id, key, {})
    );
  }

  // Attach helper to API for use in methods
  (api as any).objectExistsInAnyScope = objectExistsInAnyScope;

  regEntry.api = api;
  (api as any).lifecycleManager = lifecycleManager;
  return api;
}
