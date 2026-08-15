/**
 * A captured pixel offset only means something at the width it was captured at.
 *
 * 200px at 1200px wide is a different place in the document at 430px wide: narrower columns make
 * content taller, so the same offset lands much earlier than where the user actually was. The
 * restore "succeeds" and puts them somewhere they have never been, which is worse than not
 * restoring — it looks like the page jumped on its own.
 */
import { describe, it, expect } from 'vitest';
import { resolveScrollTarget } from '../src/scroll/index';

describe('resolveScrollTarget', () => {
  it('restores the exact offset when the width has not changed', () => {
    // The user saw precisely this offset; proportional maths here would only add rounding error.
    expect(resolveScrollTarget(200, { width: 1200, maxScroll: 2000 }, 1200, 2000)).toBe(200);
  });

  it('tolerates sub-pixel and scrollbar-sized width differences', () => {
    expect(resolveScrollTarget(200, { width: 1200, maxScroll: 2000 }, 1201, 2000)).toBe(200);
  });

  it('restores proportionally when the width changed', () => {
    // 200/2000 = 10% down. At 430px the document is taller (6000), so 10% is 600px.
    expect(resolveScrollTarget(200, { width: 1200, maxScroll: 2000 }, 430, 6000)).toBe(600);
  });

  it('never scrolls past the end of the current document', () => {
    // Reflow can make the document SHORTER; an unclamped restore would ask for an impossible offset
    // and the browser would silently clamp it, hiding the mismatch from anything reading it back.
    expect(resolveScrollTarget(1800, { width: 1200, maxScroll: 2000 }, 430, 500)).toBe(450);
    expect(resolveScrollTarget(1800, { width: 1200, maxScroll: 2000 }, 1200, 500)).toBe(500);
  });

  it('stays at the top when the position was the top', () => {
    expect(resolveScrollTarget(0, { width: 1200, maxScroll: 2000 }, 430, 6000)).toBe(0);
  });

  it('falls back to the raw offset when nothing was captured', () => {
    // No metrics: positions recorded before this existed, or a container that never scrolled. The
    // old behaviour is the honest default rather than a guess.
    expect(resolveScrollTarget(200, undefined, 430, 6000)).toBe(200);
  });

  it('does not divide by zero when the page could not scroll at capture time', () => {
    expect(resolveScrollTarget(200, { width: 1200, maxScroll: 0 }, 430, 6000)).toBe(200);
  });
});
