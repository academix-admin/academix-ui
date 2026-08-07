import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchViewer } from '../src/SearchViewer';
import { Row } from '../src/Row';
import { Column } from '../src/Column';

type Item = { id: string; name: string };

function setScrollMetrics(el: Element, { scrollLeft, scrollWidth, clientWidth }: { scrollLeft: number; scrollWidth: number; clientWidth: number }) {
  Object.defineProperty(el, 'scrollLeft', { value: scrollLeft, configurable: true });
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
}

describe('Row inside Column inside SearchViewer', () => {
  it('reaches Row with the live (debounced) search text via context', async () => {
    const queryData = vi.fn(async (_cursor: undefined, text: string) => ({
      data: [{ id: `${text}-1`, name: `Result for ${text}` }] as Item[],
      cursor: undefined,
    }));

    render(
      <SearchViewer
        isOpen
        onClose={() => {}}
        debounceMs={0}
        searchProp={{ text: 'Search', textColor: '#000' }}
      >
        <Column>
          <Row queryData={queryData} debounceMs={0}>
            {({ results }) => (
              <>{results.map((r) => <div key={r.data.id}>{r.data.name}</div>)}</>
            )}
          </Row>
        </Column>
      </SearchViewer>
    );

    const input = await screen.findByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(queryData).toHaveBeenCalledWith(undefined, 'hello', expect.anything());
    });
    await waitFor(() => {
      expect(screen.getByText('Result for hello')).toBeInTheDocument();
    });
  });

  it('fires queryData with the current cursor when Row is scrolled near its end', async () => {
    const page1 = { data: [{ id: '1', name: 'Item 1' }] as Item[], cursor: 'cursor-2' };
    const page2 = { data: [{ id: '2', name: 'Item 2' }] as Item[], cursor: undefined };
    const queryData = vi.fn(async (cursor: string | undefined) =>
      cursor === 'cursor-2' ? page2 : page1
    );

    render(
      <SearchViewer isOpen onClose={() => {}} searchOnOpen debounceMs={0}>
        <Column>
          <Row queryData={queryData} debounceMs={0}>
            {({ results }) => (
              <>{results.map((r) => <div key={r.data.id}>{r.data.name}</div>)}</>
            )}
          </Row>
        </Column>
      </SearchViewer>
    );

    await waitFor(() => expect(screen.getByText('Item 1')).toBeInTheDocument());
    expect(queryData).toHaveBeenCalledWith(undefined, '', expect.anything());

    // Sheet portals its content to document.body, so it's not inside RTL's `container`.
    const rowEl = document.querySelector('.search-viewer-row');
    expect(rowEl).toBeTruthy();
    setScrollMetrics(rowEl!, { scrollLeft: 90, scrollWidth: 100, clientWidth: 20 });
    fireEvent.scroll(rowEl!);

    await waitFor(() => {
      expect(queryData).toHaveBeenCalledWith('cursor-2', '', expect.anything());
    });
    await waitFor(() => expect(screen.getByText('Item 2')).toBeInTheDocument());
  });

  it("drives SearchViewer's own error view from Column's aggregated state, with no manual prop wiring", async () => {
    const queryData = vi.fn(async () => {
      throw new Error('boom');
    });

    render(
      <SearchViewer
        isOpen
        onClose={() => {}}
        searchOnOpen
        debounceMs={0}
        errorProp={{ view: <div>Section failed</div> }}
      >
        <Column>
          <Row queryData={queryData} debounceMs={0}>
            {({ results }) => <>{results.map((r) => <div key={r.data.id} />)}</>}
          </Row>
        </Column>
      </SearchViewer>
    );

    await waitFor(() => {
      expect(screen.getByText('Section failed')).toBeInTheDocument();
    });
  });
});
