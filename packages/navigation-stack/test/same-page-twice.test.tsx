/**
 * The same page, twice in one stack.
 *
 * Reported live (store-manager): Empties was already in the stack, another page pushed Empties
 * again, and popping the second one landed on a blank page. An entry's uid is a hash of its route
 * and params, so two entries for the same page with the same params are the SAME uid — and pages
 * are rendered keyed by it.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup, screen } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';

const P = (name: string) => () => <div>{name}</div>;
const links = { empties: P('empties'), customer: P('customer'), home: P('home') };

function App() {
  return <NavigationStack id="s" navLink={links} entry="home" />;
}

async function settle(ms = 250) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('the same page pushed twice', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/app');
  });
  afterEach(() => cleanup());

  it('each entry is its own, and popping the second shows the one below', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<App />);
    await settle();
    const api = getRegistry().get('s')!.api!;

    await act(async () => { await api.push('empties'); });
    await settle();
    await act(async () => { await api.push('customer'); });
    await settle();
    await act(async () => { await api.push('empties'); });
    await settle();

    const uids = api.getStack().map((e) => e.uid);
    expect(new Set(uids).size, `every entry needs its own uid: ${uids.join(' | ')}`).toBe(uids.length);
    expect(warn.mock.calls.map((c) => String(c[0])).join(' ')).not.toMatch(/same key|duplicate/i);

    await act(async () => { await api.pop(); });
    await settle(400);

    expect(api.getStack().map((e) => e.key)).toEqual(['home', 'empties', 'customer']);
    expect(screen.getByText('customer'), 'the page below is drawn').toBeTruthy();
    warn.mockRestore();
  });
});
