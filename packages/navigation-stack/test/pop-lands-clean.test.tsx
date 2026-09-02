/**
 * A pop lands on a page, with nothing open on top of it.
 *
 * `updateNavQueryParamForStack` already clears the overlay fragment on a PUSH, and for a good
 * reason: the new page has no sheet open, and carrying `#ax=…` onto it tells every overlay its own
 * id is still on top. A pop needs the same rule and did not have it — it cannot write the URL at
 * all (the browser restores the target entry's), so whatever fragment that entry was written with
 * comes back with it.
 *
 * Seen in store-manager: tapping an already-active tab returned to that tab's first page with
 * `#ax=sell:picker` restored — a picker belonging to a different tab, named in the URL of a page
 * that has no picker open.
 *
 * A BROWSER Back onto such an entry is a different matter and is left alone: going back to where
 * you were, sheet included, is what the platform's own gesture means.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { writeOverlayFragment, readOverlayFragment } from '../src/overlay/hash';
import { getRegistry } from '../src/core/registry';
import { resetEntryLog, resetPushDepth } from '../src/core/persistence';

const A = () => <div>ROOT</div>;
const B = () => <div>B</div>;

function App() {
  return <NavigationStack id="s" navLink={{ a: A, b: B }} entry="a" syncHistory />;
}

async function settle(ms = 150) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('a programmatic pop lands with no overlay named in the URL', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetEntryLog();
    resetPushDepth('s');
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('clears a fragment the target entry was carrying', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    /*
     * A picker opens on the root page, and the page is pushed from inside it — the ordinary
     * "choose something, then go to it" journey. The root's entry therefore keeps the picker's
     * fragment, because that is what was true when it was written.
     */
    await act(async () => { writeOverlayFragment('picker:one', 'replace'); });
    await settle();
    expect(readOverlayFragment(), 'the picker is named while it is open').toBe('picker:one');

    await act(async () => { await api.push('b'); });
    await settle();
    expect(readOverlayFragment(), 'and not carried onto the pushed page').toBeNull();

    await act(async () => { await api.pop(); });
    await settle(300);

    expect(api.length(), 'the pop landed on the root').toBe(1);
    expect(
      readOverlayFragment(),
      'and nothing is open on it, so nothing should be named in the URL',
    ).toBeNull();
  });

  it('leaves a browser Back alone, sheet and all', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    // A sheet opens on the pushed page: its own entry, so the platform gesture closes it.
    await act(async () => { writeOverlayFragment('sheet:two', 'push'); });
    await settle();

    const atSheet = window.history.state;
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: atSheet }));
    });
    await settle();

    expect(
      readOverlayFragment(),
      'the user going back through a sheet is the platform’s business, not ours to rewrite',
    ).toBe('sheet:two');
  });
});
