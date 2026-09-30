import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSearchInput } from '../src/core';

/**
 * THE BOX IS FOCUSED IN THE TAP THAT OPENS THE SHEET — WITH THE SHEET ALREADY IN PLACE (0.3.5).
 *
 * A phone raises its keyboard only for a focus made in the tap. 0.3.1-0.3.3 did that while the sheet
 * slid up, and iOS moved the page (header off the top, rows under the keyboard); 0.3.4 waited for the
 * slide to end, which kept the page still and never raised the keyboard. The sheet now opens in place
 * (`instant`, modal-sheet 0.3.0) when its box takes focus, so the box is focused in the same render
 * that opens it — as a person's own tap on the box would.
 */
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

const setup = () => {
  const box = document.createElement('input');
  document.body.appendChild(box);
  const hook = renderHook(({ open }) => useSearchInput(open, { text: 'Search', autoFocus: true }), {
    initialProps: { open: false },
  });
  (hook.result.current.searchInputRef as { current: HTMLInputElement | null }).current = box;
  return { box, hook };
};

describe('focus on open', () => {
  it('focuses the box in the render that opens the sheet', () => {
    const { box, hook } = setup();
    hook.rerender({ open: true });
    expect(document.activeElement, 'the box was not focused in the opening render').toBe(box);
    expect(hook.result.current.shouldAutoFocus).toBe(true);
    // The sheet reporting that it opened changes nothing: it is already done, once.
    act(() => hook.result.current.handleOpenEnd());
    expect(document.activeElement).toBe(box);
  });

  it('still focuses the box if the sheet never reports that it opened', async () => {
    const { box, hook } = setup();
    hook.rerender({ open: true });
    await act(() => new Promise((r) => setTimeout(r, 1300)));
    expect(document.activeElement).toBe(box);
  });
});
