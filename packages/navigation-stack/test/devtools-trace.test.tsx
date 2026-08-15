/**
 * The trace() console stream is the surface a developer actually watches while pressing Back, so
 * it needs to be verified like any other output — a tracer that silently stops emitting looks
 * exactly like an app that stopped navigating.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { navDevtools } from '../src/devtools';
import { getRegistry } from '../src/core/registry';

function A() { return <div>A</div>; }
function B() { return <div>B</div>; }

async function settle(ms = 150) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe('devtools trace()', () => {
  beforeEach(() => { sessionStorage.clear(); window.history.replaceState({}, '', '/app'); });
  afterEach(() => { navDevtools.trace(false); cleanup(); vi.restoreAllMocks(); });

  it('streams navigations live and stops when turned off', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<NavigationStack id="tr" navLink={{ a: A, b: B }} entry="a" syncHistory />);
    await settle();
    const api = getRegistry().get('tr')!.api!;

    navDevtools.trace();
    await act(async () => { await api.push('b'); });
    await settle();

    const lines = log.mock.calls.map((c) => c.join(' '));
    expect(lines.some((l) => l.includes('push') && l.includes('tr')),
      `expected a push line, got: ${lines.join(' | ')}`).toBe(true);

    // Off must actually be off: a tracer you cannot silence pollutes every later console session.
    navDevtools.trace(false);
    log.mockClear();
    await act(async () => { await api.pop(); });
    await settle();
    expect(log.mock.calls.length, 'trace(false) must stop emitting').toBe(0);
  });
});
