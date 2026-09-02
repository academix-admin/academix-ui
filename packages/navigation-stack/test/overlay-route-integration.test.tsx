/**
 * A sheet package and a navigation package, cooperating without importing each other.
 *
 * `@academix-admin/overlay-route` gives any overlay a real history entry so the platform's Back
 * closes the sheet. This library pops pages by asking `history.go(-n)`, which counts positions in
 * the browser's single global list — so an entry it has never heard of leaves every later pop short
 * by one. Measured before they met: one picker opened anywhere in a journey, and a Back press
 * landed on another tab's page with the picker's own fragment restored into the URL.
 *
 * Neither should have to know the other exists — a sheet package dragging in a router would be
 * absurd, and a router knowing about sheets would be guessing at somebody else's UI. So they meet
 * at ONE function: overlay-route offers `setHistoryWriter`, and this library fills it on import.
 *
 * This test walks the whole chain the way a viewer package does — through the public hook, not
 * through the internals — and asserts the thing that was actually broken: the pop travels past the
 * overlay's entry as well as the page's.
 */
import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { useOverlayRoute, hasExternalHistoryWriter } from '@academix-admin/overlay-route';
import { getRegistry } from '../src/core/registry';
import { resetNavigationLedgers, getPopHealth } from '../src/core/persistence';

const A = () => <div>ROOT</div>;
const B = () => <div>PAGE</div>;

async function settle(ms = 120) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

/** What a viewer package does with the prop: call the hook, nothing more. */
function Viewer({ route }: { route: string }) {
  const [open, setOpen] = useState(false);
  useOverlayRoute(route, open, () => setOpen(false));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open sheet
      </button>
      {open && <div>SHEET</div>}
    </>
  );
}

describe('overlay-route and navigation-stack, meeting at one function', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetNavigationLedgers(['s']);
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('this library takes over the writing simply by being imported', () => {
    expect(
      hasExternalHistoryWriter(),
      'importing navigation-stack must be the whole integration — no wiring, no provider',
    ).toBe(true);
  });

  it('counts a sheet’s entry in a pop, though neither package imports the other', async () => {
    const view = render(
      <>
        <NavigationStack id="s" navLink={{ a: A, b: B }} entry="a" syncHistory />
        <Viewer route="viewer:one" />
      </>,
    );
    await settle();

    const api = getRegistry().get('s')!.api!;
    await act(async () => { await api.push('b'); });
    await settle();

    await act(async () => { view.getByText('open sheet').click(); });
    await settle();
    expect(view.queryByText('SHEET'), 'the sheet is open, on its own entry').toBeTruthy();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await api.pop(); });
    await settle();

    expect(
      go,
      'the way back to the root runs past the sheet’s entry as well as the page’s — counting only ' +
        'this library’s own entries is how a pop landed on another tab',
    ).toHaveBeenCalledWith(-2);
  });

  it('and answers that pop from the log rather than guessing', async () => {
    const view = render(
      <>
        <NavigationStack id="s" navLink={{ a: A, b: B }} entry="a" syncHistory />
        <Viewer route="viewer:one" />
      </>,
    );
    await settle();

    const api = getRegistry().get('s')!.api!;
    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { view.getByText('open sheet').click(); });
    await settle();

    const before = getPopHealth().fellBackToCounting;
    await act(async () => { await api.pop(); });
    await settle(200);

    const health = getPopHealth();
    expect(health.namedByLog, 'the log could name the target').toBeGreaterThan(0);
    expect(
      health.fellBackToCounting,
      'and did not fall back, which it would have if the sheet’s entry were unknown to it',
    ).toBe(before);
  });
});
