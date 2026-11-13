# @academix-admin/selection-viewer

An imperative **selection sheet** for React — search + pick one item from a list — with a
controller hook. Built on [`@academix-admin/modal-sheet`](../modal-sheet).

## Install

```bash
npm install @academix-admin/selection-viewer
# peer deps
npm install react react-dom
```

> `@academix-admin/modal-sheet` is installed as a dependency automatically.

## Usage

```tsx
'use client';
import SelectionViewer, { useSelectionController } from '@academix-admin/selection-viewer';

function Page() {
  const [id, ops, isOpen, selectionState] = useSelectionController();

  return (
    <>
      <button onClick={ops.open}>Choose a wallet</button>
      <SelectionViewer
        id={id}
        isOpen={isOpen}
        onClose={ops.close}
        titleProp={{ text: 'Select wallet', textColor: '#000' }}
        selectionState={selectionState}
      >
        {wallets.map((w) => (
          <WalletItem key={w.id} wallet={w} onClick={() => { pick(w); ops.close(); }} />
        ))}
      </SelectionViewer>
    </>
  );
}
```

## Pagination

Pass `onPaginate` to fetch more items as the user nears the bottom of the list (fires once the
scroll container is within 20% of a viewport-height of its end):

```tsx
<SelectionViewer
  ...
  onPaginate={async () => {
    const more = await fetchNextPage();
    return more.length > 0; // return false once there really is nothing left
  }}
/>
```

## `selectionState`

`"initial" | "loading" | "empty" | "error" | "data"` — drives which of `loadingProp` /
`noResultProp` / `errorProp` renders in place of `children`. You own fetching/filtering entirely;
the component only renders what you hand it via `children` and this state.

## Composable sections: `Row` / `Column`

For sectioned lists (e.g. one horizontally-scrolling shelf per category), compose `Row`s inside a
`Column` as `SelectionViewer`'s `children`. Today's flat `children` usage is, unchanged, an
implicit `Column` with no `Row`s.

```tsx
<SelectionViewer isOpen={isOpen} onClose={ops.close} titleProp={{ text: 'Select wallet', textColor: '#000' }}>
  <Column>
    <h3>Recently used</h3>
    <Row state={recentState} onPaginate={loadMoreRecent}>
      {recentWallets.map((w) => <WalletItem key={w.id} wallet={w} onClick={() => pick(w)} />)}
    </Row>

    <h3>All wallets</h3>
    <Row state={allState} onPaginate={loadMoreAll}>
      {allWallets.map((w) => <WalletItem key={w.id} wallet={w} onClick={() => pick(w)} />)}
    </Row>
  </Column>
</SelectionViewer>
```

Unlike `@academix-admin/search-viewer`'s `Row`, this one owns no query/fetch engine —
`SelectionViewer` never had one either, so you fetch/filter yourself and tell each `Row` its own
`state` (same idea as passing `selectionState` to `SelectionViewer` today, just per-section). `Row`
triggers `onPaginate` when scrolled horizontally near its end. `Column` collects every `Row`'s
state and reports one cumulative state up to `SelectionViewer`, so `loadingProp` / `noResultProp` /
`errorProp` react automatically — no result from ANY row → the outer no-result view; any row still
loading (and none have data yet) → the outer loading view; and so on. `Column`s can nest.

Exports: `SelectionViewer` (default), `useSelectionController`, `Row`, `Column`, plus every
prop/type (`SelectionViewerProps`, `SelectionState`, `TitleProps`, `SearchProps`, `LoadingProps`,
`NoResultProps`, `ErrorProps`, `CancelButtonProps`, `LayoutProps`, `Padding`, `SnapPoint`,
`RowProps`, `ColumnProps`).

## Building your own sections

`Row` and `Column` report their loading state up to the viewer, so its `selectionState` reflects every section. To write your own section that takes part:

- `RowAggregateContext`: a section reports its own state into the nearest `Column` through this context (`report(id, state)` / `unreport(id)`).
- `SelectionViewerAggregateContext`: a column reports its combined state to the `SelectionViewer`.
- `computeAggregateState(states)`: how several states combine. Any `data` wins, then any `loading`; all `empty` is `empty`; any `error` is `error`; otherwise `initial`.

## Styling the parts

Each part carries a stable class name you can style from your own CSS. These names are public: a release that renames or removes one is a breaking change (`test/parts.test.ts` holds them).

- `.selection-viewer-header`
- `.selection-viewer-drag-handle`
- `.selection-viewer-cancel`
- `.selection-viewer-search`
- `.selection-viewer-search-back-button`
- `.selection-viewer-search-clear-button`
- `.selection-viewer-fullscreen-search`
- `.selection-viewer-content`
- `.selection-viewer-loading`
- `.selection-viewer-no-results`
- `.selection-viewer-error`

## License

MIT © Academix
