/**
 * The entry log under pressure.
 *
 * Two writers were found not declaring themselves to the log (a tab switch, an overlay push), and
 * each produced the same class of failure: a pop that travelled the right NUMBER of entries to the
 * wrong PLACE. That is a fault of the mechanism, not of those two writers, so the question worth
 * asking is what else can put the log out of step with the browser's list.
 *
 * Every case here is written to FAIL if the answer is wrong. Where the honest answer is "the log
 * cannot know", the assertion is that it falls back to counting rather than guessing — a fallback
 * that is sometimes short is recoverable; a confident wrong delta is not.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack } from '../src/index';
import { writeOverlayFragment } from '../src/overlay/hash';
import { getRegistry } from '../src/core/registry';
import {
  resetEntryLog,
  resetPushDepth,
  getEntryLog,
  currentSerial,
  findBackDeltaForDepth,
} from '../src/core/persistence';

const A = () => <div>ROOT</div>;
const B = () => <div>B</div>;
const C = () => <div>C</div>;

function One() {
  return <NavigationStack id="s" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />;
}

function Tabs({ current }: { current: string }) {
  const stacks = new Map<string, React.ReactElement>([
    ['left', <NavigationStack key="l" id="left" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />],
    ['right', <NavigationStack key="r" id="right" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />],
  ]);
  return <GroupNavigationStack id="grp" navStack={stacks} current={current} />;
}

async function settle(ms = 120) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

function fresh() {
  sessionStorage.clear();
  resetEntryLog();
  for (const id of ['s', 'left', 'right']) resetPushDepth(id);
  window.history.replaceState({}, '', '/app');
}

describe('the entry log holds its place', () => {
  beforeEach(fresh);
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('counts several overlays opened in a row', async () => {
    render(<One />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    // A picker, and a confirm on top of it. Both are real entries.
    await act(async () => { writeOverlayFragment('one', 'push'); });
    await settle();
    await act(async () => { writeOverlayFragment('one&two', 'push'); });
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await api.pop(); });
    await settle();

    expect(go, 'two overlay entries stand between the page and its root').toHaveBeenCalledWith(-3);
  });

  it('does not count an overlay that only REPLACED the current entry', async () => {
    render(<One />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    // Syncing a fragment after the overlay closed by other means: same entry, no new position.
    await act(async () => { writeOverlayFragment('sync', 'replace'); });
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await api.pop(); });
    await settle();

    expect(go, 'a replace adds no position, so the way back is unchanged').toHaveBeenCalledWith(-1);
  });

  it('pops correctly from three deep, across a tab visit at each level', async () => {
    const view = render(<Tabs current="left" />);
    await settle();
    const left = getRegistry().get('left')!.api!;
    const right = getRegistry().get('right')!.api!;

    await act(async () => { await left.push('b'); });
    await settle();
    view.rerender(<Tabs current="right" />);
    await settle();
    await act(async () => { await right.push('b'); });
    await settle();
    view.rerender(<Tabs current="left" />);
    await settle();
    await act(async () => { await left.push('c'); });
    await settle();
    view.rerender(<Tabs current="right" />);
    await settle();
    view.rerender(<Tabs current="left" />);
    await settle();

    /*
     * ASSERTED ON WHERE IT LANDED, not on how far it asked to travel.
     *
     * jsdom performs the `go`, so the honest question can be asked directly: after the pop, is
     * `left` standing at its root? A delta is the mechanism's own arithmetic and can be right for
     * the wrong reason; the position is the thing the shop actually experiences.
     */
    await act(async () => { await left.popToRoot(); });
    await settle(200);

    const landedOn = new URL(window.location.href).searchParams.get('nav');
    expect(
      landedOn === null || !/left:1\.a1\./.test(landedOn),
      `landed on ${landedOn}, where left is not at its root`,
    ).toBe(true);
    expect(left.length(), 'and the stack itself is back at one page').toBe(1);
    expect(
      new URL(window.location.href).searchParams.get('group'),
      'and we are still on the tab we popped',
    ).toBe('left');
  });

  it('answers null rather than guessing when it has no record', async () => {
    render(<One />);
    await settle();
    const api = getRegistry().get('s')!.api!;
    await act(async () => { await api.push('b'); });
    await settle();

    // Whatever wiped it — a reload, a cross-document navigation, another library rewriting state.
    resetEntryLog();

    expect(
      findBackDeltaForDepth('s', 1),
      'an empty log must say so, so the caller falls back to counting',
    ).toBeNull();
  });

  it('never hands back a delta larger than the entries behind it', async () => {
    render(<One />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();

    const log = getEntryLog();
    const cur = currentSerial();
    const i = log.findIndex((e) => e.serial === cur);
    const delta = findBackDeltaForDepth('s', 1);

    expect(delta, 'there is a recorded root to reach').not.toBeNull();
    expect(
      delta! <= i,
      `asked to travel ${delta} back with only ${i} entries recorded behind us`,
    ).toBe(true);
  });

  it('survives a Back and a Forward before the pop', async () => {
    render(<One />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();

    const atC = window.history.state;
    const atB = { ...atC };

    // The browser goes back one, then forward again — the user's own gesture, not ours.
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: atB }));
    });
    await settle();
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: atC }));
    });
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await api.popToRoot(); });
    await settle();

    const delta = go.mock.calls[0]?.[0] as number;
    expect(delta, 'a pop after a browser round trip still travels backwards').toBeLessThan(0);
    expect(delta, 'and no further than the two pages it pushed').toBeGreaterThanOrEqual(-2);
  });
});
