/**
 * THE PUBLIC SURFACE, WRITTEN DOWN.
 *
 * Two apps import this package and neither is in this repo, so every name below is load-bearing:
 * removing or renaming one is a breaking change whether or not anybody meant it to be. Nothing else
 * in this suite would notice — the other tests import the hooks they exercise directly, so a name
 * could vanish from the barrel with all of them still green.
 *
 * state-stack has THREE surfaces, not one, and consumers use all three:
 *   - the barrel, `@academix-admin/state-stack`
 *   - the `/next` entry point
 *   - the `StateStack` facade object, and `StateStack.core` underneath it (academix-web calls
 *     `StateStack.core.clearScope` in 29 places)
 *
 * The first three are pinned exactly, because they are small and every addition should be a
 * decision. `core` is a class with thirty-odd methods that grows as the package learns things, so it
 * is pinned as "these must still exist" — additions free, removals loud.
 */
import { describe, it, expect } from 'vitest';
import * as api from '../src/index';
import * as nextApi from '../src/next';
import { StateStack } from '../src/facade';

const PUBLIC_EXPORTS = [
  // Setting the package up
  'initStateStack',
  'createStateStack',
  'getDefaultStorage',
  'useResolvedPathname',
  'useLocationPathname',

  // Where state is kept
  'indexedDBAdapter',
  'browserStorageAdapter',
  'defaultStorageAdapter',
  'fallbackStorageAdapter',

  // Asking for data, and holding it
  'useDemandState',
  'useDemandResource',
  'isEmptyValue',

  // Local state that is not fetched
  'useAtom',
  'useComputed',
  'useToggle',
  'useList',

  // The facade
  'StateStack',
].sort();

/** `@academix-admin/state-stack/next`. */
const NEXT_EXPORTS = ['useNextPathname', 'connectNextRouter'].sort();

/** What `StateStack.x` offers. */
const FACADE_KEYS = [
  'core',
  'init',
  'createStateStack',
  'useDemandState',
  'useAtom',
  'useComputed',
  'useToggle',
  'useList',
  'getDefaultStorage',
  'clearKey',
  'clearScope',
  'invalidateScope',
  'clearByPathname',
  'clearCurrentPath',
  'clearByPrefix',
  'clearByCondition',
  'clearMatching',
  'adapters',
].sort();

/**
 * `StateStack.core.*`. Not an exact list: core is where the package's behaviour lives and it gains
 * methods. What must not happen is one going away under an app that calls it.
 */
const CORE_METHODS = [
  'ensureHydrated', 'subscribe', 'notify', 'setTTL',
  'enableAutoClearOnZero', 'disableAutoClearOnZero',
  'invalidateScope', 'clearScope', 'clearByPathname', 'clearCurrentPath', 'clearKey',
  'clearByPrefix', 'clearByCondition', 'clearMatching',
  'canUndo', 'canRedo', 'undo', 'redo', 'setHistoryDepth',
  'isLoaded', 'markLoaded', 'clearLoaded',
  'isDemanded', 'markDemanded', 'clearDemanded', 'resetDemand',
  'isHydrated', 'markHydrated', 'subscribeToHydration',
  'runDemandOperation', 'debug', 'dispose',
];

/*
 * THE TYPES, which are gone before any of the assertions above run.
 *
 * A type is as public as a function: an app writing `const o: DemandResourceOptions = {...}` stops
 * compiling if it is renamed. Nothing here executes — the guard is that this file is in
 * `tsconfig.test.json`, so `npm run typecheck:test` fails on a name that no longer exists.
 */
import type {
  UsePathnameHook,
  StorageAdapter,
  StateStackInitOptions,
  StackConfig,
  DemandSetOptions,
  DemandResource,
  DemandResourceOptions,
  DemandStatus,
} from '../src/index';

/** Naming each one is the assertion: a type that is gone cannot be named. */
type PublicTypes = [
  UsePathnameHook,
  StorageAdapter,
  StateStackInitOptions,
  StackConfig<unknown>,
  DemandSetOptions,
  DemandResource<unknown>,
  DemandResourceOptions,
  DemandStatus,
];

/** So that DELETING a line above fails too, not only renaming one. */
const PUBLIC_TYPE_COUNT = 8;

const drift = (actual: string[], expected: string[]) => ({
  added: actual.filter((n) => !expected.includes(n)),
  removed: expected.filter((n) => !actual.includes(n)),
});

describe('the public API', () => {
  it('exports exactly what is written down here', () => {
    const actual = Object.keys(api).sort();
    expect(drift(actual, PUBLIC_EXPORTS)).toEqual({ added: [], removed: [] });
  });

  it('exports exactly what is written down for /next', () => {
    const actual = Object.keys(nextApi).sort();
    expect(drift(actual, NEXT_EXPORTS)).toEqual({ added: [], removed: [] });
  });

  it('offers exactly the facade that is written down here', () => {
    const actual = Object.keys(StateStack).sort();
    expect(drift(actual, FACADE_KEYS)).toEqual({ added: [], removed: [] });
  });

  it('and the facade is the same object the barrel exports', () => {
    expect(api.StateStack).toBe(StateStack);
  });

  it('keeps every core method an app may already be calling', () => {
    const core = StateStack.core as unknown as Record<string, unknown>;
    const missing = CORE_METHODS.filter((m) => typeof core[m] !== 'function');
    expect(missing).toEqual([]);
  });

  it('still publishes every type that is written down', () => {
    const declared: PublicTypes['length'] = PUBLIC_TYPE_COUNT;
    expect(declared).toBe(PUBLIC_TYPE_COUNT);
  });
});
