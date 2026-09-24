/**
 * CARRYING WHAT THE SERVER FETCHED INTO THE BROWSER.
 *
 * Without this, a server-rendered page renders the product, ships the HTML, and then the browser
 * fetches the very same product again — so the screen flashes from filled to empty to filled, and
 * the shop pays for two reads of one thing. Every framework solves it the same way: serialise the
 * cache into the page, put it back before the first render.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { StateStackProvider, createRequestStore, StateStack, useDemandResource, getDefaultStorage } from '../src/index';

let uid = 0;
const uniq = () => `dehydrate-${Date.now()}-${uid++}`;

const forRequest = (store: ReturnType<typeof createRequestStore>) =>
  ({ children }: { children?: React.ReactNode }) => (
    <StateStackProvider store={store}>{children}</StateStackProvider>
  );

describe('dehydrate and hydrate', () => {
  it('carries what one store knows into another', async () => {
    const scope = uniq();
    const server = createRequestStore();
    await server.setState(scope, 'product:7', { name: 'Gulder 60cl', price: 12500 }, false, getDefaultStorage());

    const carried = server.dehydrate();
    expect(carried[scope]['product:7']).toEqual({ name: 'Gulder 60cl', price: 12500 });
    // Plain data: it has to survive being written into a <script> tag and read back.
    expect(JSON.parse(JSON.stringify(carried))).toEqual(carried);

    const browser = createRequestStore();
    browser.hydrate(carried);
    expect(browser.getStateSync(scope, 'product:7', null)).toEqual({ name: 'Gulder 60cl', price: 12500 });
  });

  it('a hydrated value is ALREADY the answer, so nothing fetches it again', async () => {
    /*
     * The point of the whole exercise. A hydrated key is marked demanded, so a hook that finds it
     * present does not immediately ask for it — which would flash the screen empty and pay for the
     * read twice.
     */
    const scope = uniq();
    const server = createRequestStore();
    await server.setState(scope, 'product:7', { name: 'Gulder 60cl' }, false, getDefaultStorage());

    const browser = createRequestStore();
    browser.hydrate(server.dehydrate());

    let reads = 0;
    const { result } = renderHook(
      () =>
        useDemandResource<{ name: string }>(
          async () => { reads += 1; return { name: 'fetched again' }; },
          { key: 'product:7', scope, persist: false, deps: [] },
        ),
      { wrapper: forRequest(browser) },
    );

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.data).toEqual({ name: 'Gulder 60cl' });
    expect(reads).toBe(0);
  });

  it('does not overwrite something newer that is already there', async () => {
    // The page is a snapshot of a moment that has passed. Anything the browser already knows was
    // learned after it.
    const scope = uniq();
    const browser = createRequestStore();
    await browser.setState(scope, 'k', 'what the browser knows', false, getDefaultStorage());
    browser.hydrate({ [scope]: { k: 'what the page said' } });

    expect(browser.getStateSync(scope, 'k', null)).toBe('what the browser knows');
  });

  it('shrugs at nothing', () => {
    const store = createRequestStore();
    expect(() => store.hydrate(null)).not.toThrow();
    expect(() => store.hydrate(undefined)).not.toThrow();
    expect(store.dehydrate()).toEqual({});
  });

  it('is on the façade too, for an app that wires it by hand', () => {
    expect(typeof StateStack.dehydrate).toBe('function');
    expect(typeof StateStack.hydrate).toBe('function');
  });
});
