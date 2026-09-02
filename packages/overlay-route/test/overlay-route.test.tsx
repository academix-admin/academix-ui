/**
 * The package standing on its own, and the seam it offers to a navigation library.
 *
 * These are the promises a consumer is entitled to rely on: a sheet gets a real entry so Back
 * closes it; closing by a button takes that entry away again so the next Back is not dead; a
 * reload either puts the sheet back or stops claiming it; and a navigation library that takes over
 * the writing sees every entry this package creates.
 */
import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { useOverlayRoute } from '../src/use-overlay-route';
import {
  readOverlayFragment,
  writeOverlayFragment,
  closeUnrestoredOverlay,
  resetOverlaySettle,
} from '../src/fragment';
import { resetOverlayClaims, isOverlayClaimed, overlayClaims } from '../src/claims';
import { setHistoryWriter, hasExternalHistoryWriter } from '../src/writer';
import { parseFragment, setInFragment } from '../src/fragment-codec';

async function settle(ms = 60) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

/** Long enough for the two-frame settle plus its fallback timer. */
const afterSettle = () => settle(500);

function Sheet({
  name = 'sheet:one',
  startOpen = false,
  restore,
}: {
  name?: string;
  startOpen?: boolean;
  restore?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  useOverlayRoute(
    name,
    open,
    () => setOpen(false),
    restore ? { onRestore: () => setOpen(true) } : undefined,
  );
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        close
      </button>
      {open && <div>SHEET</div>}
    </>
  );
}

describe('overlay-route', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/app');
    resetOverlayClaims();
    resetOverlaySettle();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('gives an open overlay its own history entry', async () => {
    const view = render(<Sheet />);
    await settle();

    const before = window.history.length;
    await act(async () => { view.getByText('open').click(); });
    await settle();

    expect(view.queryByText('SHEET'), 'the sheet is open').toBeTruthy();
    expect(readOverlayFragment(), 'and named in the URL').toBe('sheet:one');
    expect(
      window.history.length,
      'with a real entry, which is what makes the back gesture close it',
    ).toBe(before + 1);
    expect(isOverlayClaimed('sheet:one'), 'and it says it is on screen').toBe(true);
  });

  it('closes when the fragment goes, which is what Back does', async () => {
    const view = render(<Sheet />);
    await settle();
    await act(async () => { view.getByText('open').click(); });
    await settle();

    // What the browser does on Back: the previous entry's URL, then a popstate.
    await act(async () => {
      const url = new URL(window.location.href);
      url.hash = setInFragment(url.hash, null);
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });
    await settle();

    expect(view.queryByText('SHEET'), 'Back closed the sheet').toBeNull();
  });

  it('takes its entry back when closed by a button, so the next Back is not dead', async () => {
    const view = render(<Sheet />);
    await settle();
    await act(async () => { view.getByText('open').click(); });
    await settle();

    const back = vi.spyOn(window.history, 'back');
    await act(async () => { view.getByText('close').click(); });
    await settle(80); // the cleanup defers by a tick, deliberately

    expect(
      back,
      'closing by a button must step off the entry it pushed, or the next Back does nothing at all',
    ).toHaveBeenCalled();
    expect(isOverlayClaimed('sheet:one'), 'and it stops claiming to be on screen').toBe(false);
  });

  it('puts a restorable sheet back after a reload, and keeps its name', async () => {
    // What a reload leaves behind: the fragment, and nothing else.
    writeOverlayFragment('sheet:one', 'replace');
    resetOverlayClaims();
    resetOverlaySettle();

    const view = render(<Sheet restore />);
    await afterSettle();

    expect(view.queryByText('SHEET'), 'the sheet came back').toBeTruthy();
    expect(readOverlayFragment(), 'and its name stayed').toBe('sheet:one');
    expect(overlayClaims(), 'because it claimed it').toContain('sheet:one');
  });

  it('closes a sheet nothing puts back, without being asked', async () => {
    writeOverlayFragment('sheet:one', 'replace');
    resetOverlayClaims();
    resetOverlaySettle();

    // A sheet that does NOT restore: mounting it schedules the settle, and its own name is not
    // claimed because it is not open.
    render(<Sheet />);
    await afterSettle();

    expect(
      readOverlayFragment(),
      'a URL naming a sheet nobody is showing costs a whole Back press',
    ).toBeNull();
  });

  it('leaves the rest of the fragment alone', () => {
    window.history.replaceState({}, '', '/app#section-3&ax=mine&other=1');
    const parsed = parseFragment(window.location.hash);
    expect(parsed.ours).toBe('mine');
    expect(parsed.foreign, 'a docs anchor and a foreign segment are not ours to touch').toEqual([
      'section-3',
      'other=1',
    ]);
    expect(setInFragment(window.location.hash, null)).toBe('section-3&other=1');
  });

  it('hands writing to a navigation library that asks for it', async () => {
    const seen: { mode: string; href: string }[] = [];
    const restore = setHistoryWriter(({ mode, href, state }) => {
      seen.push({ mode, href });
      // A real one would also record the entry in its own ledger; here we only need to prove it
      // was asked, and that the write still lands.
      if (mode === 'push') window.history.pushState({ ...state }, '', href);
      else window.history.replaceState({ ...(window.history.state ?? {}), ...state }, '', href);
    });

    expect(hasExternalHistoryWriter(), 'something took over').toBe(true);

    const view = render(<Sheet />);
    await settle();
    await act(async () => { view.getByText('open').click(); });
    await settle();

    expect(
      seen.some((w) => w.mode === 'push' && w.href.includes('ax=sheet')),
      'the overlay’s entry went through the navigation library, so its ledger can count it — ' +
        'an entry it does not know about leaves every later pop short by one',
    ).toBe(true);

    restore();
    expect(hasExternalHistoryWriter(), 'and it can be handed back').toBe(false);
  });

  it('is a no-op on a boot with no sheet named', () => {
    expect(closeUnrestoredOverlay()).toBe(false);
  });
});
