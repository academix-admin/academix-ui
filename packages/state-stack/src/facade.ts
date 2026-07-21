// Top-level StateStack facade + dev-only window.__STATE_STACK__ inspector.

import { StateStackCore } from './core/StateStackCore';
import { atomStore } from './core/AtomStore';
import { _globalConfig, initStateStack, getDefaultStorage } from './config';
import { createStateStack } from './hooks/createStateStack';
import { useDemandState } from './hooks/useDemandState';
import { useAtom } from './hooks/useAtom';
import { useComputed, useToggle, useList } from './hooks/local-hooks';
import { indexedDBAdapter } from './storage/indexeddb';
import { browserStorageAdapter } from './storage/browser';
import { defaultStorageAdapter } from './storage/default';

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (
    window as Window & { __STATE_STACK__?: unknown }
  ).__STATE_STACK__ = {
    core: StateStackCore.instance,
    atomStore,
    initStateStack,
    debug: () => ({
      stateStack: StateStackCore.instance.debug(),
      atoms: atomStore.debug(),
      globalConfig: _globalConfig,
    }),
    adapters: {
      indexedDB: indexedDBAdapter,
      localStorage: browserStorageAdapter,
      default: defaultStorageAdapter,
    },
  };
}

// ---------------------------------------------------------------------------
// Top-level StateStack façade
// ---------------------------------------------------------------------------

const coreInstance = StateStackCore.instance;

export const StateStack = {
  core: coreInstance,
  init: initStateStack,
  createStateStack,
  useDemandState,
  useAtom,
  useComputed,
  useToggle,
  useList,
  getDefaultStorage,

  // Bound core methods — no anonymous wrappers so call sites get correct `this`.
  clearKey: coreInstance.clearKey.bind(coreInstance),
  clearScope: coreInstance.clearScope.bind(coreInstance),
  clearByPathname: coreInstance.clearByPathname.bind(coreInstance),
  clearCurrentPath: (removePersist = true) => {
    if (typeof window !== 'undefined') {
      coreInstance.clearByPathname(
        window.location.pathname,
        removePersist
      );
    }
  },
  clearByPrefix: coreInstance.clearByPrefix.bind(coreInstance),
  clearByCondition: coreInstance.clearByCondition.bind(coreInstance),
  clearMatching: coreInstance.clearMatching.bind(coreInstance),

  adapters: {
    indexedDB: indexedDBAdapter,
    localStorage: browserStorageAdapter,
    default: defaultStorageAdapter,
  },
} as const;
