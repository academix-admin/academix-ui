/**
 * ONE REQUEST'S DATA MUST NOT RENDER INTO ANOTHER'S HTML.
 *
 * In a browser there is one store because there is one person. On a server a module lives as long as
 * the process and is shared by every request it handles — so a store written while rendering one
 * shopper's page is readable while rendering the next shopper's, and what leaks is their cart, their
 * account, their prices.
 *
 * This has been harmless so far only because nothing WRITES during a server render. Server rendering
 * with data changes that, so these tests are the guard that goes in first.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StateStackProvider, createRequestStore } from '../src/index';
import { StateStack, useDemandState } from '../src/index';

let uid = 0;
const uniq = () => `req-${Date.now()}-${uid++}`;

/** A component tree rendered "for one request", with a store of its own. */
const forRequest = (store: ReturnType<typeof createRequestStore>) =>
  ({ children }: { children?: React.ReactNode }) => (
    <StateStackProvider store={store}>{children}</StateStackProvider>
  );

describe('a store per request', () => {
  it('keeps two requests apart', async () => {
    const scope = uniq();
    const a = createRequestStore();
    const b = createRequestStore();

    const first = renderHook(
      () => useDemandState<string>('', { key: 'basket', scope, persist: false, deps: [] }),
      { wrapper: forRequest(a) },
    );
    await act(async () => { first.result.current[2]('Ada’s basket'); });
    expect(first.result.current[0]).toBe('Ada’s basket');

    // A different request, rendering at the same moment on the same process.
    const second = renderHook(
      () => useDemandState<string>('', { key: 'basket', scope, persist: false, deps: [] }),
      { wrapper: forRequest(b) },
    );

    expect(second.result.current[0]).toBe('');
  });

  it('and neither of them touches the shared one', async () => {
    const scope = uniq();
    const store = createRequestStore();

    const { result } = renderHook(
      () => useDemandState<string>('', { key: 'k', scope, persist: false, deps: [] }),
      { wrapper: forRequest(store) },
    );
    await act(async () => { result.current[2]('only in this request'); });

    // The singleton — what a browser uses, and what would leak.
    expect(StateStack.core.getStateSync(scope, 'k', null)).toBeNull();
  });

  it('without a provider it is the shared store, exactly as before', async () => {
    // Every existing app provides nothing, and must behave identically.
    const scope = uniq();
    const { result } = renderHook(() =>
      useDemandState<string>('', { key: 'k', scope, persist: false, deps: [] }),
    );
    await act(async () => { result.current[2]('shared'); });

    expect(StateStack.core.getStateSync(scope, 'k', null)).toBe('shared');
  });

  it('a request store forgets everything when the request is over', async () => {
    // Nothing to clear and nothing to expire: it is garbage once the response is written.
    const scope = uniq();
    const store = createRequestStore();
    const { result, unmount } = renderHook(
      () => useDemandState<string>('', { key: 'k', scope, persist: false, deps: [] }),
      { wrapper: forRequest(store) },
    );
    await act(async () => { result.current[2]('gone with the response'); });
    unmount();

    const next = createRequestStore();
    expect(next.getStateSync(scope, 'k', null)).toBeNull();
  });
});
