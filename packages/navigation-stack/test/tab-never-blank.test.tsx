/**
 * A TAB IS NEVER BLANK, AND BACK NEVER CHANGES TAB BEHIND YOUR BACK.
 *
 * Reported from a phone, in production, against a four-tab shop app:
 *
 *   "Money stack just went blank" — the tab showed nothing at all, and nothing but a reload
 *   brought it back.
 *
 *   "I pop on one page, I am on another group" — Back on the second page of Stock arrived on
 *   Sell, on a Sell page the shop had left long before.
 *
 * Each case below is one of the ways those happen, written so it fails against the library that
 * shipped them.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack } from '../src/index';
import { getRegistry } from '../src/core/registry';
import { resetEntryLog, resetPushDepth } from '../src/core/persistence';

const Root = () => <div>ROOT</div>;
const Deep = () => <div>DEEP</div>;
const Deeper = () => <div>DEEPER</div>;
const links = { a: Root, b: Deep, c: Deeper };

function Sell() {
  return <NavigationStack id="sell" navLink={links} entry="a" syncHistory />;
}
function Stock() {
  return <NavigationStack id="stock" navLink={links} entry="a" syncHistory />;
}

function Tabs({ current, onChange, backStaysInTab }: {
  current: string;
  onChange?: (id: string) => void;
  backStaysInTab?: boolean;
}) {
  const stacks = React.useMemo(
    () => new Map<string, React.ReactElement>([
      ['sell', <Sell key="s" />],
      ['stock', <Stock key="k" />],
    ]),
    [],
  );
  return (
    <GroupNavigationStack
      id="main"
      navStack={stacks}
      current={current}
      onCurrentChange={onChange}
      backStaysInTab={backStaysInTab}
    />
  );
}

/** The shell as an app writes it: the tab bar's state is the group's `current`. */
function Shell({ backStaysInTab, start = 'sell' }: { backStaysInTab?: boolean; start?: string }) {
  const [active, setActive] = React.useState(start);
  (Shell as any).setActive = setActive;
  (Shell as any).active = active;
  return <Tabs current={active} onChange={setActive} backStaysInTab={backStaysInTab} />;
}
const switchTo = async (id: string) => {
  await act(async () => { (Shell as any).setActive(id); });
  await settle();
};

async function settle(ms = 150) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}
const api = (id: string) => getRegistry().get(id)!.api!;
const keys = (id: string) => getRegistry().get(id)!.stack.map((e) => e.key);
const activeTab = () =>
  document.querySelector('.group-stack-container[data-active="true"]')?.getAttribute('data-stack-id');
const back = async () => {
  await act(async () => { window.history.back(); });
  await settle(250);
};

describe('a tab is never blank', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetEntryLog();
    resetPushDepth('sell');
    resetPushDepth('stock');
    window.history.replaceState({}, '', '/main');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('a pop on the first page of a tab leaves the first page', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').pop(); });
    await settle();
    expect(keys('sell'), 'popping a tab’s only page emptied it — a blank tab').toEqual(['a']);
  });

  it('a second Back tapped while the page slides out does not empty the tab', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle();
    // Two taps on the same arrow: the page is still on screen, animating out, after the first.
    await act(async () => {
      await api('sell').pop();
      await api('sell').pop();
    });
    await settle(400);
    expect(keys('sell')).toEqual(['a']);
    expect(document.body.textContent).toContain('ROOT');
  });

  it('popUntil that matches nothing keeps the first page', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle();
    await act(async () => { await api('sell').popUntil(() => false); });
    await settle();
    expect(keys('sell')).toEqual(['a']);
  });

  it('a page reopened while it is still sliding out stays open', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle(400);
    await act(async () => {
      await api('sell').pop();
    });
    // Before the exit transition (300ms) has finished, the same page, the same params.
    await act(async () => { await api('sell').push('b'); });
    await settle(700);
    expect(keys('sell')).toEqual(['a', 'b']);
    expect(
      document.body.textContent,
      'the page is on the stack but its exit timer removed it from the screen',
    ).toContain('DEEP');
  });

  it('a tab rebuilt from an entry that names none of its pages keeps its first page', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle();
    // An entry whose own record of the stacks has an empty slice for us.
    await act(async () => {
      window.history.pushState({ group: 'sell', navStack: 'sell:', axSerial: 999999 }, '', '/main?group=sell&nav=sell%3A');
      window.history.back();
    });
    await settle(250);
    await act(async () => { window.history.forward(); });
    await settle(250);
    expect(keys('sell').length).toBeGreaterThan(0);
  });
});

describe('Back and the tab you are on', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetEntryLog();
    resetPushDepth('sell');
    resetPushDepth('stock');
    window.history.replaceState({}, '', '/main');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('the app’s own Back keeps the tab, even when the entry it lands on was stamped by another', async () => {
    render(<Shell />);
    await settle();
    await switchTo('stock');
    await act(async () => { await api('stock').push('b'); });
    await settle();
    await switchTo('sell');
    await act(async () => { await api('sell').push('b'); });
    await settle();
    await switchTo('stock');
    // The log is lost (a reload, a second writer): the pop can only count, and one back is Sell's.
    resetEntryLog();
    await act(async () => { await api('stock').pop(); });
    await settle(250);
    expect(activeTab(), 'Back pressed on Stock arrived on another tab').toBe('stock');
    expect(keys('stock')).toEqual(['a']);
    expect(keys('sell'), 'Sell was not touched').toEqual(['a', 'b']);
  });

  it('a browser Back onto another tab’s entry shows that tab where the entry left it', async () => {
    render(<Shell start="stock" />);
    await settle();
    await switchTo('sell');                                     // e0 restamped: sell
    await act(async () => { await api('sell').push('b'); });   // e1: sell deep
    await settle();
    await switchTo('stock');                                    // e1 restamped: stock
    await act(async () => { await api('stock').push('b'); });  // e2: stock deep
    await settle();
    await back();                                               // e1: stock root, sell deep
    expect(activeTab()).toBe('stock');
    expect(keys('stock')).toEqual(['a']);
    expect(keys('sell')).toEqual(['a', 'b']);
    await back();                                               // e0: stamped sell, sell root
    expect(activeTab(), 'the browser’s own Back follows the entry to its tab').toBe('sell');
    expect(keys('sell'), 'and that tab shows what the entry recorded').toEqual(['a']);
  });

  it('the app’s own Back leaves the other tab’s pages alone', async () => {
    render(<Shell />);
    await settle();
    await switchTo('stock');
    await act(async () => { await api('stock').push('b'); });
    await settle();
    await switchTo('sell');
    await act(async () => { await api('sell').push('b'); });
    await settle();
    await act(async () => { await api('sell').push('c'); });
    await settle();
    await switchTo('stock');
    await act(async () => { await api('stock').pop(); });      // the log names Stock's own entry
    await settle(250);
    expect(activeTab()).toBe('stock');
    expect(keys('stock')).toEqual(['a']);
    expect(keys('sell'), 'popping Stock rewound Sell to an older entry').toEqual(['a', 'b', 'c']);
  });

  it('a push straight after a pop lands on the new page, and Back from it is the page below', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle();
    // What finishing a flow does: take the finished page off, put the result on. No waiting.
    await act(async () => {
      await api('sell').pop();
      await api('sell').push('c');
    });
    await settle(500);
    expect(keys('sell')).toEqual(['a', 'c']);
    expect(document.body.textContent).toContain('DEEPER');
    await back();
    expect(keys('sell'), 'Back from the result must be the first page, not the finished one').toEqual(['a']);
  });

  it('two Backs from three deep go two pages back, and no further', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle();
    await act(async () => { await api('sell').push('c'); });
    await settle();
    await act(async () => {
      await api('sell').pop();
      await api('sell').pop();
      await api('sell').pop();
    });
    await settle(500);
    expect(keys('sell')).toEqual(['a']);
    expect(document.body.textContent).toContain('ROOT');
  });

  it('with backStaysInTab, Forward after a kept Back does not pop again', async () => {
    render(<Shell backStaysInTab start="stock" />);
    await settle();
    await act(async () => { await api('stock').push('b'); });  // e1
    await settle();
    await switchTo('sell');                                     // e1: sell
    await act(async () => { await api('sell').push('b'); });   // e2
    await settle();
    await switchTo('stock');                                    // e2: stock
    await back();                                               // e1 (sell's) — Stock pops
    expect(keys('stock')).toEqual(['a']);
    await act(async () => { window.history.forward(); });
    await settle(250);
    expect(activeTab()).toBe('stock');
    expect(keys('stock'), 'Forward is not a Back: nothing may be popped for it').toEqual(['a', 'b']);
  });

  it('with backStaysInTab, the phone’s Back on a deep page pops that page, not the tab', async () => {
    render(<Shell backStaysInTab start="stock" />);
    await settle();
    await act(async () => { await api('stock').push('b'); });  // e1: stock deep
    await settle();
    await switchTo('sell');                                     // e1 restamped: group=sell
    await act(async () => { await api('sell').push('b'); });   // e2: sell deep
    await settle();
    await switchTo('stock');                                    // e2 restamped: group=stock
    await act(async () => { await api('stock').push('c'); });  // e3: stock deeper
    await settle();

    await back();                                               // e2 — says stock, depth 2
    expect(activeTab()).toBe('stock');
    expect(keys('stock')).toEqual(['a', 'b']);

    await back();                                               // e1 — stamped by Sell
    expect(activeTab(), 'Back on Stock’s second page arrived on Sell').toBe('stock');
    expect(keys('stock')).toEqual(['a']);
    expect(keys('sell'), 'Sell keeps its own page').toEqual(['a', 'b']);
    expect(new URLSearchParams(window.location.search).get('group')).toBe('stock');
  });

  it('with backStaysInTab, Back at the first page of a tab may still go to the tab before it', async () => {
    render(<Shell backStaysInTab start="sell" />);
    await settle();
    await act(async () => { await api('sell').push('b'); });   // e1: sell deep
    await settle();
    await switchTo('stock');                                    // e1 restamped: stock
    await act(async () => { await api('stock').push('b'); });  // e2: stock deep
    await settle();
    await back();                                               // e1: stock root
    expect(activeTab()).toBe('stock');
    expect(keys('stock')).toEqual(['a']);
    expect(keys('sell')).toEqual(['a', 'b']);
  });

  it('tab switches keep every tab where it was', async () => {
    render(<Shell />);
    await settle();
    await act(async () => { await api('sell').push('b'); });
    await settle();
    await switchTo('stock');
    await act(async () => { await api('stock').push('b'); });
    await settle();
    await act(async () => { await api('stock').push('c'); });
    await settle();
    for (let i = 0; i < 3; i++) {
      await switchTo('sell');
      await switchTo('stock');
    }
    expect(keys('sell')).toEqual(['a', 'b']);
    expect(keys('stock')).toEqual(['a', 'b', 'c']);
    await act(async () => { await api('stock').pop(); });
    await settle(250);
    expect(activeTab()).toBe('stock');
    expect(keys('stock')).toEqual(['a', 'b']);
  });
});
