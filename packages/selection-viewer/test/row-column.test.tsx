import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SelectionViewer } from '../src/SelectionViewer';
import { Row } from '../src/Row';
import { Column } from '../src/Column';

function setScrollMetrics(el: Element, { scrollLeft, scrollWidth, clientWidth }: { scrollLeft: number; scrollWidth: number; clientWidth: number }) {
  Object.defineProperty(el, 'scrollLeft', { value: scrollLeft, configurable: true });
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
}

describe('Row inside Column inside SelectionViewer', () => {
  it("fires onPaginate when a Row is scrolled near its horizontal end", async () => {
    const onPaginate = vi.fn().mockResolvedValue(true);

    const { container } = render(
      <SelectionViewer isOpen onClose={() => {}} titleProp={{ text: 'Pick one', textColor: '#000' }}>
        <Column>
          <Row state="data" onPaginate={onPaginate}>
            <div>Item 1</div>
          </Row>
        </Column>
      </SelectionViewer>
    );

    await waitFor(() => expect(screen.getByText('Item 1')).toBeInTheDocument());

    const rowEl = document.querySelector('.selection-viewer-row');
    expect(rowEl).toBeTruthy();
    setScrollMetrics(rowEl!, { scrollLeft: 90, scrollWidth: 100, clientWidth: 20 });
    fireEvent.scroll(rowEl!);

    await waitFor(() => expect(onPaginate).toHaveBeenCalledTimes(1));
  });

  it("drives SelectionViewer's own error view from Column's aggregated state, with no manual selectionState prop", async () => {
    render(
      <SelectionViewer
        isOpen
        onClose={() => {}}
        titleProp={{ text: 'Pick one', textColor: '#000' }}
        errorProp={{ view: <div>Section failed</div> }}
      >
        <Column>
          <Row state="error">
            <div>never shown</div>
          </Row>
        </Column>
      </SelectionViewer>
    );

    await waitFor(() => {
      expect(screen.getByText('Section failed')).toBeInTheDocument();
    });
  });

  it("hides the outer no-result view once at least one Row reports data (mixed states -> aggregate 'data')", async () => {
    render(
      <SelectionViewer
        isOpen
        onClose={() => {}}
        titleProp={{ text: 'Pick one', textColor: '#000' }}
        noResultProp={{ view: <div>Nothing here</div> }}
      >
        <Column>
          <Row state="empty">
            <div>empty row</div>
          </Row>
          <Row state="data">
            <div>Real item</div>
          </Row>
        </Column>
      </SelectionViewer>
    );

    await waitFor(() => expect(screen.getByText('Real item')).toBeInTheDocument());
    expect(screen.queryByText('Nothing here')).not.toBeInTheDocument();
  });
});
