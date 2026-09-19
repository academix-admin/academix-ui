/**
 * Routes registered through `additionalNavLinks` must survive the URL.
 *
 * Reported live (store-manager): each tab kept only its front page in `navLink` and registered the
 * rest through `additionalNavLinks`. Pushing encoded each route by its position in the MERGED map
 * — "aH", the 34th — but restoring from the URL (a reload, a browser Back) decoded against `navLink`
 * alone. "aH" was not found there, so the raw code was pushed as a route name: an empty page, a
 * Back with nothing behind it, and URLs for sibling stacks written from the wrong map.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';

const Root = () => <div>root</div>;

// Enough extra routes that the one we push encodes past the single-letter range.
const extra: Record<string, React.ComponentType> = {};
for (let i = 0; i < 40; i += 1) {
  const name = `page_${i}`;
  extra[name] = () => <div>{name}</div>;
}
const EXTRA = [extra];

function App() {
  return (
    <NavigationStack
      id="s"
      navLink={{ root: Root }}
      additionalNavLinks={EXTRA}
      entry="root"
      syncHistory
    />
  );
}

async function settle(ms = 150) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('additionalNavLinks and the URL', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('a pushed additional route comes back from the URL by its own name', async () => {
    const first = render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    await act(async () => {
      await api.push('page_33', { id: 'x' });
    });
    await settle();
    expect(api.peek()?.key).toBe('page_33');
    const url = window.location.href;

    // A reload: the stack is rebuilt from the URL alone.
    first.unmount();
    getRegistry().delete('s');
    sessionStorage.clear();
    window.history.replaceState({}, '', url);
    render(<App />);
    await settle();

    const restored = getRegistry().get('s')!.api!;
    expect(restored.getStack().map((e) => e.key)).toEqual(['root', 'page_33']);
  });

  it('browser Back between additional routes lands on the right one', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    await act(async () => {
      await api.push('page_30');
    });
    await settle();
    await act(async () => {
      await api.push('page_35');
    });
    await settle();

    await act(async () => {
      window.history.back();
    });
    await settle(300);

    expect(api.getStack().map((e) => e.key)).toEqual(['root', 'page_30']);
  });
});
