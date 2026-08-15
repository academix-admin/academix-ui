/**
 * The history ledger must shrink when the BROWSER pops, not only when we do.
 *
 * `_pushDepth` / `_entryDepths` track "entries this stack pushed that sit behind us", and every
 * programmatic pop hands them back with `history.go(-n)`. Only `consumeHistoryEntries()` ever
 * decremented them — the programmatic path. A browser Back also moves us back over an owned entry,
 * but left the ledger untouched.
 *
 * So the ledger over-counts after any Back, and the error is silent until the NEXT programmatic pop
 * multiplies it: that pop calls `history.go(-n)` with an n larger than the entries actually behind
 * us, jumping several entries at once and landing on an old URL. In a tab-group app that old URL
 * carries a different `group=`, so the whole app re-derives to a different tab — the user presses
 * Back on one tab and lands on another, which is exactly the reported symptom and looks nothing
 * like a counter being wrong.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';
import { getPushDepth, getEntryDepths } from '../src/core/persistence';

function A() { return <div>A</div>; }
function B() { return <div>B</div>; }
function C() { return <div>C</div>; }

async function settle(ms = 200) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe('history ledger reconciliation', () => {
  beforeEach(() => { sessionStorage.clear(); window.history.replaceState({}, '', '/app'); });
  afterEach(() => cleanup());

  it('browser Back decrements the ledger, so a later pop does not over-consume', async () => {
    render(<NavigationStack id="led" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />);
    await settle();
    const api = getRegistry().get('led')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();

    expect(api.length()).toBe(3);
    expect(getPushDepth('led'), 'two pushes own two entries').toBe(2);

    await act(async () => { window.history.back(); });
    await settle(400);

    expect(api.length(), 'Back must pop one page').toBe(2);
    expect(getPushDepth('led'),
      'the browser consumed one owned entry — the ledger must reflect that, or the next pop over-consumes')
      .toBe(1);
    expect(getEntryDepths('led'),
      'the entry recorded at depth 3 is now ahead of us, not behind').toEqual([2]);
  });

  it('a Back that unwinds several levels leaves no phantom entries', async () => {
    render(<NavigationStack id="led2" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />);
    await settle();
    const api = getRegistry().get('led2')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();
    expect(getPushDepth('led2')).toBe(2);

    // Two Backs, all the way to the root.
    await act(async () => { window.history.back(); });
    await settle(350);
    await act(async () => { window.history.back(); });
    await settle(350);

    expect(api.length(), 'both Backs must pop').toBe(1);
    expect(getPushDepth('led2'),
      'at the root this stack owns nothing behind it; a phantom count here sends the next pop off the front of history')
      .toBe(0);
    expect(getEntryDepths('led2')).toEqual([]);
  });
});
