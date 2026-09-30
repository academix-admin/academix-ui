import { describe, it, expect, afterEach, vi } from 'vitest';
import { holdKeyboard } from '../src/core';

/**
 * THE KEYBOARD IS HELD AT THE TOP, AND HANDED OVER IN PLACE.
 *
 * 0.3.1-0.3.2 focused the real box while the sheet was still sliding up, low on the screen: iOS
 * panned the whole page to keep it clear of the keyboard, and the page stayed panned - header cut
 * off, rows under the keyboard. Now the tap focuses a stand-in pinned to the top of the screen (the
 * keyboard rises, nothing to pan to), and the real box takes focus without scrolling only once the
 * sheet has opened.
 */
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const spyFocus = () => {
  const calls: { el: HTMLElement; opts: FocusOptions | undefined }[] = [];
  const real = HTMLElement.prototype.focus;
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement, opts?: FocusOptions) {
    calls.push({ el: this, opts });
    return real.call(this, opts);
  });
  return calls;
};

describe('holdKeyboard', () => {
  it('holds focus on a stand-in at the top of the screen, without scrolling', () => {
    const calls = spyFocus();
    const hold = holdKeyboard();
    const stand = document.activeElement as HTMLInputElement;
    expect(stand.tagName).toBe('INPUT');
    expect(stand.style.position).toBe('fixed');
    expect(stand.style.top).toBe('0px');
    expect(calls[0].opts?.preventScroll).toBe(true);
    hold.cancel();
    expect(stand.isConnected).toBe(false);
  });

  it('hands focus to the real box without scrolling, and takes the stand-in away', () => {
    const calls = spyFocus();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const hold = holdKeyboard();
    const stand = document.activeElement as HTMLInputElement;
    const box = document.createElement('input');
    document.body.appendChild(box);

    hold.handTo(box);
    const onBox = calls.filter((c) => c.el === box);
    expect(onBox.length).toBe(1);
    expect(onBox[0].opts?.preventScroll).toBe(true);
    expect(document.activeElement).toBe(box);
    expect(stand.isConnected).toBe(false);
    // An unpanned page is left alone.
    expect(scrollTo).not.toHaveBeenCalled();

    // A second hand-over does nothing.
    hold.handTo(document.createElement('input'));
    expect(document.activeElement).toBe(box);
  });

  it('puts a panned page back at the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    try {
      const hold = holdKeyboard();
      const box = document.createElement('input');
      document.body.appendChild(box);
      hold.handTo(box);
      expect(scrollTo).toHaveBeenCalledWith(0, 0);
    } finally {
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    }
  });
});
