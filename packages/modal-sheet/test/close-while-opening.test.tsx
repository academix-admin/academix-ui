import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useEffect } from 'react';

/**
 * A sheet closed as its entrance finishes must end CLOSED.
 *
 * The entrance's last frame calls `setState('open')`. If the consumer's close lands in the same
 * moment, the close's `setState('closing')` and that `setState('open')` are applied in one batch,
 * `'open'` last — and nothing looked at `isOpen` again, because it had not changed. The sheet sat
 * open, backdrop and all, with `isOpen` false (JIMSteps, 21 Oct: a result sheet that stayed over the
 * next question; read off the live fiber as `Sheet(isOpen=false, state "open")`).
 *
 * Reproduced deterministically by holding the entrance's `onComplete` and firing it from a sibling's
 * effect, which runs straight after the sheet's own effects in the same commit.
 */

const animations: { to: number; onComplete?: () => void }[] = [];

vi.mock('motion/react', async (importOriginal) => {
  const real = await importOriginal<typeof import('motion/react')>();
  return {
    ...real,
    animate: (value: { set: (v: number) => void }, to: number, opts: { onComplete?: () => void } = {}) => {
      animations.push({ to, onComplete: () => { value.set(to); opts.onComplete?.(); } });
      return { stop() {}, then: () => Promise.resolve() };
    },
  };
});

// Imported after the mock is declared (vi.mock is hoisted; this keeps the intent obvious).
const { Sheet } = await import('../src/index');

const realRO = window.ResizeObserver;
const realRect = Element.prototype.getBoundingClientRect;
let fireResize: (() => void) | null = null;

beforeEach(() => {
  animations.length = 0;
  fireResize = null;
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
  Element.prototype.getBoundingClientRect = function () {
    return { height: 300, width: 400, top: 0, left: 0, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  };
});

afterEach(() => {
  window.ResizeObserver = realRO;
  Element.prototype.getBoundingClientRect = realRect;
});

/** Runs `fn` in a passive effect after the sheet's own, whenever `isOpen` changes to false. */
function AfterClose({ isOpen, fn }: { isOpen: boolean; fn: () => void }) {
  useEffect(() => {
    if (!isOpen) fn();
  }, [isOpen]);
  return null;
}

function view(isOpen: boolean, after: () => void, onOpenEnd: () => void) {
  return (
    <>
      <Sheet isOpen={isOpen} onClose={() => {}} detent="content" onOpenEnd={onOpenEnd}>
        <Sheet.Container>
          <Sheet.Content>
            <div>why you missed</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
      <AfterClose isOpen={isOpen} fn={after} />
    </>
  );
}

const settle = () => act(() => new Promise((r) => setTimeout(r, 80)));

describe('a sheet closed as its entrance finishes', () => {
  it('ends closed: the late "opened" does not outlive the close', async () => {
    const onOpenEnd = vi.fn();
    let finishEntrance = () => {};
    const ui = render(view(true, () => finishEntrance(), onOpenEnd));
    act(() => fireResize?.());
    await settle(); // the settle timer has started the entrance
    const entrance = animations.find((a) => a.to === 0);
    expect(entrance).toBeTruthy();
    finishEntrance = () => entrance!.onComplete!();

    // Close; the entrance's last frame lands in the same batch, after the sheet's close.
    ui.rerender(view(false, () => finishEntrance(), onOpenEnd));
    await settle();
    // Let whichever close animation was started run to its end.
    for (const a of animations.filter((x) => x.to > 0)) act(() => a.onComplete?.());
    await settle();

    expect(ui.queryByText('why you missed')).toBeNull();
    expect(document.querySelector('.react-modal-sheet-backdrop')).toBeNull();
    expect(onOpenEnd).not.toHaveBeenCalled();
  });

  it('reopened while closing: it opens again, as isOpen says', async () => {
    const ui = render(view(true, () => {}, () => {}));
    act(() => fireResize?.());
    await settle();
    act(() => animations.find((a) => a.to === 0)!.onComplete!());
    ui.rerender(view(false, () => {}, () => {}));
    await settle();
    const closing = animations.filter((a) => a.to > 0).at(-1)!;
    ui.rerender(view(true, () => {}, () => {})); // back before the slide-out ended
    await settle();
    act(() => closing.onComplete!());
    await settle();
    expect(ui.queryByText('why you missed')).not.toBeNull();
  });
});
