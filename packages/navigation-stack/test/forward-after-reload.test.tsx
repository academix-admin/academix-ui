/**
 * Back and Forward across a RELOAD, into entries the previous document wrote.
 *
 * Probed live (store-manager): a chain was followed, the page reloaded mid-stack, then the header's
 * back arrow walked back correctly — but the browser's Forward drew nothing and the Back after it
 * landed on the wrong page. After a reload the in-memory ledger is empty, so `pop` could not tell
 * "an entry of ours sits behind this one" from "this is the only entry there is", and took the
 * safe-looking option: replacing the entry it was standing on. That overwrote the entry the user had
 * just come back from, so Forward had nothing to return to.
 *
 * `axPushed` outlives the document and answers the question the ledger cannot after a reload.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';

const P = (name: string) => () => <div>{name}</div>;
const links = { a: P('a'), b: P('b'), c: P('c') };

function App() {
  return <NavigationStack id="s" navLink={links} entry="a" syncHistory />;
}

async function settle(ms = 300) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

/** Everything a reload keeps: the URL and each entry's own state. The document goes; they do not. */
async function reload(first: { unmount: () => void }, href: string, state: unknown) {
  first.unmount();
  getRegistry().delete('s');
  sessionStorage.clear();
  window.history.replaceState(state, '', href);
  render(<App />);
  await settle(400);
  return getRegistry().get('s')!.api!;
}

describe('Back and Forward across a reload', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/app');
  });
  afterEach(() => cleanup());

  it('pop then Forward re-opens the page that was popped', async () => {
    const first = render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    for (const k of ['b', 'c']) {
      await act(async () => {
        await api.push(k);
      });
      await settle();
    }
    const urlAtC = window.location.href;
    const stateAtC = window.history.state;

    const after = await reload(first, urlAtC, stateAtC);
    expect(after.getStack().map((e) => e.key), 'rebuilt from the URL').toEqual(['a', 'b', 'c']);

    // The header's own back arrow: steps back through the browser, leaving c's entry intact.
    await act(async () => {
      await after.pop();
    });
    await settle(400);
    expect(after.getStack().map((e) => e.key), 'back went to b').toEqual(['a', 'b']);

    await act(async () => {
      window.history.forward();
    });
    await settle(600);
    expect(after.getStack().map((e) => e.key), 'forward returns to c').toEqual(['a', 'b', 'c']);
    expect(window.location.href, 'and on c’s own URL').toBe(urlAtC);
  });

  it('a deep link with nothing behind it is not walked out of', async () => {
    // One entry, written by `replace` — a pasted link, or a new tab. There is no entry behind it,
    // and stepping back would leave the site.
    const first = render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    await act(async () => {
      await api.push('b');
    });
    await settle();

    const href = window.location.href;
    const deepLinkState = { ...window.history.state, axPushed: false };
    const entriesBefore = window.history.length;
    const after = await reload(first, href, deepLinkState);
    expect(after.getStack().map((e) => e.key)).toEqual(['a', 'b']);

    await act(async () => {
      await after.pop();
    });
    await settle(400);
    expect(after.getStack().map((e) => e.key), 'popped in place').toEqual(['a']);
    expect(window.history.length, 'without moving through history').toBe(entriesBefore);
  });

  it('an entry whose record is empty falls back to the URL, not to the root', async () => {
    const first = render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    for (const k of ['b', 'c']) {
      await act(async () => {
        await api.push(k);
      });
      await settle();
    }
    const urlAtC = window.location.href;
    // What our own teardown leaves behind: ax state with nothing in it.
    const blanked = { ...window.history.state, navStack: '' };
    const after = await reload(first, urlAtC, blanked);
    expect(after.getStack().map((e) => e.key)).toEqual(['a', 'b', 'c']);

    await act(async () => {
      await after.pop();
    });
    await settle(400);
    await act(async () => {
      window.history.forward();
    });
    await settle(600);
    expect(after.getStack().map((e) => e.key), 'the URL still knew where we were').toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
