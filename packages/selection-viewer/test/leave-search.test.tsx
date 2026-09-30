import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { SelectionViewer } from '../src/SelectionViewer';

/**
 * "The selection viewer brings the keyboard, but now we cannot press the back button in it."
 *
 * With `autoFocus` the picker opens in full-screen search. Its arrow leaves search — and the normal
 * header it returns to mounted a new search box still carrying `autoFocus`, which took focus and
 * put the picker straight back into search. The arrow did nothing a person could see.
 */
afterEach(cleanup);

const frames = (n = 4) =>
  act(async () => {
    for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  });

describe('leaving search with the arrow', () => {
  it('stays out of search once the arrow is pressed', async () => {
    render(
      <SelectionViewer
        isOpen
        onClose={() => {}}
        ariaLabel="Pick a product"
        titleProp={{ text: 'Pick a product', textColor: '#000' }}
        searchProp={{ text: 'Search products', autoFocus: true }}
      >
        <button type="button">Coca-Cola</button>
      </SelectionViewer>,
    );
    await frames();
    const arrow = screen.getByRole('button', { name: 'Exit search mode' });
    expect(arrow, 'autoFocus opens the picker in search').toBeTruthy();

    fireEvent.click(arrow);
    await frames(6);

    expect(
      screen.queryByRole('button', { name: 'Exit search mode' }),
      'the arrow left search and the picker went straight back into it',
    ).toBeNull();
    expect(screen.getByPlaceholderText('Search products')).not.toBe(document.activeElement);
  });

  it('can still enter search again by tapping the box', async () => {
    render(
      <SelectionViewer
        isOpen
        onClose={() => {}}
        ariaLabel="Pick a product"
        titleProp={{ text: 'Pick a product', textColor: '#000' }}
        searchProp={{ text: 'Search products', autoFocus: true }}
      >
        <button type="button">Coca-Cola</button>
      </SelectionViewer>,
    );
    await frames();
    fireEvent.click(screen.getByRole('button', { name: 'Exit search mode' }));
    await frames(6);
    fireEvent.focus(screen.getByPlaceholderText('Search products'));
    await frames();
    expect(screen.getByRole('button', { name: 'Exit search mode' })).toBeTruthy();
  });
});
