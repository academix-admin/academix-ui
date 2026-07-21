// StateStackCore — the reactive store engine: hydration, persistence, cross-tab sync, history.

import { INTERNAL_SEPARATOR, BROADCAST_CHANNEL_NAME } from '../constants';
import { safeClone } from '../utils';
import type { BroadcastMessage, StorageAdapter, Subscriber } from '../types';
import { _globalConfig, getDefaultStorage } from '../config';

export class StateStackCore {
  // ── Singleton ─────────────────────────────────────────────────────────────

  private static _instance: StateStackCore | null = null;
  private static _listenerAttached = false;

  static get instance(): StateStackCore {
    if (!this._instance) {
      this._instance = new StateStackCore();
    }
    // Lazy attach: only call after initStateStack has had a chance to run
    if (!this._listenerAttached && _globalConfig.crossTabSync) {
      this._instance.attachStorageListener();
      this._listenerAttached = true;
    }
    return this._instance;
  }

  // ── Per-tab identity ──────────────────────────────────────────────────────
  //
  // Every BroadcastChannel message is stamped with this id.
  // The receiver drops any message whose tabId matches its own,
  // preventing the infinite loop:
  //   setState → broadcastStateChange → onmessage → setState → …

  private readonly tabId: string =
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // ── Internal state ────────────────────────────────────────────────────────

  private stacks = new Map<string, Map<string, unknown>>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private subscribers = new Map<string, Set<Subscriber>>();
  private history = new Map<
    string,
    { past: unknown[]; future: unknown[]; maxDepth: number }
  >();
  private pendingUpdates = new Map<string, Promise<unknown>>();
  private scopeSubscriberCounts = new Map<string, number>();
  private autoClearScopes = new Set<string>();
  private storageEventListenerAttached = false;
  private broadcastChannel?: BroadcastChannel;
  private broadcastChannelFailed = false;

  private hydratedKeys = new Set<string>();
  private loadedKeys = new Set<string>();
  private pendingHydration = new Map<string, Promise<boolean>>();
  private hydrationSubscribers = new Map<string, Set<Subscriber>>();

  private demandedKeys = new Set<string>();
  private pendingDemandOperations = new Map<string, Promise<void>>();

  // ── Logging ───────────────────────────────────────────────────────────────

  private debugLog(...args: unknown[]) {
    // Disabled in production and reduced in development
    if (_globalConfig.debug && typeof window !== 'undefined') {
      // Only log critical events, not broadcasts
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes('Broadcasted:')) {
        return; // Skip broadcast logs
      }
      console.debug('[StateStack]', ...args);
    }
  }

  // ── Key helpers ───────────────────────────────────────────────────────────

  private storageKey(scope: string, key: string): string {
    const prefix = _globalConfig.storagePrefix
      ? `${_globalConfig.storagePrefix}:`
      : '';
    return `${prefix}${scope}${INTERNAL_SEPARATOR}${key}`;
  }

  private subKey(scope: string, key: string): string {
    return `${scope}${INTERNAL_SEPARATOR}${key}`;
  }

  private parseSubKey(sk: string): [string, string] {
    const idx = sk.indexOf(INTERNAL_SEPARATOR);
    if (idx === -1) return ['', sk];
    return [sk.slice(0, idx), sk.slice(idx + INTERNAL_SEPARATOR.length)];
  }

  // ── Hydration ─────────────────────────────────────────────────────────────

  async ensureHydrated(
    scope: string,
    key: string,
    initial: unknown,
    persist: boolean,
    storage: StorageAdapter
  ): Promise<boolean> {
    const ik = this.subKey(scope, key);

    if (!persist) {
      this.hydratedKeys.add(ik);
      this.loadedKeys.add(ik);
      return false;
    }

    if (this.hydratedKeys.has(ik)) return false;

    if (this.pendingHydration.has(ik)) {
      return this.pendingHydration.get(ik)!;
    }

    const p = (async (): Promise<boolean> => {
      try {
        const sk = this.storageKey(scope, key);
        const stored = await storage.getItem(sk);

        if (stored != null) {
          try {
            const parsed = JSON.parse(stored);
            if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
            this.stacks.get(scope)!.set(key, parsed);
            this.hydratedKeys.add(ik);
            this.loadedKeys.add(ik);
            this.notifyHydration(scope, key);
            return true;
          } catch (err) {
            console.warn('[StateStack] failed to parse persisted JSON:', err);
          }
        } else {
          // Legacy key format fallback (old separator was ":")
          const prefix = _globalConfig.storagePrefix
            ? `${_globalConfig.storagePrefix}:`
            : '';
          const legacyKey = `${prefix}${scope}:${key}`;
          try {
            const legacyStored = await storage.getItem(legacyKey);
            if (legacyStored != null) {
              const parsed = JSON.parse(legacyStored);
              if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
              this.stacks.get(scope)!.set(key, parsed);
              this.hydratedKeys.add(ik);
              this.loadedKeys.add(ik);
              this.notifyHydration(scope, key);
              return true;
            }
          } catch (err) {
            console.warn('[StateStack] legacy persist parse failed:', err);
          }
        }

        this.hydratedKeys.add(ik);
        this.loadedKeys.add(ik);
        this.notifyHydration(scope, key);
        return false;
      } catch (err) {
        console.error('[StateStack] hydrate error:', err);
        this.hydratedKeys.add(ik);
        this.loadedKeys.add(ik);
        this.notifyHydration(scope, key);
        return false;
      } finally {
        this.pendingHydration.delete(ik);
      }
    })();

    this.pendingHydration.set(ik, p);
    return p;
  }

  // ── Sync state access (useSyncExternalStore snapshot) ────────────────────

  getStateSync<S>(scope: string, key: string, initial: S): S {
    if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
    const m = this.stacks.get(scope)!;
    if (!m.has(key)) m.set(key, safeClone(initial));
    return m.get(key) as S;
  }

  // ── Async state access ────────────────────────────────────────────────────

  async getState<S>(
    scope: string,
    key: string,
    initial: S,
    persist: boolean,
    storage: StorageAdapter
  ): Promise<S> {
    const ik = this.subKey(scope, key);
    return this.queueUpdate(ik, async () => {
      await this.ensureHydrated(scope, key, initial, persist, storage);
      return this.getStateSync(scope, key, initial);
    });
  }

  // ── Update serialisation ──────────────────────────────────────────────────

  /**
   * Chains async operations per-key so concurrent calls are serialised
   * rather than deduplicated (which would silently drop updates).
   */
  private async queueUpdate<S>(
    key: string,
    fn: () => Promise<S>
  ): Promise<S> {
    const existing = this.pendingUpdates.get(key);

    const next = (async () => {
      if (existing) {
        try { await existing; } catch { /* previous error already logged */ }
      }
      return fn();
    })();

    this.pendingUpdates.set(key, next);

    try {
      return await next;
    } catch (err) {
      console.error('[StateStack] queue update error:', err);
      throw err;
    } finally {
      if (this.pendingUpdates.get(key) === next) {
        this.pendingUpdates.delete(key);
      }
    }
  }

  // ── setState ──────────────────────────────────────────────────────────────

  async setState<S>(
    scope: string,
    key: string,
    value: S,
    persist: boolean,
    storage: StorageAdapter,
    pushHistory = true
  ): Promise<S> {
    const ik = this.subKey(scope, key);

    return this.queueUpdate(ik, async () => {
      if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
      const sm = this.stacks.get(scope)!;
      const prev = sm.get(key);

      // Mark not-hydrated during the write so concurrent reads wait.
      if (persist) this.hydratedKeys.delete(ik);

      if (persist) {
        try {
          await storage.setItem(
            this.storageKey(scope, key),
            JSON.stringify(value)
          );
          // Notify other tabs — stamps our tabId so we ignore our own echo.
          this.broadcastStateChange(scope, key, value);
        } catch (err) {
          console.error('[StateStack] persist error:', err);
        }
      }

      if (pushHistory) {
        if (!this.history.has(ik)) {
          this.history.set(ik, { past: [], future: [], maxDepth: 50 });
        }
        const h = this.history.get(ik)!;
        h.past.push(prev === undefined ? null : safeClone(prev));
        if (h.past.length > h.maxDepth) h.past.shift();
        h.future = [];
      }

      sm.set(key, safeClone(value));
      this.loadedKeys.add(ik);

      if (persist) {
        this.hydratedKeys.add(ik);
        this.notifyHydration(scope, key);
      }

      this.notify(scope, key);
      return value;
    });
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  subscribe(scope: string, key: string, fn: Subscriber): () => void {
    const k = this.subKey(scope, key);
    if (!this.subscribers.has(k)) this.subscribers.set(k, new Set());
    this.subscribers.get(k)!.add(fn);
    this.incrementScopeCount(scope);

    let unsubbed = false;
    return () => {
      if (unsubbed) return;
      unsubbed = true;
      const s = this.subscribers.get(k);
      if (s) {
        s.delete(fn);
        if (s.size === 0) this.subscribers.delete(k);
      }
      this.decrementScopeCount(scope);
    };
  }

  private incrementScopeCount(scope: string) {
    this.scopeSubscriberCounts.set(
      scope,
      (this.scopeSubscriberCounts.get(scope) ?? 0) + 1
    );
  }

  private decrementScopeCount(scope: string) {
    const next = Math.max(
      0,
      (this.scopeSubscriberCounts.get(scope) ?? 0) - 1
    );
    this.scopeSubscriberCounts.set(scope, next);
    if (next === 0 && this.autoClearScopes.has(scope)) {
      this.clearScope(scope);
      this.autoClearScopes.delete(scope);
    }
  }

  enableAutoClearOnZero(scope: string) {
    this.autoClearScopes.add(scope);
  }

  disableAutoClearOnZero(scope: string) {
    this.autoClearScopes.delete(scope);
  }

  notify(scope: string, key: string) {
    const k = this.subKey(scope, key);
    const s = this.subscribers.get(k);
    if (!s) return;
    queueMicrotask(() => {
      for (const fn of Array.from(s)) {
        try { fn(); } catch (err) {
          console.error('[StateStack] subscriber error:', err);
        }
      }
    });
  }

  // ── TTL ───────────────────────────────────────────────────────────────────

  setTTL(scope: string, key: string, ttlSeconds?: number) {
    const tk = this.subKey(scope, key);
    if (this.timers.has(tk)) {
      clearTimeout(this.timers.get(tk)!);
      this.timers.delete(tk);
    }
    if (!ttlSeconds || ttlSeconds <= 0) return;

    const t = setTimeout(async () => {
      try {
        this.hydratedKeys.delete(tk);
        this.loadedKeys.delete(tk);
        this.demandedKeys.delete(tk);
        this.notifyHydration(scope, key);

        this.stacks.get(scope)?.delete(key);
        if (this.history.has(tk)) this.history.delete(tk);

        try {
          const storage = getDefaultStorage();
          await storage.removeItem(this.storageKey(scope, key));
        } catch (err) {
          console.error('[StateStack] TTL persist remove error:', err);
        }
      } finally {
        this.timers.delete(tk);
        this.notify(scope, key);
      }
    }, ttlSeconds * 1000);

    this.timers.set(tk, t);
  }

  // ── Clear helpers ─────────────────────────────────────────────────────────

  async clearScope(scope: string, removePersist = true) {
    const sm = this.stacks.get(scope);
    const storage = getDefaultStorage();

    if (sm) {
      for (const key of Array.from(sm.keys())) {
        const ik = this.subKey(scope, key);

        this.hydratedKeys.delete(ik);
        this.loadedKeys.delete(ik);
        this.demandedKeys.delete(ik);
        this.notifyHydration(scope, key);
        this.hydrationSubscribers.delete(ik);
        sm.delete(key);
        this.notify(scope, key);

        if (this.timers.has(ik)) {
          clearTimeout(this.timers.get(ik)!);
          this.timers.delete(ik);
        }
        if (this.history.has(ik)) this.history.delete(ik);

        if (removePersist) {
          try {
            await storage.removeItem(this.storageKey(scope, key));
            this.broadcastStateChange(scope, key, null);
          } catch (err) {
            console.error('[StateStack] clearScope persist remove error:', err);
          }
        }
      }
      this.stacks.delete(scope);
    }

    // Clean up orphaned loaded keys that were never in stacks
    for (const ik of Array.from(this.loadedKeys)) {
      const [ks, k] = this.parseSubKey(ik);
      if (ks !== scope) continue;

      this.hydratedKeys.delete(ik);
      this.loadedKeys.delete(ik);
      this.demandedKeys.delete(ik);
      this.notifyHydration(ks, k);
      this.hydrationSubscribers.delete(ik);

      if (removePersist) {
        try {
          await storage.removeItem(this.storageKey(scope, k));
          this.broadcastStateChange(scope, k, null);
        } catch (err) {
          console.error('[StateStack] clearScope orphan remove error:', err);
        }
      }
    }

    this.scopeSubscriberCounts.delete(scope);
  }

  async clearByPathname(pathname: string, removePersist = true) {
    await this.clearScope(`route:${pathname}`, removePersist);
  }

  async clearCurrentPath(removePersist = true) {
    if (typeof window === 'undefined') return;
    await this.clearByPathname(window.location.pathname, removePersist);
  }

  clearKey(scope: string, key: string, removePersist = true) {
    const ik = this.subKey(scope, key);

    this.hydratedKeys.delete(ik);
    this.loadedKeys.delete(ik);
    this.demandedKeys.delete(ik);
    this.notifyHydration(scope, key);
    this.hydrationSubscribers.delete(ik);

    this.stacks.get(scope)?.delete(key);
    this.notify(scope, key);

    if (this.timers.has(ik)) {
      clearTimeout(this.timers.get(ik)!);
      this.timers.delete(ik);
    }
    if (this.history.has(ik)) this.history.delete(ik);

    if (removePersist) {
      const storage = getDefaultStorage();
      storage
        .removeItem(this.storageKey(scope, key))
        .then(() => this.broadcastStateChange(scope, key, null))
        .catch((err) =>
          console.error('[StateStack] clearKey persist remove error:', err)
        );
    }
  }

  clearByPrefix(prefix: string, removePersist = true) {
    for (const [scope, sm] of this.stacks) {
      for (const key of Array.from(sm.keys())) {
        if (key.startsWith(prefix)) {
          this.clearKey(scope, key, removePersist);
        }
      }
    }

    for (const ik of Array.from(this.loadedKeys)) {
      const [scope, key] = this.parseSubKey(ik);
      if (!key.startsWith(prefix)) continue;

      this.hydratedKeys.delete(ik);
      this.loadedKeys.delete(ik);
      this.demandedKeys.delete(ik);
      this.notifyHydration(scope, key);

      if (removePersist) {
        const storage = getDefaultStorage();
        storage
          .removeItem(this.storageKey(scope, key))
          .catch((err) =>
            console.error('[StateStack] clearByPrefix persist remove error:', err)
          );
      }
    }
  }

  clearByCondition(
    condition: (scope: string, key: string) => boolean,
    removePersist = true
  ) {
    for (const [scope, sm] of this.stacks) {
      for (const key of Array.from(sm.keys())) {
        try {
          if (condition(scope, key)) this.clearKey(scope, key, removePersist);
        } catch (err) {
          console.error('[StateStack] clearByCondition error:', err);
        }
      }
    }

    for (const ik of Array.from(this.loadedKeys)) {
      const [scope, key] = this.parseSubKey(ik);
      try {
        if (!condition(scope, key)) continue;

        this.hydratedKeys.delete(ik);
        this.loadedKeys.delete(ik);
        this.demandedKeys.delete(ik);
        this.notifyHydration(scope, key);

        if (removePersist) {
          const storage = getDefaultStorage();
          storage
            .removeItem(this.storageKey(scope, key))
            .catch((err) =>
              console.error(
                '[StateStack] clearByCondition persist remove error:',
                err
              )
            );
        }
      } catch (err) {
        console.error('[StateStack] clearByCondition loaded key error:', err);
      }
    }
  }

  clearMatching(opts: {
    prefix?: string;
    contains?: string;
    regex?: RegExp;
    scope?: string;
    removePersist?: boolean;
    condition?: (scope: string, key: string) => boolean;
  }) {
    const {
      prefix,
      contains,
      regex,
      scope: onlyScope,
      removePersist = true,
      condition,
    } = opts;

    if (condition) return this.clearByCondition(condition, removePersist);

    this.clearByCondition((s, k) => {
      if (onlyScope && s !== onlyScope) return false;
      if (prefix && k.startsWith(prefix)) return true;
      if (contains && k.includes(contains)) return true;
      if (regex && regex.test(k)) return true;
      return false;
    }, removePersist);
  }

  // ── Undo / redo ───────────────────────────────────────────────────────────

  canUndo(scope: string, key: string): boolean {
    const h = this.history.get(this.subKey(scope, key));
    return !!h && h.past.length > 0;
  }

  canRedo(scope: string, key: string): boolean {
    const h = this.history.get(this.subKey(scope, key));
    return !!h && h.future.length > 0;
  }

  async undo(
    scope: string,
    key: string,
    persist: boolean,
    storage: StorageAdapter
  ) {
    const ik = this.subKey(scope, key);
    return this.queueUpdate(ik, async () => {
      const h = this.history.get(ik);
      if (!h || h.past.length === 0) {
        console.warn(
          `[StateStack] undo called on "${scope}::${key}" but there is no history.`
        );
        return;
      }
      const current = this.stacks.get(scope)?.get(key);
      const prev = h.past.pop()!;
      h.future.push(safeClone(current));
      if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
      this.stacks.get(scope)!.set(key, prev);
      this.loadedKeys.add(ik);
      if (persist) {
        try {
          await (storage || getDefaultStorage()).setItem(
            this.storageKey(scope, key),
            JSON.stringify(prev)
          );
        } catch (err) {
          console.error('[StateStack] undo persist error:', err);
        }
      }
      this.notify(scope, key);
    });
  }

  async redo(
    scope: string,
    key: string,
    persist: boolean,
    storage: StorageAdapter
  ) {
    const ik = this.subKey(scope, key);
    return this.queueUpdate(ik, async () => {
      const h = this.history.get(ik);
      if (!h || h.future.length === 0) {
        console.warn(
          `[StateStack] redo called on "${scope}::${key}" but there is no future.`
        );
        return;
      }
      const next = h.future.pop()!;
      h.past.push(safeClone(this.stacks.get(scope)?.get(key)));
      this.stacks.get(scope)!.set(key, next);
      this.loadedKeys.add(ik);
      if (persist) {
        try {
          await (storage || getDefaultStorage()).setItem(
            this.storageKey(scope, key),
            JSON.stringify(next)
          );
        } catch (err) {
          console.error('[StateStack] redo persist error:', err);
        }
      }
      this.notify(scope, key);
    });
  }

  setHistoryDepth(scope: string, key: string, depth: number) {
    const hk = this.subKey(scope, key);
    if (!this.history.has(hk)) {
      this.history.set(hk, {
        past: [],
        future: [],
        maxDepth: Math.max(1, depth),
      });
      return;
    }
    this.history.get(hk)!.maxDepth = Math.max(1, depth);
  }

  // ── Loaded / demanded / hydrated flags ────────────────────────────────────

  isLoaded(scope: string, key: string) {
    return this.loadedKeys.has(this.subKey(scope, key));
  }
  markLoaded(scope: string, key: string) {
    this.loadedKeys.add(this.subKey(scope, key));
  }
  clearLoaded(scope: string, key: string) {
    this.loadedKeys.delete(this.subKey(scope, key));
  }

  isDemanded(scope: string, key: string) {
    return this.demandedKeys.has(this.subKey(scope, key));
  }
  markDemanded(scope: string, key: string) {
    this.demandedKeys.add(this.subKey(scope, key));
  }
  clearDemanded(scope: string, key: string) {
    this.demandedKeys.delete(this.subKey(scope, key));
  }

  resetDemand(scope: string, key: string) {
    const internalKey = this.subKey(scope, key);
    this.demandedKeys.delete(internalKey);
    this.hydratedKeys.delete(internalKey);
    this.loadedKeys.delete(internalKey);
    this.notifyHydration(scope, key);
  }

  isHydrated(scope: string, key: string): boolean {
    return this.hydratedKeys.has(this.subKey(scope, key));
  }
  markHydrated(scope: string, key: string) {
    const ik = this.subKey(scope, key);
    this.hydratedKeys.add(ik);
    this.loadedKeys.add(ik);
    this.notifyHydration(scope, key);
  }

  // ── Hydration subscriptions ───────────────────────────────────────────────

  private notifyHydration(scope: string, key: string) {
    const k = this.subKey(scope, key);
    const s = this.hydrationSubscribers.get(k);
    if (!s) return;
    queueMicrotask(() => {
      for (const fn of Array.from(s)) {
        try { fn(); } catch (err) {
          console.error('[StateStack] hydration subscriber error:', err);
        }
      }
    });
  }

  subscribeToHydration(
    scope: string,
    key: string,
    fn: Subscriber
  ): () => void {
    const k = this.subKey(scope, key);
    if (!this.hydrationSubscribers.has(k))
      this.hydrationSubscribers.set(k, new Set());
    this.hydrationSubscribers.get(k)!.add(fn);

    // Fire immediately if already hydrated
    if (this.isHydrated(scope, key)) {
      queueMicrotask(() => {
        try { fn(); } catch (err) {
          console.error(
            '[StateStack] hydration subscriber immediate error:',
            err
          );
        }
      });
    }

    return () => {
      const s = this.hydrationSubscribers.get(k);
      if (s) {
        s.delete(fn);
        if (s.size === 0) this.hydrationSubscribers.delete(k);
      }
    };
  }

  // ── Demand operations ─────────────────────────────────────────────────────

  async runDemandOperation(
    scope: string,
    key: string,
    operation: () => Promise<void>
  ): Promise<void> {
    const ok = this.subKey(scope, key);

    if (this.pendingDemandOperations.has(ok)) {
      return this.pendingDemandOperations.get(ok)!;
    }

    const p = (async () => {
      try {
        if (this.isDemanded(scope, key)) return;
        await operation();
      } finally {
        this.pendingDemandOperations.delete(ok);
      }
    })();

    this.pendingDemandOperations.set(ok, p);
    return p;
  }

  // ── Cross-tab sync ────────────────────────────────────────────────────────

  private attachStorageListener() {
    if (
      this.storageEventListenerAttached ||
      typeof window === 'undefined'
    )
      return;
    if (_globalConfig.crossTabSync === false) return;

    this.storageEventListenerAttached = true;
    this.setupBroadcastChannel();

    // localStorage 'storage' fires cross-tab for backward compat and
    // for environments where BroadcastChannel is unavailable.
    // Skip if BroadcastChannel is active to avoid double-notify.
    window.addEventListener('storage', (ev) => {
      // If BroadcastChannel is active, it handles cross-tab sync — skip storage event
      if (this.broadcastChannel) return;
      try {
        if (!ev.key) return;

        let k = ev.key;
        const prefix = _globalConfig.storagePrefix
          ? `${_globalConfig.storagePrefix}:`
          : '';
        if (prefix && k.startsWith(prefix)) k = k.slice(prefix.length);

        let scope = '';
        let subKey = '';
        if (k.includes(INTERNAL_SEPARATOR)) {
          const idx = k.indexOf(INTERNAL_SEPARATOR);
          scope = k.slice(0, idx);
          subKey = k.slice(idx + INTERNAL_SEPARATOR.length);
        } else {
          const idx = k.lastIndexOf(':');
          if (idx === -1) return;
          scope = k.slice(0, idx);
          subKey = k.slice(idx + 1);
        }

        if (ev.newValue == null) {
          this.stacks.get(scope)?.delete(subKey);
          const ik = this.subKey(scope, subKey);
          this.hydratedKeys.delete(ik);
          this.loadedKeys.delete(ik);
          this.demandedKeys.delete(ik);
          this.notify(scope, subKey);
        } else {
          try {
            const parsed = JSON.parse(ev.newValue);
            if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
            this.stacks.get(scope)!.set(subKey, parsed);
            const ik = this.subKey(scope, subKey);
            this.hydratedKeys.add(ik);
            this.loadedKeys.add(ik);
            this.notify(scope, subKey);
          } catch {
            /* ignore parse errors from other origins */
          }
        }
      } catch (err) {
        console.error('[StateStack] storage event handler error:', err);
      }
    });
  }

  /**
   * Sets up BroadcastChannel for cross-tab sync that works with IndexedDB.
   *
   * FIX — infinite broadcast loop:
   * Every outgoing message is stamped with `this.tabId`.
   * The receiver's first action is to compare the incoming tabId against
   * its own and return early if they match. This prevents the loop:
   *   Tab A: setState → broadcastStateChange (tabId = "A")
   *   Tab A: onmessage({ tabId: "A" }) → guard fires → return  ✓
   *   Tab B: onmessage({ tabId: "A" }) → guard passes → update state ✓
   */
  private setupBroadcastChannel() {
    if (this.broadcastChannelFailed) return; // Don't retry after failure
    
    if (typeof BroadcastChannel === 'undefined') {
      this.debugLog(
        'BroadcastChannel not available — cross-tab sync via localStorage events only.'
      );
      this.broadcastChannelFailed = true;
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

      this.broadcastChannel.onmessage = (
        event: MessageEvent<BroadcastMessage>
      ) => {
        try {
          const { tabId, scope, key, value } = event.data;

          // ── SELF-MESSAGE GUARD ────────────────────────────────────────────
          // Discard messages that originated from this tab. Without this guard
          // every setState triggers its own onmessage, which calls setState,
          // which triggers onmessage … infinitely.
          if (tabId === this.tabId) return;
          // ─────────────────────────────────────────────────────────────────

          if (!scope || !key) return;

          const ik = this.subKey(scope, key);

          if (value === null) {
            // Deletion broadcast from another tab
            this.stacks.get(scope)?.delete(key);
            this.hydratedKeys.delete(ik);
            this.loadedKeys.delete(ik);
            this.demandedKeys.delete(ik);
            this.notify(scope, key);
            this.notifyHydration(scope, key);
          } else {
            // Update broadcast from another tab
            if (!this.stacks.has(scope)) this.stacks.set(scope, new Map());
            this.stacks.get(scope)!.set(key, value);
            this.hydratedKeys.add(ik);
            this.loadedKeys.add(ik);
            this.notify(scope, key);
            this.notifyHydration(scope, key);
          }

          // Removed cross-tab update log to reduce console spam
        } catch (err) {
          console.error(
            '[StateStack] BroadcastChannel onmessage error:',
            err
          );
        }
      };

      this.broadcastChannel.onmessageerror = (event) => {
        console.error('[StateStack] BroadcastChannel message error:', event);
      };

      // Removed initialization log to reduce console spam
    } catch (err) {
      console.error('[StateStack] Failed to setup BroadcastChannel:', err);
      this.broadcastChannelFailed = true;
      this.broadcastChannel = undefined;
    }
  }

  /**
   * Sends a state-change notification to all other tabs.
   * Stamps `this.tabId` on the payload so the receiver can suppress its
   * own loopback messages via the self-message guard above.
   */
  private broadcastStateChange(
    scope: string,
    key: string,
    value: unknown
  ) {
    if (!this.broadcastChannel) return;
    try {
      const msg: BroadcastMessage = {
        tabId: this.tabId,
        scope,
        key,
        value,
        timestamp: Date.now(),
      };
      this.broadcastChannel.postMessage(msg);
      // Removed debug log to reduce console spam
    } catch (err) {
      console.error('[StateStack] broadcastStateChange error:', err);
    }
  }

  // ── Debug & lifecycle ─────────────────────────────────────────────────────

  debug() {
    const stacks: Record<string, Record<string, unknown>> = {};
    for (const [scope, m] of this.stacks) {
      stacks[scope] = {};
      for (const [k, v] of m) stacks[scope][k] = v;
    }
    return {
      tabId: this.tabId,
      stacks,
      timers: Array.from(this.timers.keys()),
      historyKeys: Array.from(this.history.keys()),
      subscribers: Array.from(this.subscribers.keys()),
      scopeSubscriberCounts: Array.from(
        this.scopeSubscriberCounts.entries()
      ),
      autoClearScopes: Array.from(this.autoClearScopes),
      pendingUpdates: Array.from(this.pendingUpdates.keys()),
      hydratedKeys: Array.from(this.hydratedKeys),
      loadedKeys: Array.from(this.loadedKeys),
      broadcastChannelActive: !!this.broadcastChannel,
    };
  }

  dispose() {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
        this.broadcastChannel = undefined;
        // Removed close log to reduce console spam
      } catch (err) {
        console.error('[StateStack] Error closing BroadcastChannel:', err);
      }
    }
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    // Allow re-initialization after dispose
    StateStackCore._instance = null;
    StateStackCore._listenerAttached = false;
  }
}
