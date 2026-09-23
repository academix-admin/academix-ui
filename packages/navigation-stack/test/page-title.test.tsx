/**
 * `nav.title()` — a page saying what it is called.
 *
 * The browser's title is one string and a group mounts every tab at once, so the interesting
 * question is never "does it set the title" but "which of the five mounted stacks is allowed to".
 */
import React from 'react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { cleanup, act, render } from '@testing-library/react';
import { renderInStack } from '../src/testing';
import NavigationStack, { GroupNavigationStack, useNav } from '../src/index';

afterEach(() => cleanup());
beforeEach(() => { document.title = 'The app'; });

function Named({ name }: { name: string }) {
  const nav = useNav();
  nav.title(name);
  return <p>{name}</p>;
}

const Stock = () => <Named name="Stock" />;
const Product = () => <Named name="Gulder 60cl" />;
const Untitled = () => <p>no name</p>;

describe('nav.title', () => {
  it('names the page, and the browser shows it', async () => {
    const { settle } = renderInStack(<Stock />);
    await settle();
    expect(document.title).toBe('Stock');
  });

  it('follows the top of the stack, and comes back on the way down', async () => {
    const { nav, settle } = renderInStack(<Stock />, { navLink: { product: Product } });
    await settle();
    expect(document.title).toBe('Stock');

    await nav.push('product');
    await settle();
    expect(document.title).toBe('Gulder 60cl');

    // The page underneath never re-rendered, and its name comes back anyway: the name lives on the
    // ENTRY, not in a component's state.
    await nav.pop();
    await settle();
    expect(document.title).toBe('Stock');
  });

  it('leaves the title alone when the top page has no name', async () => {
    const { nav, settle } = renderInStack(<Stock />, { navLink: { plain: Untitled } });
    await settle();
    await nav.push('plain');
    await settle();
    // Back to what it was when the stack mounted — NOT still claiming to be the page underneath.
    expect(document.title).toBe('The app');
  });

  it('is idempotent, so calling it in a render body is safe', async () => {
    let renders = 0;
    function Counts() {
      const nav = useNav();
      nav.title('Same name');
      renders += 1;
      return <p>counts</p>;
    }
    const { settle } = renderInStack(<Counts />);
    await settle(30);
    const settledAt = renders;
    await settle(30);
    // Setting the same name again does not publish a change, so nothing re-renders in a loop.
    expect(renders).toBe(settledAt);
    expect(document.title).toBe('Same name');
  });

  it('names the page that CALLED it, even when that page is not on top', async () => {
    const { nav, stack, settle } = renderInStack(<Stock />, { navLink: { product: Product } });
    await settle();
    await nav.push('product');
    await settle();

    // Stock is underneath and named itself on mount; the entry still carries that name.
    expect(stack()[0].metadata?.title).toBe('Stock');
    expect(stack()[1].metadata?.title).toBe('Gulder 60cl');
  });

  it('ONLY THE STACK ON SCREEN writes the title, though every tab is mounted', async () => {
    /*
     * The failure this prevents: five mounted tabs each setting document.title, where the winner is
     * whichever rendered last — so the browser says "Rewards" while somebody is looking at Stock.
     */
    const navStack = new Map<string, React.ReactElement>([
      ['a', <NavigationStack key="a" id="ta" navLink={{ page: Stock }} entry="page" transitionDuration={0} />],
      ['b', <NavigationStack key="b" id="tb" navLink={{ page: Product }} entry="page" transitionDuration={0} />],
    ]);

    function Tabs({ current }: { current: string }) {
      return <GroupNavigationStack id="g" navStack={navStack} current={current} />;
    }

    const view = render(<Tabs current="a" />);
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    expect(document.title).toBe('Stock');

    view.rerender(<Tabs current="b" />);
    await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
    expect(document.title).toBe('Gulder 60cl');
  });
});
