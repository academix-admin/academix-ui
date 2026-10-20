/**
 * A travelling app bar left half on screen reads as a layout fault. `Scaffold snap` settles it when
 * scrolling stops: less than half gone, it comes back; half or more, it goes and the sticky section
 * beneath takes the top. Off by default, so every page that doesn't ask behaves as before.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { Scaffold } from '../src/bodies';
import { SNAP_IDLE_MS, snapTarget } from '../src/scroll/snap-bar';

describe('snapTarget', () => {
  it('brings the bar back when less than half of it has gone', () => {
    expect(snapTarget(20, 64, 1000)).toBe(0);
  });

  it('hides the bar when half or more has gone, so the sticky section takes the top', () => {
    expect(snapTarget(32, 64, 1000)).toBe(64);
    expect(snapTarget(50, 64, 1000)).toBe(64);
  });

  it('leaves the page alone at the top, and once the bar is fully gone', () => {
    expect(snapTarget(0, 64, 1000)).toBeNull();
    expect(snapTarget(64, 64, 1000)).toBeNull();
    expect(snapTarget(400, 64, 1000)).toBeNull();
  });

  it('on a page too short to hide the whole bar, settles at the nearer end it can reach', () => {
    expect(snapTarget(30, 64, 40)).toBe(40);
    expect(snapTarget(10, 64, 40)).toBe(0);
    expect(snapTarget(10, 64, 0)).toBeNull();
  });

  it('does nothing for a bar with no height', () => {
    expect(snapTarget(10, 0, 1000)).toBeNull();
  });
});

describe('Scaffold snap', () => {
  let scrollTo: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A scroll body with a 64px bar and room to scroll, stopped at `top`. */
  function stopAt(container: HTMLElement, top: number) {
    const bar = container.querySelector('.navstack-scaffold__bar--travels') as HTMLElement;
    const body = bar.parentElement as HTMLElement;
    Object.defineProperty(bar, 'offsetHeight', { configurable: true, value: 64 });
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 600 });
    body.scrollTop = top;
    body.dispatchEvent(new Event('scroll'));
    return body;
  }

  it('settles a half-gone bar once scrolling stops', () => {
    const { container } = render(
      <Scaffold appBar={<header>Title</header>} appBarBehavior="scroll" snap>
        <div style={{ height: 2000 }} />
      </Scaffold>,
    );
    stopAt(container, 40);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(SNAP_IDLE_MS + 10);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 64 }));
  });

  it('never moves the page while a finger is down', () => {
    const { container } = render(
      <Scaffold appBar={<header>Title</header>} appBarBehavior="scroll" snap>
        <div style={{ height: 2000 }} />
      </Scaffold>,
    );
    const body = stopAt(container, 20);
    body.dispatchEvent(new Event('touchstart'));
    body.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(SNAP_IDLE_MS * 3);
    expect(scrollTo).not.toHaveBeenCalled();
    body.dispatchEvent(new Event('touchend'));
    vi.advanceTimersByTime(SNAP_IDLE_MS + 10);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });

  it('is off by default', () => {
    const { container } = render(
      <Scaffold appBar={<header>Title</header>} appBarBehavior="scroll">
        <div style={{ height: 2000 }} />
      </Scaffold>,
    );
    stopAt(container, 40);
    vi.advanceTimersByTime(SNAP_IDLE_MS * 3);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
