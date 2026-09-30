/**
 * A card tapped in a sideways row finishes the tap fully on screen — the row moves, sideways only,
 * and nothing else does.
 *
 * jsdom has no layout, so the row and its cards are given the geometry a phone would: a 300px row
 * scrolled to 0, cards 100px wide with no gap. Card 3 (200–300) sits exactly at the edge, card 4
 * (300–400) is entirely off it, and card 3.5 would be half on.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { revealInRow, sidewaysScrollerOf, useRevealTappedInRows } from '../src/index';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type Box = { left: number; width: number };

/** A row 300px wide showing scrollLeft..scrollLeft+300 of cards laid out at `boxes`. */
function makeRow(boxes: Box[], opts: { scrollLeft?: number } = {}) {
  const row = document.createElement('div');
  row.style.overflowX = 'auto';
  let scrollLeft = opts.scrollLeft ?? 0;
  Object.defineProperty(row, 'scrollWidth', { get: () => Math.max(...boxes.map((b) => b.left + b.width)) });
  Object.defineProperty(row, 'clientWidth', { get: () => 300 });
  Object.defineProperty(row, 'scrollLeft', { get: () => scrollLeft, set: (v) => { scrollLeft = v; } });
  row.getBoundingClientRect = () => ({ left: 0, right: 300, width: 300, top: 0, bottom: 40, height: 40, x: 0, y: 0, toJSON() {} }) as DOMRect;
  const scrollBy = vi.fn((arg: ScrollToOptions) => { scrollLeft += arg.left ?? 0; });
  (row as unknown as { scrollBy: typeof scrollBy }).scrollBy = scrollBy;

  const cards = boxes.map((b, i) => {
    const card = document.createElement('button');
    card.textContent = `card ${i}`;
    card.getBoundingClientRect = () => {
      const left = b.left - scrollLeft;
      return { left, right: left + b.width, width: b.width, top: 0, bottom: 40, height: 40, x: left, y: 0, toJSON() {} } as DOMRect;
    };
    row.appendChild(card);
    return card;
  });
  document.body.appendChild(row);
  return { row, cards, scrollBy, get scrollLeft() { return scrollLeft; } };
}

const five = [0, 100, 200, 300, 400].map((left) => ({ left, width: 100 }));

describe('revealInRow', () => {
  it('finds the row that scrolls sideways', () => {
    const { row, cards } = makeRow(five);
    expect(sidewaysScrollerOf(cards[2])).toBe(row);
    row.remove();
  });

  it('brings a card hanging off the right edge fully in, with room to spare', () => {
    const { row, cards, scrollBy } = makeRow([...five, { left: 250, width: 100 }]);
    // card 5 is 250–350: half on screen.
    expect(revealInRow(cards[5], { behavior: 'auto' })).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({ left: 350 - 300 + 12, behavior: 'auto' });
    row.remove();
  });

  it('brings a card hanging off the left edge fully in', () => {
    const { row, cards, scrollBy } = makeRow(five, { scrollLeft: 150 });
    // card 1 is 100–200, on screen at -50..50.
    expect(revealInRow(cards[1], { behavior: 'auto' })).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({ left: -50 - 12, behavior: 'auto' });
    row.remove();
  });

  it('leaves a card that is already fully in view alone', () => {
    const { row, cards, scrollBy } = makeRow(five);
    expect(revealInRow(cards[1])).toBe(false);
    expect(scrollBy).not.toHaveBeenCalled();
    row.remove();
  });

  it('does nothing for a card whose row does not scroll', () => {
    const { row, cards, scrollBy } = makeRow([{ left: 0, width: 100 }, { left: 100, width: 100 }]);
    expect(revealInRow(cards[1])).toBe(false);
    expect(scrollBy).not.toHaveBeenCalled();
    row.remove();
  });
});

function Shell() {
  useRevealTappedInRows({ behavior: 'auto' });
  return null;
}

const nextFrame = () => act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))); });

describe('useRevealTappedInRows', () => {
  it('a tap on a half-hidden card brings it in, a frame after the tap', async () => {
    render(<Shell />);
    const { row, cards, scrollBy } = makeRow([...five, { left: 250, width: 100 }]);
    fireEvent.click(cards[5]);
    expect(scrollBy, 'measured after the tap re-renders, not during it').not.toHaveBeenCalled();
    await nextFrame();
    expect(scrollBy).toHaveBeenCalledTimes(1);
    row.remove();
  });

  it('a tap on the icon inside a card reveals the card', async () => {
    render(<Shell />);
    const { row, cards, scrollBy } = makeRow([...five, { left: 250, width: 100 }]);
    const icon = document.createElement('svg');
    cards[5].appendChild(icon);
    fireEvent.click(icon);
    await nextFrame();
    expect(scrollBy).toHaveBeenCalledWith({ left: 62, behavior: 'auto' });
    row.remove();
  });

  it('leaves a row marked data-no-reveal to its own policy', async () => {
    render(<Shell />);
    const { row, cards, scrollBy } = makeRow([...five, { left: 250, width: 100 }]);
    row.setAttribute('data-no-reveal', '');
    fireEvent.click(cards[5]);
    await nextFrame();
    expect(scrollBy).not.toHaveBeenCalled();
    row.remove();
  });

  it('stops listening when unmounted', async () => {
    const view = render(<Shell />);
    view.unmount();
    const { row, cards, scrollBy } = makeRow([...five, { left: 250, width: 100 }]);
    fireEvent.click(cards[5]);
    await nextFrame();
    expect(scrollBy).not.toHaveBeenCalled();
    row.remove();
  });
});
