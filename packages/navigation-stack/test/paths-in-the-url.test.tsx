/**
 * The stack in the address bar, as a path a person can read.
 *
 *     /s/7R8U2A/product/gulder-60cl~2d6ab81c-0e67-4bcd-ae22-38160f0f1965
 *
 * `?nav=` is a codec only this library reads: a person cannot read it, a crawler cannot index it,
 * and a link pasted into a message tells the person receiving it nothing. With `paths`, the stack on
 * screen writes the pathname instead.
 *
 * The property being tested is the round trip — whatever a push writes, a fresh load of that URL has
 * to rebuild. Everything else is decoration.
 */
import React from 'react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { cleanup, act, render } from '@testing-library/react';
import NavigationStack, { useLocation, useNav } from '../src/index';
import { getRegistry } from '../src/core/registry';

const Shop = () => <p>Shop</p>;
const Product = () => {
  const nav = useNav();
  // What a real page does: name itself once it knows what it is showing.
  nav.title('Gulder 60cl');
  const id = useLocation()?.params?.id as string | undefined;
  return <p>Gulder 60cl {id}</p>;
};
const routes = { shop_page: Shop, product_page: Product };

const mount = (id: string) =>
  render(
    <NavigationStack id={id} navLink={routes} entry="shop_page" paths syncHistory transitionDuration={0} />,
  );

const settle = async (ms = 60) => {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
};

let n = 0;
const freshId = () => `paths-${++n}`;

beforeEach(() => {
  window.history.replaceState({}, '', '/s/7R8U2A');
});
afterEach(() => cleanup());

describe('a stack written into the path', () => {
  it('starts at its entry, under the base it was mounted on', async () => {
    const id = freshId();
    mount(id);
    await settle();

    // The base is worked out from the URL, not declared: everything before our own first route.
    expect(getRegistry().get(id)?.pathMode?.base).toBe('/s/7R8U2A');
  });

  it('a push puts the page in the address bar, in words', async () => {
    const id = freshId();
    mount(id);
    await settle();

    const api = getRegistry().get(id)!.api!;
    await act(async () => { await api.push('product_page', { id: '2d6ab81c' }); });
    await settle();

    // Words first, identity after: a uuid would otherwise open every URL with 36 characters of noise
    // and a search result truncates the tail.
    expect(window.location.pathname).toContain('/s/7R8U2A/shop/product/');
    expect(window.location.pathname).toMatch(/gulder-60cl~/);
    // And the codec it replaces is gone, rather than disagreeing with it.
    expect(new URLSearchParams(window.location.search).get('nav')).toBeNull();
  });

  it('and a fresh load of that URL rebuilds the stack', async () => {
    const first = freshId();
    mount(first);
    await settle();
    const api = getRegistry().get(first)!.api!;
    await act(async () => { await api.push('product_page', { id: '7' }); });
    await settle();
    const shared = window.location.pathname;
    cleanup();

    // Somebody opens that link: a new page, a new stack, nothing in memory.
    const second = freshId();
    window.history.replaceState({}, '', shared);
    mount(second);
    await settle();

    const rebuilt = getRegistry().get(second)!.stack;
    expect(rebuilt.map((e) => e.key)).toEqual(['shop_page', 'product_page']);
    expect(rebuilt[1].params).toMatchObject({ id: '7' });
    expect(getRegistry().get(second)?.pathMode?.base).toBe('/s/7R8U2A');
  });

  it('renaming the page does not change where the link goes', async () => {
    // The words are decoration; identity is the params. A title that is translated or corrected
    // must not turn a working link into a 404.
    const id = freshId();
    window.history.replaceState({}, '', '/s/7R8U2A/shop/product/something-else-entirely~7');
    mount(id);
    await settle();

    const stack = getRegistry().get(id)!.stack;
    expect(stack.map((e) => e.key)).toEqual(['shop_page', 'product_page']);
    expect(stack[1].params).toMatchObject({ id: '7' });
  });

  it('leaves the URL alone when paths are off', async () => {
    const id = freshId();
    render(<NavigationStack id={id} navLink={routes} entry="shop_page" syncHistory transitionDuration={0} />);
    await settle();
    const api = getRegistry().get(id)!.api!;
    await act(async () => { await api.push('product_page', { id: '7' }); });
    await settle();

    // Opt-in, so every app that has not asked for it is untouched.
    expect(window.location.pathname).toBe('/s/7R8U2A');
    expect(new URLSearchParams(window.location.search).get('nav')).toBeTruthy();
  });
});
