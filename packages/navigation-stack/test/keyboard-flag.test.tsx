/**
 * THE KEYBOARD FLAG NEEDS A FIELD (1.12.0) — `<html data-ax-keyboard="open">`.
 *
 * A soft keyboard cannot be up without a focused field. The flag was `measured || …`, and the
 * measurement outlives the keyboard: on iPhone, Done blurs the field while the visible viewport is
 * still short, and with no resize at the end of the animation the tab bar and floating buttons
 * stayed hidden over a page with no keyboard (12 Nov). A pinch-zoom shortens it the same way.
 *
 * jsdom has no VisualViewport, so one is stood in for.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { ColumnBody, ViewportInsetsProvider, pageScrollerOf } from '../src/index';

class FakeViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
  width = 390;
}

let vv: FakeViewport;
const flag = () => document.documentElement.getAttribute('data-ax-keyboard');
const wait = (ms: number) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
const resize = (height: number) =>
  act(() => {
    vv.height = height;
    vv.dispatchEvent(new Event('resize'));
  });

function mount() {
  const utils = render(
    <>
      <ViewportInsetsProvider />
      <input data-testid="field" />
    </>,
  );
  const field = utils.getByTestId('field') as HTMLInputElement;
  // jsdom gives every element an empty box; a field on screen has one.
  field.getBoundingClientRect = () =>
    ({ top: 300, bottom: 344, height: 44, left: 0, right: 390, width: 390, x: 0, y: 300, toJSON() {} }) as DOMRect;
  return field;
}

beforeEach(() => {
  vv = new FakeViewport();
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: vv });
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-ax-keyboard');
});

describe('data-ax-keyboard', () => {
  it('opens on focus, before any keyboard is measured (iOS first focus)', async () => {
    const field = mount();
    act(() => field.focus());
    expect(flag()).toBe('open');
  });

  it('closes when the field is let go, though the viewport still measures a keyboard', async () => {
    const field = mount();
    act(() => field.focus());
    await resize(450); // the keyboard arrives
    expect(flag()).toBe('open');
    // Done: the field blurs mid-animation — the viewport is still short, and no resize follows.
    act(() => field.blur());
    await wait(120);
    expect(flag()).toBeNull();
  });

  it('a keyboard swiped away closes it, though the field keeps focus', async () => {
    const field = mount();
    act(() => field.focus());
    await resize(450);
    expect(flag()).toBe('open');
    await resize(800);
    expect(flag()).toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it('a pinch-zoom with no field focused never opens it', async () => {
    mount();
    await resize(400);
    expect(flag()).toBeNull();
  });
});

describe('pageScrollerOf', () => {
  it('is the ColumnBody an element sits in, whether or not it overflows yet', () => {
    const { getByTestId } = render(
      <ColumnBody>
        <div>
          <span data-testid="deep">x</span>
        </div>
      </ColumnBody>,
    );
    const body = pageScrollerOf(getByTestId('deep'));
    expect(body).not.toBeNull();
    expect(body?.contains(getByTestId('deep'))).toBe(true);
    expect(body?.className).toContain('navstack-column-body');
  });

  it('is null for nothing, and outside a page that scrolls', () => {
    expect(pageScrollerOf(null)).toBeNull();
    const { getByTestId } = render(<span data-testid="loose">x</span>);
    expect(pageScrollerOf(getByTestId('loose'))).toBeNull();
  });
});
