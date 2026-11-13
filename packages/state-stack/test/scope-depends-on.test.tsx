/**
 * A SCOPE MADE FROM OTHERS GOES STALE WITH THEM (0.7.0).
 *
 * store-manager's receipts cached the shop's paper settings under one scope; the settings page
 * invalidated only its own. A removed logo went on printing until somebody remembered to invalidate
 * both at every write. Declared once with `scopeDependsOn`, the write stays where it is and every
 * reader made from it hears about it.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StateStack, useInvalidation } from '../src/index';

let uid = 0;
const scope = (name: string) => `depends-${name}-${Date.now()}-${uid++}`;

describe('scopeDependsOn', () => {
  it('invalidating the source invalidates what is made from it', () => {
    const settings = scope('settings');
    const receipts = scope('receipts');
    const undo = StateStack.core.scopeDependsOn(receipts, [settings]);
    const reread = vi.fn();
    renderHook(() => useInvalidation(receipts, reread));

    act(() => StateStack.core.invalidateScope(settings));
    expect(reread).toHaveBeenCalledTimes(1);
    undo();
  });

  it('keeps the dependent\'s value: staleness, not clearing', () => {
    const settings = scope('settings');
    const receipts = scope('receipts');
    const undo = StateStack.core.scopeDependsOn(receipts, [settings]);
    StateStack.core.markDemanded(receipts, 'r1');
    act(() => StateStack.core.invalidateScope(settings));
    expect(StateStack.core.isDemanded(receipts, 'r1')).toBe(false);
    undo();
  });

  it('carries on down a chain, and only downstream', () => {
    const a = scope('a');
    const b = scope('b');
    const c = scope('c');
    const undoB = StateStack.core.scopeDependsOn(b, [a]);
    const undoC = StateStack.core.scopeDependsOn(c, [b]);
    const heardA = vi.fn();
    const heardC = vi.fn();
    renderHook(() => useInvalidation(a, heardA));
    renderHook(() => useInvalidation(c, heardC));

    act(() => StateStack.core.invalidateScope(a));
    expect(heardC).toHaveBeenCalledTimes(1);

    act(() => StateStack.core.invalidateScope(c));
    expect(heardA).toHaveBeenCalledTimes(1); // only from the first call, never from c
    undoB();
    undoC();
  });

  it('a loop is visited once per invalidation', () => {
    const a = scope('a');
    const b = scope('b');
    const undoA = StateStack.core.scopeDependsOn(a, [b]);
    const undoB = StateStack.core.scopeDependsOn(b, [a]);
    const heardA = vi.fn();
    const heardB = vi.fn();
    renderHook(() => useInvalidation(a, heardA));
    renderHook(() => useInvalidation(b, heardB));

    act(() => StateStack.core.invalidateScope(a));
    expect(heardA).toHaveBeenCalledTimes(1);
    expect(heardB).toHaveBeenCalledTimes(1);
    undoA();
    undoB();
  });

  it('undo stops it', () => {
    const settings = scope('settings');
    const receipts = scope('receipts');
    const undo = StateStack.core.scopeDependsOn(receipts, [settings]);
    const reread = vi.fn();
    renderHook(() => useInvalidation(receipts, reread));
    undo();

    act(() => StateStack.core.invalidateScope(settings));
    expect(reread).not.toHaveBeenCalled();
  });

  it('clearScope cascades nothing', async () => {
    const settings = scope('settings');
    const receipts = scope('receipts');
    const undo = StateStack.core.scopeDependsOn(receipts, [settings]);
    const reread = vi.fn();
    renderHook(() => useInvalidation(receipts, reread));

    await act(() => StateStack.core.clearScope(settings));
    expect(reread).not.toHaveBeenCalled();
    undo();
  });
});
