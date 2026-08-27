/**
 * Invalidating a scope must FETCH AGAIN, not just empty the value.
 *
 * `clearScope` dropped the demand flag and the cached value, which looks correct in isolation:
 * `isDemanded` goes false, so the next `demand()` call would run the loader. But a mounted
 * consumer has no reason to call `demand()` again — its effect already ran, and neither its deps
 * nor the callback identity changed. So the value went to empty and STAYED there.
 *
 * The shape of the reported bug: a screen invalidates its own cache after writing something, and
 * then sits on a loading state forever with no request in flight and no error to show for it. The
 * clear worked; nothing followed it.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { StateStack, useDemandState } from '../src/index';

let uid = 0;
const uniqScope = () => `invalidation-test-${Date.now()}-${uid++}`;

describe('clearScope re-runs the loader in mounted consumers', () => {
  it('fetches again after the scope is cleared', async () => {
    const scope = uniqScope();
    let n = 0;
    const load = vi.fn(async () => `value-${++n}`);

    const { result } = renderHook(() => {
      const [value, demand] = useDemandState<string>('', {
        key: 'k',
        scope,
        persist: false,
        deps: [],
      });
      // What a consumer actually writes: ask once, on mount.
      React.useEffect(() => {
        demand(async ({ set }) => set(await load()));
      }, [demand]);
      return value;
    });

    await waitFor(() => expect(result.current).toBe('value-1'));
    expect(load).toHaveBeenCalledTimes(1);

    // Something elsewhere writes and invalidates — a sale settled, a payment recorded.
    await act(async () => {
      await StateStack.core.clearScope(scope, false);
    });

    // The loader runs again and the consumer ends up with the NEW value, not an empty one.
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current).toBe('value-2'));
  });

  it('does not re-run on an ordinary set', async () => {
    const scope = uniqScope();
    const load = vi.fn(async () => 'loaded');

    const { result } = renderHook(() => {
      const [value, demand, set] = useDemandState<string>('', {
        key: 'k',
        scope,
        persist: false,
        deps: [],
      });
      React.useEffect(() => {
        demand(async ({ set: s }) => s(await load()));
      }, [demand]);
      return { value, set };
    });

    await waitFor(() => expect(result.current.value).toBe('loaded'));
    expect(load).toHaveBeenCalledTimes(1);

    // A plain write marks the key demanded, so it must NOT be mistaken for an invalidation and
    // send the loader round again — that would be an infinite fetch on every set.
    await act(async () => {
      result.current.set('typed by hand');
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.value).toBe('typed by hand');
  });
});
