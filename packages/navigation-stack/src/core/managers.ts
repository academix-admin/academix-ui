import type { AsyncLifecycleHandler, LifecycleHandler, LifecycleHook, NavParams, StackEntry } from '../types';
import { MEMORY_CACHE_EXPIRY, MEMORY_CACHE_SIZE } from '../constants';
// Transition / page-memory / lifecycle managers.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export class TransitionManager {
  private activeTransitions = new Map<string, any>();
  private completedTransitions = new Set<string>();
  private interruptSignals = new Map<string, { interrupted: boolean; reason?: string }>();
  private onError: ((error: Error, uid: string) => void) | null = null;

  start(uid: string, duration: number, onComplete: () => void, onError?: (error: Error) => void) {
    // Cancel any existing transition for this uid
    this.cancel(uid);
    this.interruptSignals.delete(uid);

    const timer = setTimeout(() => {
      try {
        const signal = this.interruptSignals.get(uid);

        if (signal?.interrupted) {
          // Transition was interrupted, skip completion
          console.debug(`Transition ${uid} was interrupted: ${signal.reason || 'unknown reason'}`);
        } else {
          this.activeTransitions.delete(uid);
          this.completedTransitions.add(uid);
          onComplete();
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`Error completing transition ${uid}:`, err);
        if (onError) {
          try { onError(err); } catch (e) { console.error("onError callback failed:", e); }
        }
        if (this.onError) {
          try { this.onError(err, uid); } catch (e) { console.error("Global onError handler failed:", e); }
        }
      }
    }, duration) as any;

    this.activeTransitions.set(uid, timer);
  }

  /**
   * Cancel a transition and optionally interrupt ongoing completions
   */
  cancel(uid: string, reason?: string) {
    const timer = this.activeTransitions.get(uid);
    if (timer) {
      clearTimeout(timer);
      this.activeTransitions.delete(uid);

      // Mark as interrupted if reason provided
      if (reason) {
        this.interruptSignals.set(uid, { interrupted: true, reason });
      }
    }
  }

  /**
   * Interrupt a transition that's currently completing
   */
  interrupt(uid: string, reason?: string) {
    this.interruptSignals.set(uid, { interrupted: true, reason });
    this.cancel(uid, reason);
  }

  isComplete(uid: string): boolean {
    return this.completedTransitions.has(uid);
  }

  isInterrupted(uid: string): boolean {
    const signal = this.interruptSignals.get(uid);
    return signal?.interrupted || false;
  }

  /**
   * Set global error handler for all transitions
   */
  setErrorHandler(handler: ((error: Error, uid: string) => void) | null) {
    this.onError = handler;
  }

  /**
   * Get active transition count for monitoring
   */
  getActiveCount(): number {
    return this.activeTransitions.size;
  }

  /**
   * Wait for all active transitions to complete or be interrupted
   */
  awaitAllComplete(timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeTransitions.size === 0) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const completedPromises: Promise<void>[] = [];

      // Create a promise for each active transition
      for (const uid of this.activeTransitions.keys()) {
        const transitionPromise = new Promise<void>((transitionResolve) => {
          const checkTransition = () => {
            // Transition completed or was interrupted
            if (!this.activeTransitions.has(uid) ||
              this.completedTransitions.has(uid) ||
              this.isInterrupted(uid)) {
              transitionResolve();
              return;
            }

            // Timeout check
            if (Date.now() - startTime > timeoutMs) {
              this.interrupt(uid, 'timeout');
              transitionResolve();
              return;
            }

            // Still waiting, check again
            setTimeout(checkTransition, 10);
          };
          checkTransition();
        });
        completedPromises.push(transitionPromise);
      }

      // Wait for all transition promises to resolve
      Promise.all(completedPromises).then(() => {
        resolve();
      });
    });
  }

  dispose() {
    // Interrupt all active transitions before cleanup
    const uids = Array.from(this.activeTransitions.keys());
    uids.forEach(uid => this.interrupt(uid, 'disposal'));

    this.activeTransitions.forEach(timer => clearTimeout(timer));
    this.activeTransitions.clear();
    this.completedTransitions.clear();
    this.interruptSignals.clear();
    this.onError = null;
  }
}

// ==================== Page Memory Manager ====================
export class PageMemoryManager {
  private cache = new Map<string, {
    element: ReactNode;
    params: NavParams;
    lastActive: number;
  }>();

  getMeta(uid: string): { params: NavParams } | undefined {
    const entry = this.cache.get(uid);
    return entry ? { params: entry.params } : undefined;
  }

  get(uid: string): ReactNode | undefined {
    const entry = this.cache.get(uid);
    if (entry) {
      entry.lastActive = Date.now();
      return entry.element;
    }
    return undefined;
  }

  set(uid: string, element: ReactNode, params: NavParams = {}) {
    this.cleanup();
    this.cache.set(uid, {
      element,
      params,
      lastActive: Date.now()
    });
  }

  delete(uid: string) {
    this.cache.delete(uid);
  }

  private cleanup() {
    if (this.cache.size >= MEMORY_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastActive - b[1].lastActive);

      for (let i = 0; i < entries.length - MEMORY_CACHE_SIZE + 1; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.lastActive > MEMORY_CACHE_EXPIRY) {
        this.cache.delete(key);
      }
    });
  }

  dispose() {
    this.cache.clear();
  }
}

// ==================== Enhanced Lifecycle Manager ====================
export class EnhancedLifecycleManager {
  private handlers: Map<LifecycleHook, Set<LifecycleHandler | AsyncLifecycleHandler>>;
  private stackId: string;
  private cleanupCallbacks: (() => void)[] = [];

  constructor(stackId: string) {
    this.stackId = stackId;
    this.handlers = new Map();

    // Initialize all lifecycle hooks
    const hooks: LifecycleHook[] = [
      'onCreate', 'onDispose', 'onPause', 'onResume',
      'onEnter', 'onExit', 'onBeforePush', 'onAfterPush',
      'onBeforePop', 'onAfterPop', 'onBeforeReplace', 'onAfterReplace'
    ];

    hooks.forEach(hook => {
      this.handlers.set(hook, new Set());
    });
  }

  // Add app state tracking
  enableAppStateTracking(getCurrentContext: () => { stack: StackEntry[]; current?: StackEntry }) {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const context = getCurrentContext();
      if (document.hidden) {
        this.trigger('onPause', context);
      } else {
        this.trigger('onResume', context);
      }
    };

    const handlePageHide = () => {
      const context = getCurrentContext();
      this.trigger('onPause', context);
    };

    const handlePageShow = () => {
      const context = getCurrentContext();
      this.trigger('onResume', context);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };

    this.cleanupCallbacks.push(cleanup);
    return cleanup;
  }

  addHandler(hook: LifecycleHook, handler: LifecycleHandler | AsyncLifecycleHandler): () => void {
    const hookHandlers = this.handlers.get(hook);
    if (hookHandlers) {
      hookHandlers.add(handler);
      return () => hookHandlers.delete(handler);
    }
    return () => { };
  }

  async trigger(hook: LifecycleHook, context: any): Promise<void> {
    const hookHandlers = this.handlers.get(hook);
    if (!hookHandlers) return;

    const handlers = Array.from(hookHandlers);

    // For async handlers (onBefore* hooks), wait for all to complete
    if (hook.startsWith('onBefore')) {
      for (const handler of handlers) {
        await (handler as AsyncLifecycleHandler)(context);
      }
    } else {
      // For sync handlers, run in parallel but don't wait
      handlers.forEach(handler => {
        try {
          (handler as LifecycleHandler)(context);
        } catch (error) {
          console.warn(`Lifecycle handler for ${hook} threw:`, error);
        }
      });
    }
  }

  getHandlers(hook: LifecycleHook): LifecycleHandler[] {
    const hookHandlers = this.handlers.get(hook);
    return hookHandlers ? Array.from(hookHandlers) as LifecycleHandler[] : [];
  }

  clear(hook?: LifecycleHook) {
    if (hook) {
      this.handlers.get(hook)?.clear();
    } else {
      this.handlers.forEach(handlers => handlers.clear());
    }
  }

  dispose() {
    this.cleanupCallbacks.forEach(cleanup => cleanup());
    this.cleanupCallbacks = [];
    this.clear();
    this.handlers.clear();
  }
}

