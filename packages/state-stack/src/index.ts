// Public API barrel for @academix/state-stack.
// The implementation is split across ./types, ./config, ./storage, ./core,
// ./hooks and ./facade. The original single-file implementation is preserved
// (for reference only) at ./_legacy/state-stack.legacy.tsx.

export type {
  UsePathnameHook,
  StorageAdapter,
  StateStackInitOptions,
  StackConfig,
} from './types';

export { useLocationPathname } from './pathname';
export { initStateStack, useResolvedPathname, getDefaultStorage } from './config';

export { fallbackStorageAdapter } from './storage/fallback';
export { defaultStorageAdapter } from './storage/default';
export { indexedDBAdapter } from './storage/indexeddb';
export { browserStorageAdapter } from './storage/browser';

export { createStateStack } from './hooks/createStateStack';
export { useDemandState } from './hooks/useDemandState';
export { useAtom } from './hooks/useAtom';
export { useComputed, useToggle, useList } from './hooks/local-hooks';

export { StateStack } from './facade';
