/**
 * A READ MADE AFTER A WRITE SEES THE WRITE — even while a slow storage is still saving it.
 *
 * `setState` used to save to storage FIRST and update memory after, so for a persisted key (an
 * IndexedDB round trip on a phone) every read in between saw the value from before the write. A
 * read-modify-write built on that read then overwrote it, because the two landed in order.
 *
 * Seen in a shop's till: loading the open orders wrote three tabs and said "loaded"; the till read
 * the list, found it empty, started a customer on top of that empty list, and the queued write of
 * [that one customer] landed after the three and replaced them. A phone signing in showed none of
 * the shop's open customers, and each such load left another empty one behind.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { StateStack, useDemandState, type StorageAdapter } from '../src/index';

let uid = 0;
const uniqScope = () => `write-read-${Date.now()}-${uid++}`;

/** Storage as slow as a phone's IndexedDB: every call takes `ms`. */
function slowStorage(ms = 40, seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  const wait = () => new Promise((r) => setTimeout(r, ms));
  const adapter: StorageAdapter = {
    getItem: vi.fn(async (k: string) => { await wait(); return map.get(k) ?? null; }),
    setItem: vi.fn(async (k: string, v: string) => { await wait(); map.set(k, v); }),
    removeItem: vi.fn(async (k: string) => { await wait(); map.delete(k); }),
    clear: vi.fn(async () => { await wait(); map.clear(); }),
    getAllKeys: vi.fn(async () => { await wait(); return [...map.keys()]; }),
  };
  return { adapter, map };
}

const core = StateStack.core;

describe('write, then read', () => {
  it('memory has the value the moment it is set, before storage has finished', () => {
    const scope = uniqScope();
    const { adapter } = slowStorage();
    void core.setState(scope, 'orders', ['a', 'b', 'c'], true, adapter);
    expect(core.getStateSync(scope, 'orders', [] as string[])).toEqual(['a', 'b', 'c']);
  });

  it('a read-modify-write on top of an unsaved write keeps both, in memory and in storage', async () => {
    const scope = uniqScope();
    const { adapter, map } = slowStorage();
    const first = core.setState(scope, 'orders', ['a', 'b', 'c'], true, adapter);
    const prev = core.getStateSync(scope, 'orders', [] as string[]);
    const second = core.setState(scope, 'orders', [...prev, 'mine'], true, adapter);
    await Promise.all([first, second]);

    expect(core.getStateSync(scope, 'orders', [] as string[])).toEqual(['a', 'b', 'c', 'mine']);
    const storedKey = [...map.keys()].find((k) => k.includes(scope))!;
    expect(JSON.parse(map.get(storedKey)!)).toEqual(['a', 'b', 'c', 'mine']);
  });

  it('a storage read still in flight never lands on top of a newer write', async () => {
    const scope = uniqScope();
    const { adapter } = slowStorage(60, { [`${scope}::orders`]: JSON.stringify(['old']) });
    const hydrating = core.ensureHydrated(scope, 'orders', [], true, adapter);
    void core.setState(scope, 'orders', ['new'], true, adapter);
    await hydrating;
    await new Promise((r) => setTimeout(r, 150));
    expect(core.getStateSync(scope, 'orders', [] as string[])).toEqual(['new']);
  });

  it('the till: a loader sets three, says loaded; the next functional set adds to the three', async () => {
    const scope = uniqScope();
    const { adapter } = slowStorage();
    const { result } = renderHook(() =>
      useDemandState<string[]>([], { key: 'draftOrders', scope, persist: true, storage: adapter }),
    );

    let seenAfterSet = -1;
    await act(async () => {
      result.current[1](async ({ get, set }) => {
        set(['shop-1', 'shop-2', 'shop-3']);
        seenAfterSet = get().length;
      });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(seenAfterSet, 'get() straight after set() in a loader').toBe(3);

    // The till, told it has loaded, starts a customer — with a functional update.
    await act(async () => {
      result.current[2]((prev) => [...prev, 'auto']);
      await new Promise((r) => setTimeout(r, 200));
    });
    await waitFor(() => expect(result.current[0]).toEqual(['shop-1', 'shop-2', 'shop-3', 'auto']));
  });
});
