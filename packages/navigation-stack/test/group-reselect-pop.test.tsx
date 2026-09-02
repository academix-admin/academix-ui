/**
 * Tapping the tab you are already on must reach THAT tab's first page — not another tab.
 *
 * `interleaved-pop` covers the case where two stacks PUSH in turn; the entry log names the target
 * and the pop travels to it. A tab bar adds a second kind of write the log has to survive: moving
 * between tabs REPLACES the current entry (same page, different `group=`), so the entry standing
 * behind you belongs to whichever stack pushed last, which may not be yours.
 *
 * Seen in store-manager, deterministically:
 *
 *     Stock  -> push a delivery          entry S1   (stock deep)
 *     Count  -> replace, then push       entry C1   (count deep, stock still deep)
 *     Stock  -> replace                  entry C1 restamped as stock's
 *     tap Stock again -> popToRoot(stock)
 *
 * The pop travelled one entry back — the count of what stock itself had pushed — and landed on
 * C1, the Count tab's own entry. From the counter: "I tapped Stock and it took me to Count."
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack } from '../src/index';
import { getRegistry } from '../src/core/registry';
import { resetEntryLog, resetPushDepth } from '../src/core/persistence';

const A = () => <div>ROOT</div>;
const B = () => <div>PUSHED</div>;

function Stock() {
  return <NavigationStack id="stock" navLink={{ a: A, b: B }} entry="a" syncHistory />;
}
function Count() {
  return <NavigationStack id="count" navLink={{ a: A, b: B }} entry="a" syncHistory />;
}

function Tabs({ current }: { current: string }) {
  const stacks = new Map<string, React.ReactElement>([
    ['stock', <Stock key="s" />],
    ['count', <Count key="c" />],
  ]);
  return <GroupNavigationStack id="maingroup" navStack={stacks} current={current} />;
}

async function settle(ms = 120) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('reselecting a tab whose neighbour is also deep', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetEntryLog();
    /*
     * The ledgers are process-global and outlive `cleanup()`.
     *
     * Without this, the second test in this file inherited the first one's push depth and
     * travelled two entries back for the arithmetic reason rather than the right one — it passed
     * against the UNFIXED library, which is a test that cannot fail proving something it does not
     * test.
     */
    resetPushDepth('stock');
    resetPushDepth('count');
    window.history.replaceState({}, '', '/main');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('pops to its own root entry, not to the entry the other tab pushed', async () => {
    const view = render(<Tabs current="stock" />);
    await settle();

    const stock = getRegistry().get('stock')!.api!;
    const count = getRegistry().get('count')!.api!;

    // Stock goes one deep.
    await act(async () => {
      await stock.push('b');
    });
    await settle();

    // Over to Count — a REPLACE — and Count goes one deep too.
    view.rerender(<Tabs current="count" />);
    await settle();
    await act(async () => {
      await count.push('b');
    });
    await settle();

    // Back to Stock: another replace, over the top of Count's own entry.
    view.rerender(<Tabs current="stock" />);
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => {
      await stock.popToRoot();
    });
    await settle();

    /*
     * Two back, not one.
     *
     * One step back is the entry Count pushed. The entry where stock last sat at its root is the
     * one before that, and the log can name it — so a count of "stock pushed one page" is the
     * wrong answer even though the arithmetic is right.
     */
    expect(
      go,
      'reselecting Stock must travel to Stock’s own root entry, not to whatever sits one back',
    ).toHaveBeenCalledWith(-2);
    go.mockRestore();
  });

  it('the Back button on a page pops that page, after a trip to another tab', async () => {
    /*
     * Reported separately from the reselect, and it is the same fault wearing other clothes:
     *
     *     "I could be on the second page of a stack and go to another stack; when I return to
     *      that stack on the second page and press the pop button, it returns to the other group."
     *
     * Nothing about pressing Back on a page should depend on which tabs were visited in between.
     */
    const view = render(<Tabs current="stock" />);
    await settle();

    const stock = getRegistry().get('stock')!.api!;
    const count = getRegistry().get('count')!.api!;

    await act(async () => { await stock.push('b'); });
    await settle();

    view.rerender(<Tabs current="count" />);
    await settle();
    await act(async () => { await count.push('b'); });
    await settle();

    view.rerender(<Tabs current="stock" />);
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await stock.pop(); });
    await settle();

    expect(
      go,
      'Back on Stock’s second page must reach Stock’s own first page, not the other tab',
    ).toHaveBeenCalledWith(-2);
    go.mockRestore();
  });

  it('and still pops one step when the other tab stayed at its root', async () => {
    /*
     * The other half of the same claim. A tab switch restamps the entry it is standing on, so the
     * log has to survive one even when nothing else pushed — and the answer here is still the
     * plain one. A fix that over-travels in the simple case has only moved the bug.
     */
    const view = render(<Tabs current="stock" />);
    await settle();
    const stock = getRegistry().get('stock')!.api!;

    await act(async () => { await stock.push('b'); });
    await settle();

    view.rerender(<Tabs current="count" />);
    await settle();
    view.rerender(<Tabs current="stock" />);
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await stock.pop(); });
    await settle();

    expect(go, 'a visit to an untouched tab must not lengthen the way back').toHaveBeenCalledWith(-1);
    go.mockRestore();
  });
});
