import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Sheet } from '../src/index';

/**
 * The entrance animation must run ONCE per open, however often the sheet is re-measured.
 *
 * A sheet holding a text field is re-measured constantly: the soft keyboard changes the content
 * height, and on iOS it does so in a stream of intermediate sizes as it animates in. The open
 * effect used to re-run on every one of those and re-teleport `y` to the bottom of the screen
 * before sliding up again — and both the `zIndex` and `opacity` transforms read "at the bottom" as
 * "gone", so the sheet blinked out and back on every measurement.
 *
 * What that looked like to a person: a sheet that flickered, sat at a different height every
 * frame, and appeared to close itself while they were typing into it.
 *
 * `onOpenStart` fires exactly where the teleport happens, so counting it is a direct measure of
 * the bug rather than a proxy for it.
 */

const realRO = window.ResizeObserver;
const realRect = Element.prototype.getBoundingClientRect;

let fireResize: (() => void) | null = null;
let measuredHeight = 0;

beforeEach(() => {
  measuredHeight = 0;
  fireResize = null;

  // A ResizeObserver whose callback this test can fire on demand.
  // @ts-expect-error test stub
  window.ResizeObserver = class {
    cb: () => void;
    constructor(cb: () => void) {
      this.cb = cb;
      fireResize = () => this.cb();
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // jsdom reports every box as 0×0, which would keep the sheet in its "not measured yet" branch
  // forever. Report whatever this test has set.
  Element.prototype.getBoundingClientRect = function () {
    return { height: measuredHeight, width: 400, top: 0, left: 0, right: 400,
      bottom: measuredHeight, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  };
});

afterEach(() => {
  window.ResizeObserver = realRO;
  Element.prototype.getBoundingClientRect = realRect;
});

describe('Sheet entrance re-entrance', () => {
  it('starts the open animation once, however many times the sheet is re-measured', async () => {
    const onOpenStart = vi.fn();

    render(
      <Sheet isOpen onClose={() => {}} detent="content" onOpenStart={onOpenStart}>
        <Sheet.Container>
          <Sheet.Content>
            <input aria-label="amount" />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    );

    // First real measurement — this is the legitimate entrance.
    measuredHeight = 300;
    fireResize?.();
    await waitFor(() => expect(onOpenStart).toHaveBeenCalledTimes(1));

    // Now the keyboard opens and the content is re-measured several times, exactly as iOS does it.
    for (const h of [420, 468, 502, 540, 566]) {
      measuredHeight = h;
      fireResize?.();
      await new Promise((r) => setTimeout(r, 0));
    }

    // Still one entrance. Before the fix this was six, and each extra one dropped the sheet to the
    // bottom of the screen at opacity 0 before sliding it back up.
    expect(onOpenStart).toHaveBeenCalledTimes(1);
  });

  it('arms again for the next open', async () => {
    const onOpenStart = vi.fn();

    const view = render(
      <Sheet isOpen onClose={() => {}} detent="content" onOpenStart={onOpenStart}>
        <Sheet.Container>
          <Sheet.Content>
            <div>body</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    );

    measuredHeight = 300;
    fireResize?.();
    await waitFor(() => expect(onOpenStart).toHaveBeenCalledTimes(1));

    // Close, let the close animation settle, then open again.
    view.rerender(
      <Sheet isOpen={false} onClose={() => {}} detent="content" onOpenStart={onOpenStart}>
        <Sheet.Container>
          <Sheet.Content>
            <div>body</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    );
    await new Promise((r) => setTimeout(r, 400));

    view.rerender(
      <Sheet isOpen onClose={() => {}} detent="content" onOpenStart={onOpenStart}>
        <Sheet.Container>
          <Sheet.Content>
            <div>body</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    );
    measuredHeight = 320;
    fireResize?.();

    // A guard that never re-arms would leave the second open with no entrance at all.
    await waitFor(() => expect(onOpenStart).toHaveBeenCalledTimes(2));
  });
});

/**
 * The sheet must be parked FULLY off-screen before it slides in.
 *
 * The entrance translated by `effectiveMaxHeight` — the cap derived from `maxHeight` and
 * `window.innerHeight` — while the close path has always used the measured `sheetHeight`. A sheet
 * whose real height exceeds that cap was therefore parked too high, leaving the difference showing
 * at the TOP of the screen until the slide began: the top of the form first, the rest arriving
 * from below. Reported on iOS on the first open of a sheet, where the height had not settled.
 *
 * `onOpenStart` fires immediately before the parking `y.set`, so reading `y` inside it is reading
 * the exact distance the sheet is about to travel.
 */
describe('Sheet entrance parking', () => {
  it('parks by the measured height, not by the max-height cap', async () => {
    // 900px tall against a 400px cap — the case that left 500px of sheet on screen.
    measuredHeight = 900;

    const sheetRef = { current: null as any };

    render(
      <Sheet ref={sheetRef} isOpen onClose={() => {}} detent="content" maxHeight={400}>
        <Sheet.Container>
          <Sheet.Content>
            <div>tall body</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    );

    fireResize?.();

    /*
     * Read `y` as soon as it has been parked — NOT from inside `onOpenStart`.
     *
     * `onOpenStart` fires 32ms later, inside the settle timer, by which point the parking has
     * already happened and the value is correct however it got there. A first version of this test
     * read it there and passed against the old, too-short parking distance.
     */
    await waitFor(() => expect(sheetRef.current?.y?.get?.() ?? 0).toBeGreaterThan(0));
    const parkedAt = sheetRef.current.y.get();

    // Must clear the whole sheet. Parking at the 400px cap leaves 500px of a 900px sheet showing
    // at the top of the screen until the slide begins.
    expect(parkedAt).toBeGreaterThanOrEqual(900);
  });
});
