/**
 * Which exit paths actually reach onExit?
 *
 * ACADEMIX_PLAN §3b binds flow-scoped cleanup (state-stack scopes) to onExit, so any exit path
 * that does NOT fire it is a scope leak by construction — stale flow data surviving into the next
 * visit. That was an assumption; this makes it a fact per path.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { usePageLifecycle, useNav } from '../src/index';
import { getRegistry } from '../src/core/registry';

const exits: string[] = [];

function PageA() { return <div>A</div>; }
function PageB() {
  const nav = useNav();
  usePageLifecycle(nav, { onExit: () => { exits.push('B'); } });
  return <div>B</div>;
}

function App() {
  return <NavigationStack id="ex" navLink={{ a: PageA, b: PageB }} entry="a" syncHistory />;
}

async function settle(ms = 150) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

async function toB() {
  render(<App />);
  await settle();
  const api = getRegistry().get('ex')!.api!;
  await act(async () => { await api.push('b'); });
  await settle();
  exits.length = 0;              // only count the exit under test
  return api;
}

describe('onExit coverage per exit path', () => {
  beforeEach(() => { exits.length = 0; sessionStorage.clear(); window.history.replaceState({}, '', '/app'); });
  afterEach(() => cleanup());

  it('fires on pop()', async () => {
    const api = await toB();
    await act(async () => { await api.pop(); });
    await settle(250);
    expect(exits, 'pop must fire onExit').toContain('B');
  });

  it('fires on popToRoot()', async () => {
    const api = await toB();
    await act(async () => { await api.popToRoot(); });
    await settle(250);
    expect(exits, 'popToRoot must fire onExit').toContain('B');
  });

  it('fires on replace() (B is replaced away)', async () => {
    const api = await toB();
    await act(async () => { await api.replace('a'); });
    await settle(250);
    expect(exits, 'replace must fire onExit for the page it replaced').toContain('B');
  });

  it('fires on browser Back', async () => {
    await toB();
    await act(async () => { window.history.back(); });
    await settle(400);
    expect(exits, 'browser Back must fire onExit — swipe-back and the back button use this path')
      .toContain('B');
  });
});
