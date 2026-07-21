import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Sheet } from '../src/index';

function renderSheet(isOpen: boolean, onClose = vi.fn()) {
  return render(
    <Sheet isOpen={isOpen} onClose={onClose} detent="content">
      <Sheet.Container>
        <Sheet.Header>
          <div>sheet-title</div>
        </Sheet.Header>
        <Sheet.Content>
          <div>sheet-body</div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}

describe('Sheet', () => {
  it('exposes the compound API', () => {
    // Sheet is a forwardRef component (an object), with sub-components attached.
    expect(Sheet).toBeTruthy();
    expect(Sheet.Container).toBeTruthy();
    expect(Sheet.Header).toBeTruthy();
    expect(Sheet.Content).toBeTruthy();
    expect(Sheet.Backdrop).toBeTruthy();
  });

  it('renders its content when open', async () => {
    renderSheet(true);
    await waitFor(() => expect(screen.getByText('sheet-body')).toBeInTheDocument());
    expect(screen.getByText('sheet-title')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderSheet(false);
    expect(screen.queryByText('sheet-body')).not.toBeInTheDocument();
  });
});
