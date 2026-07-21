import { describe, it, expect } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAtom, useComputed, useToggle, useList } from '../src/index';

describe('useAtom', () => {
  it('returns the initial value and updates via setter', async () => {
    const { result } = renderHook(() => useAtom('atom-count', 0));
    expect(result.current[0]).toBe(0);
    act(() => result.current[1](5));
    await waitFor(() => expect(result.current[0]).toBe(5));
    act(() => result.current[1]((p) => p + 1));
    await waitFor(() => expect(result.current[0]).toBe(6));
  });

  it('shares state across separate consumers of the same key', async () => {
    const a = renderHook(() => useAtom('atom-shared', 'x'));
    const b = renderHook(() => useAtom('atom-shared', 'x'));
    act(() => a.result.current[1]('y'));
    await waitFor(() => expect(a.result.current[0]).toBe('y'));
    await waitFor(() => expect(b.result.current[0]).toBe('y'));
  });
});

describe('useComputed', () => {
  it('derives a value from deps', () => {
    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => useComputed(() => n * 2, 0, [n]),
      { initialProps: { n: 3 } }
    );
    expect(result.current).toBe(6);
    rerender({ n: 10 });
    expect(result.current).toBe(20);
  });

  it('falls back to the default when compute throws', () => {
    const { result } = renderHook(() =>
      useComputed(() => {
        throw new Error('boom');
      }, 'fallback', [])
    );
    expect(result.current).toBe('fallback');
  });
});

describe('useToggle', () => {
  it('toggles and sets explicitly', () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[2](false));
    expect(result.current[0]).toBe(false);
  });
});

describe('useList', () => {
  it('pushes, updates, removes and clears', () => {
    const { result } = renderHook(() => useList<number>([1]));
    act(() => result.current.push(2));
    expect(result.current.list).toEqual([1, 2]);
    act(() => result.current.updateAt(0, 9));
    expect(result.current.list).toEqual([9, 2]);
    act(() => result.current.removeAt(0));
    expect(result.current.list).toEqual([2]);
    act(() => result.current.clear());
    expect(result.current.list).toEqual([]);
  });
});
