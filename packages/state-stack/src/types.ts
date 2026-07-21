// Shared type definitions for state-stack.

export type Subscriber = () => void;

export type UsePathnameHook = () => string | null;

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear?(): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}

export interface StateStackInitOptions {
  storagePrefix?: string;
  defaultStorageAdapter?: StorageAdapter | undefined;
  debug?: boolean;
  crossTabSync?: boolean;
  preferredStorage?: 'indexeddb' | 'localstorage' | 'auto';
  /**
   * React hook used to resolve the current route pathname for route-scoped
   * state. Defaults to the built-in `useLocationPathname`. Pass your router's
   * hook (e.g. Next.js `usePathname`) to align scoping with client-side routing.
   *
   * Must be a stable hook reference set once, before any state hooks render —
   * swapping it between renders would violate the Rules of Hooks.
   */
  usePathname?: UsePathnameHook;
}

export interface BroadcastMessage {
  /** Unique per-tab ID — messages from this tab are discarded on receive. */
  tabId: string;
  scope: string;
  key: string;
  /** null signals deletion */
  value: unknown;
  timestamp: number;
}

export type MethodFn<S = any> = (state: S, ...args: any[]) => S;
export type MethodDict<S = any> = Record<string, MethodFn<S>>;
export type ParamsForMethod<F> = F extends (
  state: any,
  ...args: infer A
) => any
  ? A
  : never;

export interface StackConfig<S> {
  initial: S;
  ttl?: number;
  persist?: boolean;
  storage?: StorageAdapter;
  historyDepth?: number;
  middleware?: Array<(prev: S, next: S, action: string) => S | void>;
  clearOnZeroSubscribers?: boolean;
}

export type InferStateFromMethods<T> = T extends MethodDict<infer S> ? S : never;
export type MethodsFor<T> = T extends MethodDict<infer S> ? T : never;
