/**
 * A pop must land on THIS stack's entry, not on whichever entry happens to be N steps back.
 *
 * `_pushDepth` counts entries per stack, but `history.go(-n)` is positional over the browser's
 * single, GLOBAL list — and entries from different stacks interleave:
 *
 *     payment pushes  -> P1
 *     profile pushes  -> F1
 *     payment.pop()   -> payment owns 1 entry, so go(-1) ... lands on F1, profile's entry
 *
 * The pop travels one entry back exactly as asked and arrives at a state belonging to a different
 * stack, restoring that stack's URL and (in a tab group) its `group=`. Reported as "I popped on one
 * tab and ended up on another", and intermittent because it depends entirely on the interleaving —
 * pop the most-recently-pushed stack and the count happens to be correct.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack from '../src/index';
import { getRegistry } from '../src/core/registry';
import { resetEntryLog } from '../src/core/persistence';

function A() { return <div>A</div>; }
function B() { return <div>B</div>; }
function C() { return <div>C</div>; }

async function settle(ms = 200) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

function TwoStacks() {
  return (
    <>
      <NavigationStack id="payment" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />
      <NavigationStack id="profile" navLink={{ a: A, b: B, c: C }} entry="a" syncHistory />
    </>
  );
}

describe('pop with interleaved stacks', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetEntryLog();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('pops to its own entry when another stack pushed after it', async () => {
    render(<TwoStacks />);
    await settle();
    const payment = getRegistry().get('payment')!.api!;
    const profile = getRegistry().get('profile')!.api!;

    await act(async () => { await payment.push('b'); });   // entry: payment depth 2
    await settle();
    await act(async () => { await profile.push('b'); });   // entry: profile depth 2
    await settle();
    await act(async () => { await profile.push('c'); });   // entry: profile depth 3
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await payment.pop(); });       // wants payment back at depth 1
    await settle();

    expect(go, 'the pop must travel to payment’s own entry, three back — not the one step its private count suggests')
      .toHaveBeenCalledWith(-3);
    go.mockRestore();
  });

  it('still pops one step when nothing interleaved', async () => {
    render(<TwoStacks />);
    await settle();
    const payment = getRegistry().get('payment')!.api!;

    await act(async () => { await payment.push('b'); });
    await settle();

    const go = vi.spyOn(window.history, 'go');
    await act(async () => { await payment.pop(); });
    await settle();

    expect(go, 'the simple case must not regress into over-travelling').toHaveBeenCalledWith(-1);
    go.mockRestore();
  });
});
