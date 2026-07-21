import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useDemandState,
  createStateStack,
  StateStack,
  type StorageAdapter,
} from '../src/index';

/** In-memory recording adapter so we can assert on the persistence path. */
function makeRecordingAdapter(): StorageAdapter & {
  setItem: ReturnType<typeof vi.fn>;
} {
  const map = new Map<string, string>();
  return {
    getItem: vi.fn(async (k: string) => map.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      map.set(k, v);
    }),
    removeItem: vi.fn(async (k: string) => {
      map.delete(k);
    }),
    clear: vi.fn(async () => map.clear()),
    getAllKeys: vi.fn(async () => [...map.keys()]),
  };
}

describe('useDemandState', () => {
  it('returns the initial value and updates via set', async () => {
    const { result } = renderHook(() =>
      useDemandState('hello', { scope: 'ds-basic', key: 'k', persist: false })
    );
    expect(result.current[0]).toBe('hello');
    act(() => result.current[2]('world'));
    await waitFor(() => expect(result.current[0]).toBe('world'));
    act(() => result.current[2]((p) => p + '!'));
    await waitFor(() => expect(result.current[0]).toBe('world!'));
  });

  it('isolates values by scope', async () => {
    const a = renderHook(() =>
      useDemandState(0, { scope: 'ds-scope-a', key: 'n', persist: false })
    );
    const b = renderHook(() =>
      useDemandState(0, { scope: 'ds-scope-b', key: 'n', persist: false })
    );
    act(() => a.result.current[2](1));
    await waitFor(() => expect(a.result.current[0]).toBe(1));
    expect(b.result.current[0]).toBe(0);
  });

  it('writes to the storage adapter when persist is enabled', async () => {
    const storage = makeRecordingAdapter();
    const { result } = renderHook(() =>
      useDemandState('v0', { scope: 'ds-persist', key: 'k', persist: true, storage })
    );
    act(() => result.current[2]('v1'));
    await waitFor(() => expect(storage.setItem).toHaveBeenCalled());
  });

  it('clears a value via the control object', async () => {
    const { result } = renderHook(() =>
      useDemandState('data', { scope: 'ds-clear', key: 'k', persist: false })
    );
    act(() => result.current[2]('changed'));
    await waitFor(() => expect(result.current[0]).toBe('changed'));
    act(() => result.current[3].clear());
    await waitFor(() => expect(result.current[0]).toBe('data'));
  });
});

describe('createStateStack', () => {
  const { useStack } = createStateStack({
    counter: {
      inc: (s: { n: number }) => ({ n: s.n + 1 }),
      add: (s: { n: number }, by: number) => ({ n: s.n + by }),
    },
  });

  it('exposes state, methods and metadata', () => {
    const { result } = renderHook(() =>
      useStack('counter', { initial: { n: 0 } }, 'cs-shape')
    );
    expect(result.current.counter).toEqual({ n: 0 });
    expect(typeof result.current.counter$.inc).toBe('function');
    expect(typeof result.current.__meta.undo).toBe('function');
  });

  it('applies method transitions', async () => {
    const { result } = renderHook(() =>
      useStack('counter', { initial: { n: 0 } }, 'cs-methods')
    );
    await act(async () => {
      await result.current.counter$.inc();
      await result.current.counter$.add(5);
    });
    await waitFor(() => expect(result.current.counter.n).toBe(6));
  });

  it('supports undo/redo', async () => {
    const { result } = renderHook(() =>
      useStack('counter', { initial: { n: 0 }, historyDepth: 10 }, 'cs-undo')
    );
    await act(async () => {
      await result.current.counter$.inc();
    });
    await waitFor(() => expect(result.current.counter.n).toBe(1));
    await act(async () => {
      await result.current.__meta.undo();
    });
    await waitFor(() => expect(result.current.counter.n).toBe(0));
    await act(async () => {
      await result.current.__meta.redo();
    });
    await waitFor(() => expect(result.current.counter.n).toBe(1));
  });

  it('runs middleware', async () => {
    const { useStack: useCappedStack } = createStateStack({
      capped: { set: (_s: { n: number }, n: number) => ({ n }) },
    });
    const { result } = renderHook(() =>
      useCappedStack(
        'capped',
        {
          initial: { n: 0 },
          middleware: [(_prev, next) => ({ n: Math.min(next.n, 10) })],
        },
        'cs-mw'
      )
    );
    await act(async () => {
      await result.current.capped$.set(999);
    });
    await waitFor(() => expect(result.current.capped.n).toBe(10));
  });
});

describe('StateStack facade', () => {
  it('clears a scope', async () => {
    const { result } = renderHook(() =>
      useDemandState('x', { scope: 'facade-clear', key: 'k', persist: false })
    );
    act(() => result.current[2]('y'));
    await waitFor(() => expect(result.current[0]).toBe('y'));
    await act(async () => {
      await StateStack.clearScope('facade-clear');
    });
    await waitFor(() => expect(result.current[0]).toBe('x'));
  });
});
