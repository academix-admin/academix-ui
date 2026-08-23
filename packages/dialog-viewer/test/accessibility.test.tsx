import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import DialogViewer from '../src/index';

/** See bottom-viewer/test/accessibility.test.tsx — same contract, same reason. */
afterEach(cleanup);

const open = (props: Record<string, unknown> = {}) =>
  render(
    <DialogViewer
      isOpen
      onClose={() => {}}
      title="Delete this receipt?"
      customView={
        <>
          <button type="button">First</button>
          <button type="button">Last</button>
        </>
      }
      buttons={[]}
      showCancel={false}
      {...props}
    />,
  );

describe('DialogViewer accessibility', () => {
  it('takes its accessible name from the visible title', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Delete this receipt?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('lets ariaLabel override a title that says nothing out of context', () => {
    open({ title: 'Are you sure?', ariaLabel: 'Void receipt 4821' });
    expect(screen.getByRole('dialog', { name: 'Void receipt 4821' })).toBeTruthy();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    open({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wraps Tab from the last control back to the first', () => {
    open();
    const first = screen.getByText('First');
    const last = screen.getByText('Last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });
});
