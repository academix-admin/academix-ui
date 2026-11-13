/**
 * THE FIELD BEING TYPED IN STAYS ABOVE THE KEYBOARD — `revealFocusedField`.
 *
 * A shell sized to the visible viewport shrinks when the keyboard rises, and a field in its lower
 * part ends up under the keyboard: the page "sometimes" hid the very box that had just been tapped
 * (reported on iPhone, 10 Nov). With the option on, the field's own scroller moves just enough to
 * show it; without it nothing scrolls, as before.
 *
 * jsdom has no layout and no VisualViewport, so both are stood in for: a viewport that reports
 * the keyboard, and boxes for the scroller and the field.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { ViewportInsetsProvider } from '../src/index';

class FakeViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
  width = 390;
}

let vv: FakeViewport;

function box(top: number, height: number): DOMRect {
  return { top, bottom: top + height, height, left: 0, right: 390, width: 390, x: 0, y: top, toJSON() {} } as DOMRect;
}

/** A scroller from 0 to `scrollerBottom`, holding a field at `fieldTop` (in page terms). */
function mount(revealFocusedField?: boolean) {
  const utils = render(
    <>
      <ViewportInsetsProvider revealFocusedField={revealFocusedField} />
      <div data-testid="scroller" style={{ overflowY: 'auto' }}>
        <input data-testid="field" />
      </div>
    </>,
  );
  const scroller = utils.getByTestId('scroller');
  const field = utils.getByTestId('field') as HTMLInputElement;
  Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, get: () => vv.height });
  scroller.getBoundingClientRect = () => box(0, vv.height);
  // The field sits 700px down the content; its box follows the scroller's offset.
  field.getBoundingClientRect = () => box(700 - scroller.scrollTop, 44);
  return { scroller, field };
}

async function frames(ms = 400) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

beforeEach(() => {
  vv = new FakeViewport();
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: vv });
});

afterEach(() => {
  cleanup();
});

describe('revealFocusedField', () => {
  it('scrolls the field clear of the keyboard when it rises', async () => {
    const { scroller, field } = mount(true);
    act(() => field.focus());
    // The keyboard arrives: the visible viewport is now 500 tall, and the field (700–744) is under it.
    vv.height = 500;
    act(() => {
      vv.dispatchEvent(new Event('resize'));
    });
    await frames();
    const bottom = field.getBoundingClientRect().bottom;
    expect(bottom).toBeLessThanOrEqual(500 - 16);
    // By the least amount: right at the margin, not to the top.
    expect(bottom).toBeGreaterThan(500 - 16 - 2);
    expect(scroller.scrollTop).toBeGreaterThan(0);
  });

  it('leaves a field that is already in view where it is', async () => {
    const { scroller, field } = mount(true);
    field.getBoundingClientRect = () => box(200 - scroller.scrollTop, 44);
    act(() => field.focus());
    vv.height = 500;
    act(() => {
      vv.dispatchEvent(new Event('resize'));
    });
    await frames();
    expect(scroller.scrollTop).toBe(0);
  });

  it('does nothing unless asked', async () => {
    const { scroller, field } = mount();
    act(() => field.focus());
    vv.height = 500;
    act(() => {
      vv.dispatchEvent(new Event('resize'));
    });
    await frames();
    expect(scroller.scrollTop).toBe(0);
  });
});

/*
 * THE FLAG CLOSES WHEN THE KEYBOARD GOES, even if the field keeps focus (1.11.2). Swiped down or
 * dismissed with Back, the field stayed focused and `data-ax-keyboard` stayed open, so the tab bar
 * and the floating buttons stayed hidden over a page with no keyboard (10 Nov).
 */
describe('data-ax-keyboard', () => {
  // A tap, as a finger makes it: the field touched, then focused (1.12.1 — focus alone is not a keyboard).
  const tap = (el: HTMLElement) =>
    act(() => {
      el.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' }));
      el.focus();
    });

  it('opens on a tap, and closes when the keyboard goes though the field keeps focus', async () => {
    const { field } = mount(false);
    tap(field);
    expect(document.documentElement.getAttribute('data-ax-keyboard')).toBe('open');

    vv.height = 500; // the keyboard arrives
    act(() => {
      vv.dispatchEvent(new Event('resize'));
    });
    expect(document.documentElement.getAttribute('data-ax-keyboard')).toBe('open');

    vv.height = 800; // swiped away; the field is still focused
    act(() => {
      vv.dispatchEvent(new Event('resize'));
    });
    expect(document.activeElement).toBe(field);
    expect(document.documentElement.getAttribute('data-ax-keyboard')).toBeNull();
  });

  it('opens on a tapped field whose keyboard has not been measured yet (iOS first focus)', async () => {
    const { field } = mount(false);
    tap(field);
    expect(document.documentElement.getAttribute('data-ax-keyboard')).toBe('open');
  });
});
