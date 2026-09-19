/**
 * The header's Back (api.pop), then the browser's Forward and Back.
 *
 * Probed live: a → b → c → d, popped three times with the app's own back arrow, then browser
 * Forward showed nothing new and browser Back landed on c.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';

const P = (name: string) => () => <div>{name}</div>;
const links = { a: P('a'), b: P('b'), c: P('c'), d: P('d') };

async function settle(ms = 200) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('pop, then the browser', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('after popping to the root, Forward then Back ends on the root', async () => {
    render(<NavigationStack id="s" navLink={links} entry="a" syncHistory />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    for (const k of ['b', 'c', 'd']) {
      await act(async () => {
        await api.push(k);
      });
      await settle();
    }
    for (let i = 0; i < 3; i += 1) {
      await act(async () => {
        await api.pop();
      });
      await settle(300);
    }
    expect(api.getStack().map((e) => e.key)).toEqual(['a']);

    await act(async () => {
      window.history.forward();
    });
    await settle(300);
    const afterForward = api.getStack().map((e) => e.key);

    await act(async () => {
      window.history.back();
    });
    await settle(300);
    expect(afterForward, 'forward re-opens b').toEqual(['a', 'b']);
    expect(api.getStack().map((e) => e.key)).toEqual(['a']);
  });
});
