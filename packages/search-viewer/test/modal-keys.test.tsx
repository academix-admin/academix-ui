import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SearchViewer } from '../src/index';

/**
 * The viewer covers the screen, so it has to behave like the modal it is.
 *
 * Escape is the one key everybody reaches for to get out of a search, and Tab must not walk out of
 * the results into the page underneath — where a person is operating controls they cannot see.
 * Both were missing, and it took a UI run stalling on an overlay that would not dismiss to notice.
 */
afterEach(cleanup);

const open = (props: Record<string, unknown> = {}) =>
  render(
    <SearchViewer<string, unknown>
      id="test-search"
      isOpen
      onClose={() => {}}
      ariaLabel="Search customers"
      onInitialData={() => ['Ada', 'Bola']}
      localDataDeps={[]}
      queryData={async () => ({ data: [] })}
      {...props}
    >
      <button type="button">Ada</button>
      <button type="button">Bola</button>
    </SearchViewer>,
  );

describe('SearchViewer modal behaviour', () => {
  it('is announced as a named modal dialog', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Search customers' });
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
