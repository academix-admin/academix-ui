import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSearchInput } from '../src/core';

/**
 * THE BOX IS FOCUSED ONCE THE SHEET HAS OPENED, NOT WHILE IT SLIDES UP.
 *
 * A keyboard raised while the sheet was still moving (0.3.1-0.3.3) made iOS move the page: header
 * off the top, rows under the keyboard. A focus once the sheet is at rest behaves like the
 * person's own tap on the box.
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
  it('focuses nothing while the sheet opens, and the box once it has opened', () => {
    const { box, hook } = setup();
    hook.rerender({ open: true });
    expect(document.activeElement, 'something took focus mid-slide').not.toBe(box);
    expect(document.activeElement?.tagName).not.toBe('INPUT');
    expect(hook.result.current.shouldAutoFocus).toBe(false);

    act(() => hook.result.current.handleOpenEnd());
    expect(document.activeElement).toBe(box);
    expect(hook.result.current.shouldAutoFocus).toBe(true);
  });

  it('still focuses the box if the sheet never reports that it opened', async () => {
    const { box, hook } = setup();
    hook.rerender({ open: true });
    await act(() => new Promise((r) => setTimeout(r, 1300)));
    expect(document.activeElement).toBe(box);
  });
});
