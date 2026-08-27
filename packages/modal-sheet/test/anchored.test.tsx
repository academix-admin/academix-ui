import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Sheet } from '../src/index';

/**
 * The sheet must stay put when the keyboard reveals a field.
 *
 * iOS brings a focused field into view by SCROLLING THE LAYOUT VIEWPORT. For a field in the page
 * that is correct; for one in a sheet it is not, because the sheet lives in a fixed overlay and
 * goes up with the page, taking its top off the screen.
 *
 * Reported exactly: the first field in a form behaves perfectly — it is already above the keyboard,
 * so nothing needs to scroll — while the second and third push the sheet's top out of view.
 *
 * jsdom has no keyboard, but the browser behaviour being corrected is just "something set
 * window.scrollY". That is straightforward to simulate, which makes this the one part of the
 * keyboard story that can be tested away from a device.
 */

const realScrollTo = window.scrollTo;

let scrollY = 0;

beforeEach(() => {
  scrollY = 0;
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
  // @ts-expect-error test stub
  window.scrollTo = (_x: number, y: number) => {
    scrollY = y ?? 0;
    window.dispatchEvent(new Event('scroll'));
  };
});

afterEach(() => {
  window.scrollTo = realScrollTo;
});

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

describe('Sheet keyboard anchoring', () => {
  it('undoes a page scroll made while a field inside the sheet has focus', async () => {
    const view = renderSheet();
    const field = await view.findByLabelText('third');

    field.focus();

    // What iOS does a moment after focus: scrolls the page to lift the field above the keyboard,
    // dragging the fixed overlay — and the sheet's top — up with it.
    scrollY = 260;
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(window.scrollY).toBe(0));
  });

  it('leaves the page alone when focus is outside the sheet', async () => {
    const outside = document.createElement('input');
    document.body.appendChild(outside);

    renderSheet();
    outside.focus();

    scrollY = 260;
    window.dispatchEvent(new Event('scroll'));

    // A page that scrolls for its own reasons is not the sheet's business. Resetting here would
    // fight the user on any page that happens to have a sheet mounted.
    await new Promise((r) => setTimeout(r, 60));
    expect(window.scrollY).toBe(260);

    outside.remove();
  });
});
