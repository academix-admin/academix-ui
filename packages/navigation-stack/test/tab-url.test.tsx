/**
 * The active tab belongs in the URL.
 *
 * Previously a tab switch DELETED `group` and `nav`, which lost on every axis: not shareable, not
 * restorable from the URL, not carried into a new window (sessionStorage is per-tab), and Back did
 * not undo the switch either. Reading already preferred `?group=`; nothing wrote it back.
 *
 * The switch REPLACES rather than pushes: switching tabs is lateral navigation, Back is a depth
 * operation, and mixing them makes Back ambiguous. Pushing would also flood history and risk the
 * browser history-write rate limits that a drummed bottom-nav can hit.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack } from '../src/index';
import { getRegistry } from '../src/core/registry';
import { readAxState } from '../src/core/persistence';

const A = () => <div>A</div>;
const B = () => <div>B</div>;

function Grouped({ current }: { current: string }) {
  const stacks = new Map<string, React.ReactElement>([
    ['one', <NavigationStack key="1" id="one" navLink={{ a: A, b: B }} entry="a" syncHistory />],
    ['two', <NavigationStack key="2" id="two" navLink={{ a: A, b: B }} entry="a" syncHistory />],
  ]);
  return <GroupNavigationStack id="grp" navStack={stacks} current={current} persist />;
}

async function settle(ms = 150) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe('the active tab is recorded in the URL', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/main');
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('writes ?group= when the tab changes', async () => {
    const { rerender } = render(<Grouped current="one" />);
    await settle();

    await act(async () => { rerender(<Grouped current="two" />); });
    await settle();

    expect(new URL(window.location.href).searchParams.get('group')).toBe('two');
  });

  it('REPLACES rather than pushes, so Back is not consumed by a tab switch', async () => {
    const { rerender } = render(<Grouped current="one" />);
    await settle();

    const push = vi.spyOn(window.history, 'pushState');
    await act(async () => { rerender(<Grouped current="two" />); });
    await settle();

    expect(push, 'a tab switch must not add a history entry').not.toHaveBeenCalled();
  });

  it('PRESERVES ?nav= so every tab keeps its depth in the URL', async () => {
    const { rerender } = render(<Grouped current="one" />);
    await settle();

    const api = getRegistry().get('one')!.api!;
    await act(async () => { await api.push('b'); });
    await settle();
    const navBefore = new URL(window.location.href).searchParams.get('nav');
    expect(navBefore, 'stack one should be in the URL').toContain('one:');

    await act(async () => { rerender(<Grouped current="two" />); });
    await settle();

    const navAfter = new URL(window.location.href).searchParams.get('nav');
    // The invariant is that the OTHER tab's slice survives, not that the string is byte-identical:
    // activating a tab legitimately adds its own slice (here `two:1.a1`). The old behaviour deleted
    // nav outright, discarding every stack's depth to record a change to one of them.
    expect(navAfter, 'the switched-away tab must keep its depth').toContain('one:1.a1.b1');
    expect(navAfter, 'the newly active tab should record itself too').toContain('two:');
  });

  it('keeps navStack in history.state across a tab switch', async () => {
    const { rerender } = render(<Grouped current="one" />);
    await settle();

    const api = getRegistry().get('one')!.api!;
    await act(async () => { await api.push('b'); });
    await settle();
    const before = readAxState(window.history.state);
    expect(before?.navStack).toContain('one:');

    await act(async () => { rerender(<Grouped current="two" />); });
    await settle();

    const after = readAxState(window.history.state);
    // Same reasoning as above: the entry keeps every stack it knew about, and may gain the newly
    // activated one. What must never happen is losing a stack.
    expect(after?.navStack, 'the entry must keep its record of stack one').toContain('one:1.a1.b1');
    expect(after?.group).toBe('two');
  });

  it('restores the tab from the URL on a fresh mount (shareable link)', async () => {
    // A link someone pasted: the tab is in the URL, and nothing is in sessionStorage.
    window.history.replaceState({}, '', '/main?group=two');
    sessionStorage.clear();

    render(<Grouped current="one" />);   // prop says "one"; the URL must win
    await settle();

    expect(new URL(window.location.href).searchParams.get('group')).toBe('two');
  });

  it('does not write when the tab has not actually changed', async () => {
    const { rerender } = render(<Grouped current="one" />);
    await settle();

    const replace = vi.spyOn(window.history, 'replaceState');
    await act(async () => { rerender(<Grouped current="one" />); });
    await settle();

    expect(replace, 'a no-op re-render must not spend a history write').not.toHaveBeenCalled();
  });
});
