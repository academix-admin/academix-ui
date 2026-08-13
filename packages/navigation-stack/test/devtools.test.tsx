/**
 * Devtools.
 *
 * The assertion that matters most is structured-clone safety: page.evaluate() clones its return
 * value, so a React element or function anywhere in the payload throws "could not be cloned" —
 * a failure that only appears under Playwright, never in the console.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup, screen } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack, NavigationDevtools } from '../src/index';
import { navDevtools, devtoolsEnabled } from '../src/devtools';
import { getRegistry } from '../src/core/registry';

const A = () => <div>PAGE A</div>;
const B = () => <div>PAGE B</div>;

function App() {
  const stacks = new Map<string, React.ReactElement>([
    ['quiz', <NavigationStack key="q" id="quiz" navLink={{ a: A, b: B }} entry="a" syncHistory />],
  ]);
  return <GroupNavigationStack id="grp" navStack={stacks} current="quiz" />;
}

async function settle(ms = 60) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe('devtools inspector', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/main');
    navDevtools.clearEvents();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('is enabled outside production', () => {
    expect(devtoolsEnabled()).toBe(true);
  });

  it('can be forced on explicitly (how Playwright enables it against a prod build)', () => {
    (window as unknown as Record<string, unknown>).__NAV_STACK_DEVTOOLS__ = true;
    expect(devtoolsEnabled()).toBe(true);
    (window as unknown as Record<string, unknown>).__NAV_STACK_DEVTOOLS__ = false;
    expect(devtoolsEnabled()).toBe(false);
    delete (window as unknown as Record<string, unknown>).__NAV_STACK_DEVTOOLS__;
  });

  it('installs window.__NAV_STACK__ at import time', () => {
    expect((window as unknown as Record<string, unknown>).__NAV_STACK__).toBeTruthy();
  });

  it('reports live stack state', async () => {
    render(<App />);
    await settle();

    expect(navDevtools.stacks()).toContain('quiz');
    const snap = navDevtools.snapshot('quiz') as { depth: number; top: string | null };
    expect(snap.depth).toBe(1);
    expect(snap.top).toBe('a');
  });

  it('EVERY inspector payload survives structured clone (Playwright requirement)', async () => {
    render(<App />);
    await settle();
    await act(async () => { await navDevtools.push('quiz', 'b', { id: 7 }); });
    await settle();

    // structuredClone throws on functions, React elements, DOM nodes — exactly what a careless
    // inspector would leak through `params` or a live api reference.
    expect(() => structuredClone(navDevtools.debug())).not.toThrow();
    expect(() => structuredClone(navDevtools.snapshot())).not.toThrow();
    expect(() => structuredClone(navDevtools.events())).not.toThrow();
    expect(() => structuredClone(navDevtools.history())).not.toThrow();
  });

  it('sanitizes non-primitive params instead of leaking them', async () => {
    render(<App />);
    await settle();
    await act(async () => {
      await navDevtools.push('quiz', 'b', { good: 1, bad: () => null, node: <div /> } as never);
    });
    await settle();

    const snap = navDevtools.snapshot('quiz') as { entries: { params?: Record<string, unknown> }[] };
    const params = snap.entries[snap.entries.length - 1].params!;
    expect(params.good).toBe(1);
    expect(params.bad).toBe('[function]');
    expect(() => structuredClone(params)).not.toThrow();
  });

  it('records a navigation timeline with depth transitions', async () => {
    render(<App />);
    await settle();
    navDevtools.clearEvents();

    await act(async () => { await navDevtools.push('quiz', 'b'); });
    await settle();

    const evs = navDevtools.events();
    const push = evs.find((e) => e.kind === 'push');
    expect(push, 'a push should be recorded').toBeTruthy();
    expect(push!.from).toBe(1);
    expect(push!.to).toBe(2);
    expect(push!.topKey).toBe('b');
  });

  it('pop() reports whether it actually popped — the shape of the live bug', async () => {
    render(<App />);
    await settle();
    await act(async () => { await navDevtools.push('quiz', 'b'); });
    await settle();

    let res: { before: number; after: number; popped: boolean } | undefined;
    await act(async () => { res = await navDevtools.pop('quiz') as never; });
    await settle();

    expect(res!.before).toBe(2);
    expect(res!.after).toBe(1);
    expect(res!.popped).toBe(true);
  });

  it('history() surfaces owned-entry count, the Back diagnostic', async () => {
    render(<App />);
    await settle();
    await act(async () => { await navDevtools.push('quiz', 'b'); });
    await settle();

    const h = navDevtools.history();
    expect(h.byStack.quiz).toBeGreaterThan(0);
    expect(h.ownedEntries).toBeGreaterThan(0);
  });

  it('waitForDepth resolves without arbitrary sleeps, and times out honestly', async () => {
    render(<App />);
    await settle();
    await expect(navDevtools.waitForDepth('quiz', 1, 500)).resolves.toBe(true);
    await expect(navDevtools.waitForDepth('quiz', 9, 200)).resolves.toBe(false);
  });

  it('unknown stack ids fail cleanly rather than throwing', async () => {
    expect(await navDevtools.pop('nope')).toMatchObject({ ok: false, reason: 'unknown-stack' });
    expect(navDevtools.snapshot('nope')).toBeNull();
  });
});

describe('devtools UI', () => {
  afterEach(() => cleanup());

  it('renders only the launcher until opened', () => {
    render(<NavigationDevtools />);
    expect(screen.getByTitle(/Navigation devtools/i)).toBeTruthy();
  });

  it('opens to the stacks tab and lists live stacks', async () => {
    render(<><App /><NavigationDevtools defaultOpen /></>);
    await settle();
    expect(screen.getByText('navigation-stack')).toBeTruthy();
    expect(screen.getAllByText(/quiz/).length).toBeGreaterThan(0);
  });

  it('renders nothing at all when devtools are disabled', () => {
    (window as unknown as Record<string, unknown>).__NAV_STACK_DEVTOOLS__ = false;
    const { container } = render(<NavigationDevtools defaultOpen />);
    expect(container.firstChild).toBeNull();
    delete (window as unknown as Record<string, unknown>).__NAV_STACK_DEVTOOLS__;
  });
});
