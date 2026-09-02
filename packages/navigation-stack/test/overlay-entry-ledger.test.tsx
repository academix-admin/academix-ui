/**
 * An overlay's history entry is an entry too.
 *
 * `history.go(-n)` counts positions in the browser's own list. The entry log answers "which entry
 * do I want" and hands back the distance to it — but a distance measured in LOG positions is only
 * the same number as the browser's when the log knows about every entry in between.
 *
 * Overlays (a sheet, a picker) push a real entry so the platform back gesture closes them, and
 * that push went unrecorded. One picker opened anywhere in the journey and every later pop was
 * short by one, landing on somebody else's entry — in store-manager, on a different tab, with the
 * picker's own fragment restored into the URL.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { writeOverlayFragment } from '../src/overlay/hash';
import { getRegistry } from '../src/core/registry';
import { resetEntryLog, resetPushDepth } from '../src/core/persistence';

const A = () => <div>ROOT</div>;
const B = () => <div>PUSHED</div>;

function App() {
  return <NavigationStack id="s" navLink={{ a: A, b: B }} entry="a" syncHistory />;
}

async function settle(ms = 120) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('a pop across an overlay entry', () => {
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

  it('counts the entry an overlay pushed', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => {
      await api.push('b');
    });
    await settle();

    // A picker opens on the pushed page: one more real entry, so the back gesture closes it.
    await act(async () => {
      writeOverlayFragment('picker:one', 'push');
    });
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => {
      await api.pop();
    });
    await settle();

    expect(
      go,
      'the way back to the root is past the overlay’s entry as well as the page’s',
    ).toHaveBeenCalledWith(-2);
    go.mockRestore();
  });
});
