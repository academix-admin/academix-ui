// Global configuration: init options, resolved storage and pathname hook.

import { DEBUG } from './constants';
import type { StorageAdapter, StateStackInitOptions, UsePathnameHook } from './types';
import { defaultStorageAdapter } from './storage/default';
import { indexedDBAdapter } from './storage/indexeddb';
import { browserStorageAdapter } from './storage/browser';
import { useLocationPathname } from './pathname';

export let _globalConfig: Required<StateStackInitOptions> = {
  storagePrefix: '',
  defaultStorageAdapter: defaultStorageAdapter,
  debug: DEBUG,
  crossTabSync: true,
  preferredStorage: 'auto',
  usePathname: useLocationPathname,
};

export function initStateStack(opts: StateStackInitOptions = {}) {
  _globalConfig = { ..._globalConfig, ...opts };

  if (opts.preferredStorage === 'indexeddb') {
    _globalConfig.defaultStorageAdapter = indexedDBAdapter;
  } else if (opts.preferredStorage === 'localstorage') {
    _globalConfig.defaultStorageAdapter = browserStorageAdapter;
  }

  if (!opts.usePathname) {
    _globalConfig.usePathname = _globalConfig.usePathname ?? useLocationPathname;
  }
}

/** The currently-configured pathname hook. Call as a React hook. */
export const useResolvedPathname: UsePathnameHook = () =>
  (_globalConfig.usePathname ?? useLocationPathname)();

export const getDefaultStorage = (): StorageAdapter =>
  _globalConfig.defaultStorageAdapter ?? defaultStorageAdapter;
