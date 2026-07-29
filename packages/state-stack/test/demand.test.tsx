import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { isEmptyValue, useDemandResource } from '../src/index';

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
  it('idle -> loading -> success with data', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [1, 2, 3]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>([], fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('a throwing fetcher with no data yields status "error"', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => { throw new Error('boom'); });
    const { result } = renderHook(() =>
      useDemandResource<number[]>([], fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect((result.current.error as Error).message).toBe('boom');
    expect(result.current.data).toEqual([]);
  });

  it('retries the fetcher, then succeeds', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce([9]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>([], fetcher, { key: 'k', scope, persist: false, deps: [], retry: 1, retryDelay: 1 })
    );
    await waitFor(() => expect(result.current.status).toBe('success'), { timeout: 2000 });
    expect(result.current.data).toEqual([9]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('refetch re-runs the fetcher and updates data', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockResolvedValueOnce([1])
      .mockResolvedValueOnce([1, 2]);
    const { result } = renderHook(() =>
      useDemandResource<number[]>([], fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([1]));
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.data).toEqual([1, 2]));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps cached data (status success) when a later fetch throws', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockResolvedValueOnce([1, 2, 3])
      .mockRejectedValueOnce(new Error('later-fail'));
    const { result } = renderHook(() =>
      useDemandResource<number[]>([], fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([1, 2, 3]));
    await act(async () => { await result.current.refetch(); });
    // data preserved, still 'success', but error is surfaced
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.status).toBe('success');
    expect((result.current.error as Error).message).toBe('later-fail');
  });

  it('keepPreviousData: an empty refetch result does not wipe existing data', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn()
      .mockResolvedValueOnce([5, 6])
      .mockResolvedValueOnce([]); // e.g. a gate-blocked/failed fetch returning empty
    const { result } = renderHook(() =>
      useDemandResource<number[]>([], fetcher, { key: 'k', scope, persist: false, deps: [] })
    );
    await waitFor(() => expect(result.current.data).toEqual([5, 6]));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toEqual([5, 6]); // kept, not wiped
  });

  it('revalidateOnMount:false reuses the cache on remount (loader runs once)', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [7]);
    const opts = { key: 'k', scope, persist: false, deps: [], revalidateOnMount: false };
    const r1 = renderHook(() => useDemandResource<number[]>([], fetcher, opts));
    await waitFor(() => expect(r1.result.current.data).toEqual([7]));
    expect(fetcher).toHaveBeenCalledTimes(1);
    r1.unmount();
    const r2 = renderHook(() => useDemandResource<number[]>([], fetcher, opts));
    await waitFor(() => expect(r2.result.current.data).toEqual([7]));
    expect(fetcher).toHaveBeenCalledTimes(1); // NOT re-fetched
  });

  it('revalidateOnMount:true (default) re-runs the loader on remount', async () => {
    const scope = uniqScope();
    const fetcher = vi.fn(async () => [8]);
    const opts = { key: 'k', scope, persist: false, deps: [] };
    const r1 = renderHook(() => useDemandResource<number[]>([], fetcher, opts));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    r1.unmount();
    const r2 = renderHook(() => useDemandResource<number[]>([], fetcher, opts));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(r2.result.current.data).toEqual([8]);
  });
});
