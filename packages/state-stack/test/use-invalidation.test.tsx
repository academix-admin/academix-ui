/**
 * "Something changed — read it again", for screens that own their loader.
 *
 * `useDemandState` is already reached: invalidating a scope clears its keys' demand flags and the
 * next `demand()` runs. Nothing reached a paginated list, an infinite scroll or a read that
 * assembles several calls, because those own the loader and the package cannot call it.
 *
 * So consumers cleared the scope instead, and clearing is a different thing wearing the same coat:
 * it empties what is on screen. The bug it produced, twice, in a real shop — saving one product
 * blanked the whole stock list, and LEAVING a customer's account blanked the people list behind it.
 * What is checked here is that the notification arrives without the value being thrown away.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { StateStack, useInvalidation, useDemandState } from '../src/index';

let uid = 0;
const uniqScope = () => `use-invalidation-test-${Date.now()}-${uid++}`;

describe('useInvalidation', () => {
  it('runs when the scope is invalidated', () => {
    const scope = uniqScope();
    const reload = vi.fn();
    renderHook(() => useInvalidation(scope, reload));

    act(() => StateStack.core.invalidateScope(scope));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('hears nothing about another scope', () => {
    const reload = vi.fn();
    renderHook(() => useInvalidation(uniqScope(), reload));

    act(() => StateStack.core.invalidateScope(uniqScope()));
    expect(reload).not.toHaveBeenCalled();
  });

  it('stops when the screen unmounts', () => {
    const scope = uniqScope();
    const reload = vi.fn();
    const { unmount } = renderHook(() => useInvalidation(scope, reload));

    unmount();
    act(() => StateStack.core.invalidateScope(scope));
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not resubscribe when the callback is a fresh closure each render', () => {
    // The usual call is `useInvalidation(scope, () => reload())` — a new function every render. If
    // the subscription followed the function it would tear down and rebuild constantly, and a
    // notification arriving mid-render would land on nobody.
    const scope = uniqScope();
    const calls: number[] = [];
    const { rerender } = renderHook(({ n }: { n: number }) => {
      useInvalidation(scope, () => calls.push(n));
    }, { initialProps: { n: 1 } });

    rerender({ n: 2 });
    rerender({ n: 3 });
    act(() => StateStack.core.invalidateScope(scope));

    // Subscribed once, and running the LATEST callback rather than the one from the first render.
    expect(calls).toEqual([3]);
  });

  it('subscribes to nothing while the scope is null', () => {
    // A screen waiting on an id or a signed-in person calls this before it knows its scope.
    const reload = vi.fn();
    const { rerender } = renderHook(({ s }: { s: string | null }) => useInvalidation(s, reload), {
      initialProps: { s: null as string | null },
    });

    const scope = uniqScope();
    act(() => StateStack.core.invalidateScope(scope));
    expect(reload).not.toHaveBeenCalled();

    rerender({ s: scope });
    act(() => StateStack.core.invalidateScope(scope));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('survives a listener that unsubscribes itself as it runs', () => {
    // Real screens do this: the callback navigates away, which unmounts a sibling that is also
    // listening. Iterating the live set would skip it.
    const scope = uniqScope();
    const second = vi.fn();
    const first = vi.fn(() => unmountFirst());
    const a = renderHook(() => useInvalidation(scope, first));
    renderHook(() => useInvalidation(scope, second));
    const unmountFirst = () => a.unmount();

    act(() => StateStack.core.invalidateScope(scope));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('is told AFTER the scope is marked stale, so re-reading actually reads', async () => {
    /*
     * The ordering that makes this useful at all. `demand()` returns early on a key it has already
     * served, so a listener told BEFORE the flags are cleared would ask for a re-read and be
     * refused — the silent version of this feature not working.
     *
     * Checked by looking at the flag from inside the listener, which is the only place the order is
     * observable. Asserting it through a re-read does not work: `demand` settles a microtask later
     * by which time both orders look the same, so that test passed with the notification moved to
     * the top of `invalidateScope` and was guarding nothing.
     */
    const scope = uniqScope();
    let demandedWhenTold: boolean | null = null;

    renderHook(() => {
      const [, demand] = useDemandState<string>('', { key: 'k', scope, persist: false, deps: [] });
      React.useEffect(() => {
        void demand(async ({ set }) => set('first'));
      }, [demand]);
      useInvalidation(scope, () => {
        demandedWhenTold = StateStack.core.isDemanded(scope, 'k');
      });
    });

    await waitFor(() => expect(StateStack.core.isDemanded(scope, 'k')).toBe(true));

    act(() => StateStack.core.invalidateScope(scope));
    expect(demandedWhenTold).toBe(false);
  });

  it('keeps the value on screen while it re-reads', async () => {
    // The whole reason this exists rather than clearScope: nothing blanks.
    const scope = uniqScope();
    const load = vi.fn(async () => 'first');

    const { result } = renderHook(() => {
      const [value, demand] = useDemandState<string>('', { key: 'k', scope, persist: false, deps: [] });
      const read = () => demand(async ({ set }) => set(await load()));
      React.useEffect(() => { void read(); }, [demand]);
      useInvalidation(scope, () => void read());
      return value;
    });

    await waitFor(() => expect(result.current).toBe('first'));
    act(() => StateStack.core.invalidateScope(scope));
    expect(result.current).toBe('first');
  });
});
