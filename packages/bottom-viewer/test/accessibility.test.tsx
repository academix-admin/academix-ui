import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import BottomViewer from '../src/index';

/**
 * The sheet is modal: it covers the page, and while it is up the page behind it is not available.
 *
 * These are not decorative attributes. Without `role="dialog"` + `aria-modal` a screen reader reads
 * the sheet as one more region of the page and offers everything behind it as if it were reachable;
 * without the key handling a keyboard user can Tab out into controls they cannot see and has no key
 * to dismiss what is covering the screen.
 *
 * Written when an app-level sheet — which had all of this and was kept only for that reason — was
 * retired in favour of this component. These tests are what makes that retirement safe.
 */
afterEach(cleanup);

const open = (props: Record<string, unknown> = {}) =>
  render(
    <BottomViewer isOpen onClose={() => {}} ariaLabel="Record a payment" {...props}>
      <button type="button">First</button>
      <button type="button">Last</button>
    </BottomViewer>,
  );

describe('BottomViewer accessibility', () => {
  it('is announced as a named modal dialog', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Record a payment' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    open({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves Escape alone while closed, so it cannot close what is behind it', () => {
    const onClose = vi.fn();
    render(
      <BottomViewer isOpen={false} onClose={onClose} ariaLabel="Record a payment">
        <button type="button">First</button>
      </BottomViewer>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('wraps Tab from the last control back to the first', () => {
    open();
    const first = screen.getByText('First');
    const last = screen.getByText('Last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab from the first control back to the last', () => {
    open();
    const first = screen.getByText('First');
    const last = screen.getByText('Last');
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
