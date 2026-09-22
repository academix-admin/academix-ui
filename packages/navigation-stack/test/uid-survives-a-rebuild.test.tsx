/**
 * An entry keeps its uid when its stack is rebuilt.
 *
 * Everything keyed by a uid is a fact about ONE entry that has to survive that: the scroll position
 * above all (`scroll/index.ts` keys on it). A tab switch unmounts the stack that leaves and rebuilds
 * it from the URL on the way back, so a uid that names a moment rather than a place renames every
 * entry — and every page the shop had scrolled through opens at the top again. Reported from a real
 * shop, which is also how it was found: "it start from top after I changed group and came back".
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';

const P = (name: string) => () => <div>{name}</div>;
const links = { home: P('home'), list: P('list'), detail: P('detail') };

function App() {
  return <NavigationStack id="s" navLink={links} entry="home" syncHistory />;
}

async function settle(ms = 300) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('a uid names a place in the stack', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/app');
  });
  afterEach(() => cleanup());

  it('survives the stack being unmounted and rebuilt', async () => {
    const first = render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    await act(async () => {
      await api.push('list');
    });
    await settle();
    await act(async () => {
      await api.push('detail', { id: '7' });
    });
    await settle();
    const before = api.getStack().map((e) => e.uid);

    // What a tab switch does: this stack goes away, and comes back from the URL.
    const href = window.location.href;
    const state = window.history.state;
    first.unmount();
    getRegistry().delete('s');
    window.history.replaceState(state, '', href);
    render(<App />);
    await settle(400);

    const after = getRegistry().get('s')!.api!.getStack().map((e) => e.uid);
    expect(after, 'the same entries, named the same way').toEqual(before);
  });

  it('still tells two copies of one page apart', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    for (const k of ['list', 'detail', 'list']) {
      await act(async () => {
        await api.push(k);
      });
      await settle();
    }
    const uids = api.getStack().map((e) => e.uid);
    expect(new Set(uids).size, uids.join(' | ')).toBe(uids.length);
  });
});
