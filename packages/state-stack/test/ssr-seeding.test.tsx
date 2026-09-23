/**
 * The patterns the README's server section documents, run rather than asserted on a page.
 *
 * This package is client-only — every file it ships carries 'use client' — so an app that already
 * has the data on the server hands it in as a prop and seeds the client's copy. That is a two-line
 * pattern with a sharp edge in it (seed only while nothing has been read, or the seed overwrites a
 * fresher answer), which is exactly the kind of thing that should not live only in prose.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDemandResource } from '../src/index';

let uid = 0;
const uniqScope = () => `ssr-seed-${Date.now()}-${uid++}`;

describe('seeding a resource with what the server already sent', () => {
  it('shows the seeded value until the read lands, then the read wins', async () => {
    const scope = uniqScope();
    let release: (v: string[]) => void = () => {};
    const fetcher = vi.fn(() => new Promise<string[]>((r) => { release = r; }));

    const { result } = renderHook(() => {
      const res = useDemandResource<string[]>(fetcher, { key: 'k', scope, persist: false, deps: [] });
      React.useEffect(() => {
        if (!res.loaded) res.setData(['from the server']);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [res.loaded]);
      return res;
    });

    // Somebody sees the server's copy immediately, rather than a spinner over data we already have.
    await waitFor(() => expect(result.current.data).toEqual(['from the server']));
    expect(result.current.loaded).toBe(true);

    await act(async () => {
      release(['from the read']);
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.data).toEqual(['from the read']);
  });

  it('does not suspend — there is a value to branch on instead', async () => {
    /*
     * Documented as a decision rather than a gap. Suspending means "show nothing until ready", and
     * a screen that already has an answer must keep showing it. If these hooks threw a promise,
     * every refresh would blank the screen it was refreshing.
     */
    const scope = uniqScope();
    const fetcher = vi.fn(async () => ['done']);

    let threw: unknown = null;
    const { result } = renderHook(() => {
      try {
        return useDemandResource<string[]>(fetcher, { key: 'k', scope, persist: false, deps: [] });
      } catch (e) {
        threw = e;
        throw e;
      }
    });

    expect(threw).toBeNull();
    // Nothing yet, and it says so through `loaded` rather than by not rendering.
    expect(result.current.loaded).toBe(false);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.data).toEqual(['done']);
  });
});
