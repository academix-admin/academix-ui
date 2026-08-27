import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Sheet } from '../src/index';

/**
 * The sheet is drawn against the VISIBLE rectangle, not the layout viewport.
 *
 * Two browser behaviours make those differ, and a sheet that ignores the difference gets both of
 * the faults that were reported from a phone:
 *
 *   A soft keyboard shrinks the visual viewport but not the layout viewport, so a bottom-anchored
 *   sheet extends BEHIND the keyboard. Its last fields are on the page but not on the display, and
 *   no amount of scrolling reaches them.
 *
 *   iOS lifts a focused field by scrolling the visual viewport within the layout viewport, which
 *   drags a `position: fixed` overlay — the whole sheet — off the top of the screen.
 *
 * The overlay therefore takes its height from `visualViewport.height` and shifts by
 * `visualViewport.offsetTop`. Both are absorbed: the sheet is simply drawn where the visible area
 * is. An earlier attempt reset `window.scrollTo(0, 0)` on every viewport event instead, which
 * produced the right numbers and felt like the sheet wrestling with the phone.
 */

const listeners = new Set<() => void>();

function setViewport(height: number, offsetTop: number) {
  (window.visualViewport as any).height = height;
  (window.visualViewport as any).offsetTop = offsetTop;
  listeners.forEach((fn) => fn());
}

beforeEach(() => {
  listeners.clear();
  // jsdom has no visualViewport at all.
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: {
      height: 800,
      offsetTop: 0,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    },
  });
});

afterEach(() => {
  delete (window as any).visualViewport;
});

/*
 * The overlay is PORTALED to document.body, so it is not under the render container. Identify it
 * by the two things only it has: fixed position and pointer-events off (it is a pass-through
 * layer; the container inside it takes the pointer events back).
 */
const overlay = (): HTMLElement | null =>
  ([...document.body.querySelectorAll<HTMLElement>('div')].find(
    (el) => el.style.position === 'fixed' && el.style.pointerEvents === 'none',
  ) ?? null);

const renderSheet = () =>
  render(
    <Sheet isOpen onClose={() => {}} detent="content">
      <Sheet.Container>
        <Sheet.Content>
          <input aria-label="first" />
          <input aria-label="third" />
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );

describe('Sheet viewport tracking', () => {
  it('shrinks to the visible area when a keyboard opens', async () => {
    renderSheet();

    // A keyboard takes roughly 45% of an 800px screen.
    setViewport(440, 0);

    await waitFor(() => {
      const el = overlay();
      expect(el?.style.height).toBe('440px');
    });
  });

  it('shifts by the amount the browser scrolled to reveal a field', async () => {
    renderSheet();

    // iOS lifting a field: the visual viewport moves down the page by 260px. Without compensation
    // the fixed overlay goes up by the same amount and the sheet's top leaves the screen.
    setViewport(440, 260);

    await waitFor(() => {
      expect(overlay()?.style.transform).toContain('260px');
    });
  });

  it('returns to full height when the keyboard closes', async () => {
    renderSheet();

    setViewport(440, 260);
    await waitFor(() => expect(overlay()?.style.height).toBe('440px'));

    setViewport(800, 0);
    await waitFor(() => {
      expect(overlay()?.style.height).toBe('800px');
      expect(overlay()?.style.transform).toContain('0px');
    });
  });
});
