import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SelectionViewer } from '../src/SelectionViewer';

/**
 * The picker covers the screen, so it has to behave like the modal it is.
 *
 * Escape is the key everybody reaches for to get out of a picker, and Tab must not walk out of the
 * options into the page underneath — where a person is operating controls they cannot see. Both
 * were missing.
 */
afterEach(cleanup);

const open = (props: Record<string, unknown> = {}) =>
  render(
    <SelectionViewer
      isOpen
      onClose={() => {}}
      ariaLabel="Pick a product"
      titleProp={{ text: 'Pick a product', textColor: '#000' }}
      {...props}
    >
      <button type="button">Coca-Cola</button>
      <button type="button">Goldberg</button>
    </SelectionViewer>,
  );

describe('SelectionViewer modal behaviour', () => {
  it('is announced as a named modal dialog', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Pick a product' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    open({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves Escape alone while closed', () => {
    const onClose = vi.fn();
    open({ onClose, isOpen: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('wraps Tab from the last control back to the first', () => {
    open();
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThan(1);
    focusable[focusable.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(focusable[0]);
  });
});
