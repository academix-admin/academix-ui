/**
 * Per-entry history.state.
 *
 * The point is not "state is written" but that an entry's own record SURVIVES another writer
 * rewriting the shared URL. That is the exact failure that made browser Forward restore the wrong
 * page: a popstate handler called restUrl(), which deleted ?nav= from the entry it had just landed
 * on, and the next visit to that entry found nothing and fell back to the root.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';
import { readAxState, nextSerial } from '../src/core/persistence';

const A = () => <div>A</div>;
const B = () => <div>B</div>;
const C = () => <div>C</div>;

function App() {
  return <NavigationStack id="s" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />;
}

async function settle(ms = 120) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe('readAxState', () => {
  it('accepts our shape and rejects anything else', () => {
    expect(readAxState({ navStack: 's:1.a1', axSerial: 4 })).toEqual({
      navStack: 's:1.a1', group: undefined, axSerial: 4,
    });
    expect(readAxState(null)).toBeNull();
    expect(readAxState(undefined)).toBeNull();
    expect(readAxState('a string')).toBeNull();
    // Written by something else (a router, an analytics lib) — must not be mistaken for ours.
    expect(readAxState({ someOtherLib: true })).toBeNull();
    // Predates serials.
    expect(readAxState({ navStack: 's:1.a1' })).toBeNull();
  });

  it('preserves a null navStack (a legitimately empty entry)', () => {
    expect(readAxState({ navStack: null, axSerial: 1 })?.navStack).toBeNull();
  });
});

describe('serials', () => {
  it('are monotonic', () => {
    const a = nextSerial();
    const b = nextSerial();
    expect(b).toBeGreaterThan(a);
  });
});

describe('per-entry state survives a hostile URL rewrite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('writes navStack + a serial onto each pushed entry', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();

    const ax = readAxState(window.history.state);
    expect(ax, 'the entry should carry our state').toBeTruthy();
    expect(ax!.navStack).toContain('s:');
    expect(typeof ax!.axSerial).toBe('number');
  });

  it('restores from state even when ?nav= has been wiped from the URL', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    const stateAtB = window.history.state;
    expect(readAxState(stateAtB)!.navStack).toContain('s:');

    // Simulate exactly what restUrl() used to do to a neighbouring entry: strip nav from the URL
    // while leaving history.state intact.
    const stripped = new URL(window.location.href);
    stripped.searchParams.delete('nav');
    window.history.replaceState(stateAtB, '', stripped.toString());
    expect(new URL(window.location.href).searchParams.get('nav')).toBeNull();

    // A popstate carrying that entry's state must still rebuild depth 2 — under the old
    // URL-derived path this restored the root instead, which is the reported Forward bug.
    getRegistry().get('s')!.lastAppliedSerial = undefined;   // this generation not yet applied
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: stateAtB }));
    });
    await settle(200);

    expect(api.length(), 'state should have restored depth 2 despite the blank URL').toBe(2);
    expect(api.peek()?.key).toBe('b');
  });

  it('records the serial without using it to skip a rebuild', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    const state = window.history.state;
    const serial = readAxState(state)!.axSerial;

    // Revisiting an entry is normal — a → b → c, back to b, back to a, forward to b delivers the
    // SAME serial while the stack genuinely needs rebuilding. Skipping on a repeated serial broke
    // exactly that, so the marker is recorded for diagnostics and nothing more.
    getRegistry().get('s')!.lastAppliedSerial = serial;
    await act(async () => { await api.popToRoot(); });
    await settle(200);
    expect(api.length()).toBe(1);

    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    });
    await settle(200);

    expect(api.length(), 'a repeated serial must still rebuild').toBe(2);
    expect(getRegistry().get('s')!.lastAppliedSerial).toBe(serial);
  });

  it('still falls back to the URL for entries with no ax state (deep links)', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    const urlAtB = window.location.href;

    await act(async () => { await api.push('c'); });
    await settle();
    expect(api.length()).toBe(3);

    // A foreign entry: correct URL, no ax state — e.g. a shared link, or history written before
    // this version. The URL must still drive the rebuild.
    window.history.replaceState({ somethingElse: true }, '', urlAtB);
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { somethingElse: true } }));
    });
    await settle(200);

    expect(api.length(), 'URL fallback should rebuild depth 2').toBe(2);
    expect(api.peek()?.key).toBe('b');
  });
});

describe('browser-driven navigations are not re-animated', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
    // The registry is process-global and survives cleanup(), so a flag left set by an earlier
    // test leaks into this one. Passing in isolation but failing in the full suite is that.
    const reg = getRegistry().get('s');
    if (reg) reg.browserDrivenChange = false;
  });
  afterEach(() => cleanup());

  it('marks a popstate rebuild as browser-driven', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();
    const state = window.history.state;

    await act(async () => { await api.popToRoot(); });
    await settle(200);

    // Arriving via popstate: the platform (edge-swipe / back button) already animated it, so the
    // arrival must render at rest rather than replaying our slide over the browser's own animation.
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    });
    await settle(50);

    // Consumed by the reconciler once it has rendered the arrival at rest.
    const reg = getRegistry().get('s')!;
    expect(reg.browserDrivenChange, 'the flag should be consumed, not left set').toBeFalsy();
    expect(api.length(), 'the stack still rebuilds').toBe(2);
  });

  it('a programmatic push is NOT marked browser-driven (it should animate)', async () => {
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('b'); });
    await settle();

    expect(getRegistry().get('s')!.browserDrivenChange).toBeFalsy();
    expect(api.length()).toBe(2);
  });
});
