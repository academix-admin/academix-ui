import { describe, it, expect, afterEach, vi } from 'vitest';
import { focusWhenMounted } from '../src/core';

/**
 * The real search box gets a PLAIN focus(), so the browser scrolls it into view.
 *
 * 0.3.1 handed focus from the stand-in to the real box with `preventScroll: true`. iOS's own
 * scroll-into-view of a newly focused box — keyboard accounted for — is what pushed the header away
 * and left the results above the keyboard; with it switched off, the header stayed and the rows sat
 * under the keyboard.
 */
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const frames = (n = 4) =>
  new Promise<void>((resolve) => {
    let left = n;
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });

describe('focusWhenMounted', () => {
  it('hands focus to the box that appears later with a plain focus()', async () => {
    const calls: { el: HTMLElement; opts: FocusOptions | undefined }[] = [];
    const real = HTMLElement.prototype.focus;
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement, opts?: FocusOptions) {
      calls.push({ el: this, opts });
      return real.call(this, opts);
    });

    let box: HTMLInputElement | null = null;
    focusWhenMounted(() => box);
    // The sheet draws its box a frame after the tap.
    await frames(1);
    box = document.createElement('input');
    document.body.appendChild(box);
    await frames(3);

    const onBox = calls.filter((c) => c.el === box);
    expect(onBox.length, 'the box was focused').toBe(1);
    expect(onBox[0].opts?.preventScroll, 'handed focus with preventScroll').toBeFalsy();
    expect(document.activeElement).toBe(box);
  });
});
