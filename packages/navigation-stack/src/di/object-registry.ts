// Cross-page dependency-injection registry.
import type { ComponentType, ReactNode, ReactElement } from 'react';

export type ObjectMetadata = {
  scopeId?: string;
  description?: string;
  isStackScoped?: boolean;
  isGlobal?: boolean;
  originalKey?: string;
  createdAt?: number; // For memory leak detection
};

export class ObjectReferenceRegistry {
  // Format: "stackId[:scopeId]:key" or "global:key"
  private getters = new Map<string, () => any>();
  private metadata = new Map<string, ObjectMetadata>();
  // Callbacks waiting for a getter to be provided
  private waitingCallbacks = new Map<string, Set<() => void>>();

  // Request/Response pattern support
  private requestHandlers = new Map<string, (request: any) => any | Promise<any>>();
  private waitingRequestHandlers = new Map<string, Set<() => void>>();

  // Memory management
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly CLEANUP_TIMEOUT = 1000 * 60 * 10; // 10 minutes

  // Backward Compatible Methods

  // Register a getter function for an object (backward compatible)
  register<T>(
    stackId: string,
    key: string,
    getter: () => T,
    scopeId?: string
  ): () => void {
    return this.registerWithOptions(stackId, key, getter, {
      scopeId,
      isGlobal: false
    });
  }

  // Unregister a getter (backward compatible)
  unregister(stackId: string, key: string): void {
    // Try to find the key with various formats
    const possibleKeys = [
      `${stackId}:${key}`,                    // Page scope
      `global:${key}`,                        // Global scope
    ];

    for (const possibleKey of possibleKeys) {
      if (this.getters.has(possibleKey)) {
        this.getters.delete(possibleKey);
        this.metadata.delete(possibleKey);
        return;
      }
    }

    // Also search through metadata for stack-scoped keys
    const prefix = `${stackId}:`;
    for (const [fullKey, meta] of this.metadata.entries()) {
      if (fullKey.startsWith(prefix) && meta.originalKey === key) {
        this.getters.delete(fullKey);
        this.metadata.delete(fullKey);
        return;
      }
    }
  }

  // Get the current object instance (backward compatible)
  get<T>(stackId: string, key: string): T | undefined {

    return this.getWithOptions<T>(stackId, key, {});
  }

  // Check if a getter is registered (backward compatible)
  hasGetter(stackId: string, key: string): boolean {
    return this.hasWithOptions(stackId, key, {});
  }

  // Get all registered keys for a stack (backward compatible)
  getRegisteredKeys(stackId: string): string[] {
    const keys: string[] = [];
    const prefix = `${stackId}:`;

    for (const [key, meta] of this.metadata.entries()) {
      // Include keys for this stack OR global keys
      if (key.startsWith(prefix) || meta.isGlobal) {
        const originalKey = meta.originalKey || this.extractOriginalKey(key);
        if (originalKey && !keys.includes(originalKey)) {
          keys.push(originalKey);
        }
      }
    }

    return keys;
  }

  // Clear all getters for a specific scope (backward compatible)
  clearScope(stackId: string, scopeId: string): void {
    const keysToRemove: string[] = [];

    for (const [key, meta] of this.metadata.entries()) {
      // Match both old format (stackId:scopeId:key) and new format (scopeId:key)
      if ((key.startsWith(`${stackId}:`) && meta.scopeId === scopeId) ||
          (key.startsWith(`${scopeId}:`) && meta.scopeId === scopeId)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      this.getters.delete(key);
      this.metadata.delete(key);
    });
  }

  // Clear all getters for a stack (backward compatible)
  clearStack(stackId: string): void {
    const keysToRemove: string[] = [];

    for (const key of this.getters.keys()) {
      if (key.startsWith(`${stackId}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      this.getters.delete(key);
      this.metadata.delete(key);
      this.waitingCallbacks.delete(key);
      this.requestHandlers.delete(key);
      this.waitingRequestHandlers.delete(key);
    });
  }

  // Clear everything (backward compatible)
  clearAll(): void {
    this.getters.clear();
    this.metadata.clear();
    this.waitingCallbacks.clear();
    this.requestHandlers.clear();
    this.waitingRequestHandlers.clear();
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.cleanupTimers.clear();
  }

  // ============ Memory Management & Cleanup ============

  /**
   * Schedule auto-cleanup for a getter to prevent memory leaks
   * Useful for page-scoped or temporary getters
   */
  scheduleCleanup(fullKey: string, timeoutMs?: number): void {
    // Clear any existing timer
    const existingTimer = this.cleanupTimers.get(fullKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timeout = timeoutMs || this.CLEANUP_TIMEOUT;
    const timer = setTimeout(() => {
      if (this.getters.has(fullKey)) {
        this.getters.delete(fullKey);
        this.metadata.delete(fullKey);
        this.waitingCallbacks.delete(fullKey);
        this.requestHandlers.delete(fullKey);
        this.waitingRequestHandlers.delete(fullKey);
      }
      this.cleanupTimers.delete(fullKey);
    }, timeout);

    this.cleanupTimers.set(fullKey, timer);
  }

  /**
   * Cancel scheduled cleanup for a getter
   */
  cancelCleanup(fullKey: string): void {
    const timer = this.cleanupTimers.get(fullKey);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(fullKey);
    }
  }

  /**
   * Get memory stats for debugging
   */
  getMemoryStats(): {
    gettersCount: number;
    callbacksCount: number;
    handlersCount: number;
    pendingCleanups: number;
  } {
    let callbacksCount = 0;
    let handlersCount = 0;

    this.waitingCallbacks.forEach(set => {
      callbacksCount += set.size;
    });

    this.waitingRequestHandlers.forEach(set => {
      handlersCount += set.size;
    });

    return {
      gettersCount: this.getters.size,
      callbacksCount,
      handlersCount,
      pendingCleanups: this.cleanupTimers.size
    };
  }

  // ============ Enhanced Methods ============

  // Enhanced register with options
  // Priority: global > custom scope > page scope (default with stackId)
  registerWithOptions<T>(
    stackId: string,
    key: string,
    getter: () => T | Promise<T>,
    options?: {
      scopeId?: string;
      isGlobal?: boolean;
      description?: string;
    }
  ): () => void {
    const {
      scopeId,
      isGlobal = false,
      description
    } = options || {};

    let finalKey: string;
    let finalScopeId: string | undefined;

    // Priority: global wins over all
    if (isGlobal) {
      if (scopeId) {
        // Global with custom scope: global:scopeId:key
        finalKey = `global:${scopeId}:${key}`;
        finalScopeId = scopeId;
      } else {
        // Global without scope: global:key
        finalKey = `global:${key}`;
        finalScopeId = 'global';
      }
    } else if (typeof scopeId === 'string' && scopeId) {
      // Custom scope (not global): scopeId:key
      finalKey = `${scopeId}:${key}`;
      finalScopeId = scopeId;
    } else {
      // Default to page scope with stackId: stackId:key
      finalKey = `${stackId}:${key}`;
      finalScopeId = undefined;
    }

    // Register the getter
    this.getters.set(finalKey, getter);
    this.metadata.set(finalKey, {
      scopeId: finalScopeId,
      description: description || `Object ${key}`,
      isStackScoped: false, // Deprecated, always false now
      isGlobal,
      originalKey: key
    });

    // Notify all callbacks waiting for this getter
    const callbacks = this.waitingCallbacks.get(finalKey);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (err) {
          console.error(`[Registry.registerWithOptions] Callback error:`, err);
        }
      });
      this.waitingCallbacks.delete(finalKey);
    }

    return () => {
      this.unregisterByKey(finalKey);
    };
  }

  // Enhanced get with options - returns object or promise, along with pattern key for subscription
  getWithOptionsAndKey<T>(
    stackId: string,
    key: string,
    options?: {
      scopeId?: string;
      isGlobal?: boolean;
    }
  ): { value: T | Promise<T> | undefined; patternKey: string | null } {
    const {
      scopeId,
      isGlobal = false
    } = options || {};

    // Build search patterns in order of priority
    const searchPatterns: string[] = [];

    if (isGlobal) {
      if (scopeId) {
        // Global with custom scope
        searchPatterns.push(`global:${scopeId}:${key}`);
      } else {
        // Global without scope
        searchPatterns.push(`global:${key}`);
      }
    }

    if (scopeId && !isGlobal) {
      // Custom scope (not global) - NO stackId prefix
      searchPatterns.push(`${scopeId}:${key}`);
    }

    // Page scope (default fallback) - includes stackId
    if (!isGlobal) {
      searchPatterns.push(`${stackId}:${key}`);
    }

    // Try each pattern in order
    for (const pattern of searchPatterns) {
      // If getter exists, return it
      const getter = this.getters.get(pattern);
      if (getter) {
        return { value: getter as any, patternKey: pattern };
      }
    }

    return { value: undefined, patternKey: null };
  }

  // Original getWithOptions for backward compatibility
  getWithOptions<T>(
    stackId: string,
    key: string,
    options?: {
      scopeId?: string;
      isGlobal?: boolean;
    }
  ): T | undefined {
    const result = this.getWithOptionsAndKey<T>(stackId, key, options);
    return result.value as T | undefined;
  }

  // Enhanced check if object exists
  hasWithOptions(
    stackId: string,
    key: string,
    options?: {
      scopeId?: string;
      isGlobal?: boolean;
    }
  ): boolean {
    const {
      scopeId,
      isGlobal = false
    } = options || {};

    // Build search patterns
    const searchPatterns: string[] = [];

    if (isGlobal) {
      if (scopeId) {
        // Global with custom scope
        searchPatterns.push(`global:${scopeId}:${key}`);
      } else {
        // Global without scope
        searchPatterns.push(`global:${key}`);
      }
    }

    if (scopeId && !isGlobal) {
      // Custom scope (not global) - NO stackId prefix
      searchPatterns.push(`${scopeId}:${key}`);
    }

    // Page scope (default) - includes stackId
    if (!isGlobal) {
      searchPatterns.push(`${stackId}:${key}`);
    }

    // Check if any pattern exists
    return searchPatterns.some(pattern => this.getters.has(pattern));
  }

  // ============ Utility Methods ============

  // Get all objects with detailed info (for debugging)
  debugAll(): Array<{
    key: string;
    fullKey: string;
    scopeId: string;
    isGlobal: boolean;
    isStackScoped: boolean;
    stackId: string;
    description?: string;
  }> {
    const result = [];

    for (const [fullKey, meta] of this.metadata.entries()) {
      const parts = fullKey.split(':');
      let stackId = '';
      let originalKey = '';

      if (meta.isGlobal) {
        stackId = 'global';
        originalKey = meta.originalKey || parts[1] || fullKey;
      } else if (meta.isStackScoped) {
        stackId = parts[0] || 'unknown';
        originalKey = meta.originalKey || parts[1] || fullKey;
      } else if (meta.scopeId && meta.scopeId !== parts[0]) {
        // Has custom scope
        stackId = parts[0] || 'unknown';
        originalKey = meta.originalKey || parts[2] || fullKey;
      } else {
        // Page scope
        stackId = parts[0] || 'unknown';
        originalKey = meta.originalKey || parts[1] || fullKey;
      }

      result.push({
        key: originalKey,
        fullKey,
        scopeId: meta.scopeId || 'page',
        isGlobal: meta.isGlobal || false,
        isStackScoped: meta.isStackScoped || false,
        stackId,
        description: meta.description
      });
    }

    return result;
  }

  // Get objects by scope
  getByScope(stackId: string, scopeId: string): Array<{
    key: string;
    getter: () => any;
  }> {
    const result = [];
    const prefix = `${stackId}:${scopeId}:`;

    for (const [key, getter] of this.getters.entries()) {
      if (key.startsWith(prefix)) {
        const meta = this.metadata.get(key);
        result.push({
          key: meta?.originalKey || key.slice(prefix.length),
          getter
        });
      }
    }

    return result;
  }

  // Get global objects
  getGlobalObjects(): Array<{
    key: string;
    getter: () => any;
  }> {
    const result = [];

    for (const [key, getter] of this.getters.entries()) {
      if (key.startsWith('global:')) {
        const meta = this.metadata.get(key);
        result.push({
          key: meta?.originalKey || key.slice(7), // Remove 'global:'
          getter
        });
      }
    }

    return result;
  }

  // Get stack-scoped objects
  getStackScopedObjects(stackId: string): Array<{
    key: string;
    getter: () => any;
  }> {
    const result = [];

    for (const [key, getter] of this.getters.entries()) {
      if (key.startsWith(`${stackId}:`)) {
        const meta = this.metadata.get(key);
        if (meta?.isStackScoped) {
          result.push({
            key: meta.originalKey || key.slice(stackId.length + 1),
            getter
          });
        }
      }
    }

    return result;
  }

  // ============ Private Helper Methods ============

  private unregisterByKey(fullKey: string): void {
    this.getters.delete(fullKey);
    this.metadata.delete(fullKey);
    this.waitingCallbacks.delete(fullKey);
  }

  private extractOriginalKey(fullKey: string): string {
    const parts = fullKey.split(':');
    if (parts[0] === 'global') {
      return parts.slice(1).join(':');
    }
    return parts.slice(-1)[0];
  }

  // Subscribe to getter registration - called when a new getter is registered
  onGetterRegistered(fullKey: string, callback: () => void): () => void {
    // If getter already exists, call immediately
    if (this.getters.has(fullKey)) {
      try {
        callback();
      } catch (err) {
        console.error(`[Registry.onGetterRegistered] Callback error:`, err);
      }
      return () => { }; // No-op unsubscribe
    }

    // Otherwise, save callback for when getter is registered
    if (!this.waitingCallbacks.has(fullKey)) {
      this.waitingCallbacks.set(fullKey, new Set());
    }
    this.waitingCallbacks.get(fullKey)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.waitingCallbacks.get(fullKey);
      if (callbacks) {
        callbacks.delete(callback);
        // Clean up empty callback set immediately
        if (callbacks.size === 0) {
          this.waitingCallbacks.delete(fullKey);
        }
      }
      // Also perform periodic cleanup of any empty sets
      this.cleanupEmptyCallbackSets();
    };
  }

  /**
   * Clean up any empty callback sets from waitingCallbacks
   * Called automatically after callback removal to prevent memory accumulation
   */
  private cleanupEmptyCallbackSets(): void {
    for (const [key, callbacks] of this.waitingCallbacks.entries()) {
      if (callbacks.size === 0) {
        this.waitingCallbacks.delete(key);
      }
    }
  }

  // ============ Request/Response Pattern (Optional) ============

  /**
   * Register a request handler for a specific key
   * Provider side: handles requests from consumers
   */
  registerRequestHandler(
    fullKey: string,
    handler: (request: any) => any | Promise<any>
  ): () => void {
    this.requestHandlers.set(fullKey, handler);

    // Notify waiting consumers
    const callbacks = this.waitingRequestHandlers.get(fullKey);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (err) {
          console.error(`[Registry.registerRequestHandler] Callback error:`, err);
        }
      });
      this.waitingRequestHandlers.delete(fullKey);
    }

    return () => {
      this.requestHandlers.delete(fullKey);
    };
  }

  /**
   * Send a request and wait for response
   * Consumer side: sends request to provider and waits for response
   */
  async sendRequest<TRequest = any, TResponse = any>(
    fullKey: string,
    request: TRequest
  ): Promise<TResponse> {
    const handler = this.requestHandlers.get(fullKey);
    if (!handler) {
      throw new Error(`No request handler registered for key: ${fullKey}`);
    }

    try {
      const response = await handler(request);
      return response as TResponse;
    } catch (error) {
      console.error(`[Registry.sendRequest] Error in handler for "${fullKey}":`, error);
      throw error;
    }
  }

  /**
   * Subscribe to request handler registration
   * Consumer side: waits for provider to register handler
   */
  onRequestHandlerRegistered(fullKey: string, callback: () => void): () => void {
    // If handler already exists, call immediately
    if (this.requestHandlers.has(fullKey)) {
      try {
        callback();
      } catch (err) {
        console.error(`[Registry.onRequestHandlerRegistered] Callback error:`, err);
      }
      return () => { }; // No-op unsubscribe
    }

    // Otherwise, save callback for when handler is registered
    if (!this.waitingRequestHandlers.has(fullKey)) {
      this.waitingRequestHandlers.set(fullKey, new Set());
    }
    this.waitingRequestHandlers.get(fullKey)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.waitingRequestHandlers.get(fullKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.waitingRequestHandlers.delete(fullKey);
        }
      }
    };
  }

  has(stackId: string, key: string): boolean {
    return this.hasWithOptions(stackId, key, {});
  }
}

// Global instance (maintains same export)
export const globalObjectRegistry = new ObjectReferenceRegistry();
