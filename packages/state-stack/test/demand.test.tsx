import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { isEmptyValue, StateStack, useDemandResource, useDemandState } from '../src/index';
import type { StorageAdapter } from '../src/index';

let uid = 0;
const uniqScope = () => `demand-test-${Date.now()}-${uid++}`;

describe('isEmptyValue (empty detection across data shapes)', () => {
  it('treats null/undefined/[]/empty Map/Set/{} as empty', () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue(new Map())).toBe(true);
    expect(isEmptyValue(new Set())).toBe(true);
    expect(isEmptyValue({})).toBe(true);
  });
  it('treats non-empty collections and all primitives as real values', () => {
    expect(isEmptyValue([0])).toBe(false);
    expect(isEmptyValue(new Map([['a', 1]]))).toBe(false);
    expect(isEmptyValue(new Set([1]))).toBe(false);
    expect(isEmptyValue({ a: 1 })).toBe(false);
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue('')).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
  });
});

describe('useDemandResource', () => {
  it('starts with nothing, then has an answer', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [1, 2, 3]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [] })
    );

    // NOTHING, not an empty list. A default rendered before any answer exists is a default a screen
    // cannot tell from an answer — the whole reason `data` is `T | null` and there is no initial.
    expect(result.current.data).toBeNull();
    expect(result.current.loaded).toBe(false);

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('says so in words when a read fails with nothing to show', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => { throw new Error('boom'); });
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [] })
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('boom');
    expect((result.current.cause as Error).message).toBe('boom');
    // Still nothing — a failed read does not invent an empty list.
    expect(result.current.data).toBeNull();
    expect(result.current.loaded).toBe(false);
  });

  it('falls back to words of our own when the thrown thing says nothing', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => { throw {}; });
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, {
        key: 'k', scope, persist: false, deps: [], fallbackMessage: 'That could not be read.',
      })
    );
    await waitFor(() => expect(result.current.error).toBe('That could not be read.'));
  });

  it('retries, then succeeds', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('once'))
      .mockResolvedValueOnce([4]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, {
        key: 'k', scope, persist: false, deps: [], retry: 1, retryDelay: 1,
      })
    );
    await waitFor(() => expect(result.current.data).toEqual([4]));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('refetch really reads again', async () => {
    // `demand()` returns early on a key it has already served, so a "try again" button built on the
    // loader alone does nothing. The demanded flag is cleared first.
    const scope = uniqScope();
    let n = 0;
    const fetcher = vi.fn(async () => [++n]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([1]));

    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.data).toEqual([2]));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps what is on screen when a later read throws', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockResolvedValueOnce([5, 6])
      .mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([5, 6]));

    await act(async () => { await result.current.refetch(); });
    // The last answer stays. Only `error` says the newer one did not arrive.
    expect(result.current.data).toEqual([5, 6]);
    expect(result.current.error).toBe('offline');
    expect(result.current.status).toBe('success');
    expect(result.current.loaded).toBe(true);
  });

  it('AN EMPTY ANSWER IS AN ANSWER, and replaces what was there', async () => {
    /*
     * This is the reverse of what this hook used to do, on purpose.
     *
     * It used to drop an empty refetch result to protect the cache — "keepPreviousData". But the
     * thing that guard was protecting against is a read that FAILED, and a failed read throws: it
     * never reaches the commit at all. All the guard could actually catch was a true answer that
     * happens to be empty, and it threw it away.
     *
     * What that means on a shop floor: a customer pays off everything they owe, the screen re-reads,
     * the answer is an empty history — and the old debts stay on screen. The shop is told it is owed
     * money that has already been paid.
     */
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockResolvedValueOnce([5, 6])
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([5, 6]));

    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toEqual([]);
    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('holds the read while it is not enabled', async () => {
    // No account chosen yet, no id yet, nobody signed in yet.
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [9]);
    const { result, rerender } = renderHook(
      ({ on }: { on: boolean }) =>
        useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [], enabled: on }),
      { initialProps: { on: false } },
    );

    await act(async () => {});
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();

    rerender({ on: true });
    await waitFor(() => expect(result.current.data).toEqual([9]));
  });

  it('reads again when its scope is invalidated', async () => {
    // A sale recorded on another till reaches a screen that is already open, without either of them
    // knowing the other exists.
    const scope = uniqScope();
    let n = 0;
    const fetcher = vi.fn(async () => [++n]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>(fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([1]));

    await act(async () => { StateStack.core.invalidateScope(scope); });
    await waitFor(() => expect(result.current.data).toEqual([2]));
  });

  it('revalidateOnMount:false reuses the cache on remount (loader runs once)', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [7]);
    const opts = { key: 'k', scope, persist: false, deps: [], revalidateOnMount: false };
    const r1 = renderHook(() => useDemandResource<number[]>(fetcher, opts));
    await waitFor(() => expect(r1.result.current.data).toEqual([7]));
    expect(fetcher).toHaveBeenCalledTimes(1);
    r1.unmount();

    const r2 = renderHook(() => useDemandResource<number[]>(fetcher, opts));
    await waitFor(() => expect(r2.result.current.data).toEqual([7]));
    expect(fetcher).toHaveBeenCalledTimes(1); // NOT re-fetched
  });

  it('revalidateOnMount:true (default) re-runs the loader on remount', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [8]);
    const opts = { key: 'k', scope, persist: false, deps: [] };
    const r1 = renderHook(() => useDemandResource<number[]>(fetcher, opts));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    r1.unmount();

    const r2 = renderHook(() => useDemandResource<number[]>(fetcher, opts));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(r2.result.current.data).toEqual([8]);
  });
});

class Row {
  v: number;
  constructor(r: { v: number }) { this.v = r.v; }
  double() { return this.v * 2; }
}
const mockStorage = (json: string): StorageAdapter => ({
  getItem: async () => json,
  setItem: async () => {},
  removeItem: async () => {},
});

describe('useDemandState revive (persisted class instances)', () => {
  it('reconstructs class instances from persisted plain JSON on hydration', async () => {
    const scope = uniqScope();
    const storage = mockStorage(JSON.stringify([{ v: 1 }, { v: 2 }]));
    const revive = (raw: unknown) => (raw as { v: number }[]).map((r) => new Row(r));
    const { result } = renderHook(() =>
      useDemandState<Row[]>([], { key: 'k', scope, persist: true, storage, revive })
    );
    await waitFor(() => expect(result.current[0].length).toBe(2));
    expect(result.current[0][0]).toBeInstanceOf(Row);
    expect(result.current[0][0].double()).toBe(2);
  });

  it('without revive, hydrated values are plain objects (no methods)', async () => {
    const scope = uniqScope();
    const storage = mockStorage(JSON.stringify([{ v: 5 }]));
    const { result } = renderHook(() =>
      useDemandState<{ v: number }[]>([], { key: 'k', scope, persist: true, storage })
    );
    await waitFor(() => expect(result.current[0].length).toBe(1));
    expect(result.current[0][0]).toEqual({ v: 5 });
    expect(Object.getPrototypeOf(result.current[0][0])).toBe(Object.prototype);
  });

  it('revive throwing falls back to the raw parsed value (never breaks hydration)', async () => {
    const scope = uniqScope();
    const storage = mockStorage(JSON.stringify([{ v: 9 }]));
    const revive = () => { throw new Error('bad revive'); };
    const { result } = renderHook(() =>
      useDemandState<{ v: number }[]>([], { key: 'k', scope, persist: true, storage, revive })
    );
    await waitFor(() => expect(result.current[0]).toEqual([{ v: 9 }]));
  });
});
