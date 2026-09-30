import { useEffect } from 'react';

/**
 * A CARD TAPPED IN A SIDEWAYS ROW FINISHES THE TAP FULLY ON SCREEN.
 *
 * Rows of chips, filters, tabs and cards scroll sideways, and the one at the edge is usually cut in
 * half. Tapping it selects it and leaves it hanging there: the choice just made is the thing on
 * screen you can see least of. Native pickers bring it in; a web row does nothing unless somebody
 * wrote code for that one row — which is how an app ends up doing it in one place and not the ten
 * others.
 *
 * Sideways only, and only the row. `Element.scrollIntoView` scrolls every scrollable ancestor, so it
 * nudges the page up or down too, and on a screen with its own vertical settle running at the same
 * moment the two fight. This moves `scrollLeft` of the one row and nothing else.
 */

export interface RevealInRowOptions {
  /** Room left between the card and the row's edge, in px. Default 12. */
  margin?: number;
  /** Default `'smooth'`, or `'auto'` when the person has asked for reduced motion. */
  behavior?: ScrollBehavior;
}

function scrollsSideways(el: HTMLElement): boolean {
  if (el.scrollWidth <= el.clientWidth + 1) return false;
  const overflowX = getComputedStyle(el).overflowX;
  return overflowX === 'auto' || overflowX === 'scroll';
}

/** The nearest ancestor of `el` that scrolls sideways and has somewhere to go, or null. */
export function sidewaysScrollerOf(el: Element | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    if (scrollsSideways(node)) return node;
    node = node.parentElement;
  }
  return null;
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

/**
 * Scroll the row `el` sits in — sideways only — so `el` is wholly inside it. Returns whether the row
 * had to move. A card wider than the row is aligned to its start edge.
 */
export function revealInRow(el: HTMLElement | null, options: RevealInRowOptions = {}): boolean {
  if (!el || typeof window === 'undefined') return false;
  const row = sidewaysScrollerOf(el);
  if (!row) return false;

  const r = row.getBoundingClientRect();
  const c = el.getBoundingClientRect();
  if (r.width <= 0 || c.width <= 0) return false;

  // The margin is only room to spare: a card nearly as wide as the row gets what is left.
  const margin = Math.max(0, Math.min(options.margin ?? 12, (r.width - c.width) / 2));

  let delta = 0;
  if (c.width > r.width - 2 * margin || c.left < r.left + margin) {
    delta = c.left - (r.left + margin);
  } else if (c.right > r.right - margin) {
    delta = c.right - (r.right - margin);
  }
  if (Math.abs(delta) < 1) return false;

  const behavior = options.behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth');
  row.scrollBy({ left: delta, behavior });
  return true;
}

/** What counts as "the card" that was tapped: the control itself, not the icon inside it. */
const TAPPABLE = 'button, a[href], [role="tab"], [role="option"], [role="radio"], [role="button"], label, [data-reveal]';

/**
 * Every tap inside a sideways row reveals what was tapped. Mount once, near the root.
 *
 * Measured a frame AFTER the tap, so a selection that re-renders the row (a chip growing a tick, a
 * tab becoming bold) is measured as it will be seen. A row, or a card, marked `data-no-reveal` is
 * left alone — for a row that has its own policy, like one that centres its active tab.
 */
export function useRevealTappedInRows(options: RevealInRowOptions & { enabled?: boolean } = {}): void {
  const { enabled = true, margin, behavior } = options;
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const card = target.closest<HTMLElement>(TAPPABLE);
      if (!card || card.closest('[data-no-reveal]')) return;
      if (!sidewaysScrollerOf(card)) return;

      requestAnimationFrame(() => {
        if (!card.isConnected) return;
        revealInRow(card, { margin, behavior });
      });
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [enabled, margin, behavior]);
}
