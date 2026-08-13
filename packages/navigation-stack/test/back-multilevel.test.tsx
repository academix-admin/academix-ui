/**
 * Reported live: from a → b → c, one browser Back lands on **a** instead of b — a single Back
 * consuming two levels — and Forward then goes to c.
 *
 * jsdom does implement history.pushState/back and fires popstate, so the multi-entry walk can be
 * exercised here rather than only in E2E.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack } from '../src/index';
import { getRegistry } from '../src/core/registry';

const A = () => <div>A</div>;
const B = () => <div>B</div>;
const C = () => <div>C</div>;

function App() {
  return <NavigationStack id="s" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />;
}

async function settle(ms = 120) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe('browser Back walks ONE level at a time', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('a → b → c, Back lands on b (not a)', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    const urlAtB = window.location.href;

    await act(async () => { await api.push('c'); });
    await settle();
    expect(api.length(), 'should be three deep').toBe(3);

    // One Back.
    await act(async () => { window.history.back(); });
    await settle(300);

    expect(api.length(), `one Back should leave two entries; url=${window.location.href}`).toBe(2);
    expect(api.peek()?.key, 'top should be b, not a').toBe('b');
    expect(window.location.href, 'URL should be the one recorded at b').toBe(urlAtB);
  });

  it('a → b → c, two Backs land on a', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();

    await act(async () => { window.history.back(); });
    await settle(300);
    await act(async () => { window.history.back(); });
    await settle(300);

    expect(api.length()).toBe(1);
    expect(api.peek()?.key).toBe('a');
  });
});

describe('browser Back inside a GroupNavigationStack (academix-web shape)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/main');
  });
  afterEach(() => cleanup());

  function Grouped() {
    const stacks = new Map<string, React.ReactElement>([
      ['s', <NavigationStack key="s" id="s" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory persist />],
    ]);
    return <GroupNavigationStack id="grp" navStack={stacks} current="s" persist />;
  }

  it('a → b → c, ONE Back lands on b (not a)', async () => {
    render(<Grouped />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();
    expect(api.length()).toBe(3);

    await act(async () => { window.history.back(); });
    await settle(400);   // the group's own popstate handler runs on a 10ms timer

    expect(api.length(), `url=${window.location.href}`).toBe(2);
    expect(api.peek()?.key, 'top should be b, not a').toBe('b');
  });
});

describe('browser FORWARD walks one level at a time', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('a → b → c, back to a, then ONE forward lands on b (not c)', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    const urlAtB = window.location.href;
    await act(async () => { await api.push('c'); });
    await settle();

    await act(async () => { window.history.back(); });
    await settle(300);
    expect(api.peek()?.key, 'back #1 -> b').toBe('b');
    expect(window.location.href, 'entry for b must still describe b').toBe(urlAtB);

    await act(async () => { window.history.back(); });
    await settle(300);
    expect(api.peek()?.key, 'back #2 -> a').toBe('a');

    await act(async () => { window.history.forward(); });
    await settle(300);

    expect(api.peek()?.key, `forward should land on b; url=${window.location.href}`).toBe('b');
    expect(api.length(), 'forward should restore depth 2, not 3').toBe(2);
  });
});

describe('history entries follow the DEPTH DELTA, not the action name', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('pushAndPopUntil that GROWS the stack still creates an entry', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    // Spy rather than history.length: jsdom does not update length reliably across act()
    // boundaries, so it produces false negatives here.
    const push = vi.spyOn(window.history, 'pushState');
    // Grows 1 -> 2 while keeping the root. Classified as "replace" under the old action-name rule,
    // so it created no entry: a -> b(via this) -> c left history as [a, c], and Back/Forward both
    // skipped b entirely.
    await act(async () => { await api.pushAndPopUntil('b', (e) => e.key === 'a'); });
    await settle();

    expect(api.length(), 'stack should have grown').toBe(2);
    expect(push, 'a navigation that grows the stack must add a history entry').toHaveBeenCalled();
    push.mockRestore();
  });

  it('replace does NOT create an entry (depth unchanged)', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();

    const push = vi.spyOn(window.history, 'pushState');
    await act(async () => { await api.replace('c'); });
    await settle();

    expect(api.length()).toBe(2);
    expect(push, 'replace must not add a history step').not.toHaveBeenCalled();
    push.mockRestore();
  });
});

describe('entry ledger: one Back press per user action, however many levels moved', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('popToRoot from a multi-level jump gives back only the entries we own', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    // One navigation, several levels: creates ONE entry, not three.
    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();
    expect(api.length()).toBe(3);

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await api.popToRoot(); });
    await settle();

    // Two entries were pushed (b and c), so exactly two are returned -- counting stack LEVELS
    // instead would have asked for more than we own and desynchronised history from the stack.
    expect(go).toHaveBeenCalledWith(-2);
    go.mockRestore();
  });

  it('a net-SHRINKING pushAndPopUntil still costs one forward step', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('c'); });
    await settle();

    // Pushes one and pops back to the root: depth 3 -> 2, a POSITIVE delta, but the user moved
    // FORWARD. Under a delta-only rule this handed entries back and Back then overshot.
    const push = vi.spyOn(window.history, 'pushState');
    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await api.pushAndPopUntil('b', (e) => e.key === 'a'); });
    await settle();

    expect(push, 'a forward navigation must add a step').toHaveBeenCalled();
    expect(go, 'a forward navigation must not hand entries back').not.toHaveBeenCalled();
    push.mockRestore();
    go.mockRestore();
  });
});
