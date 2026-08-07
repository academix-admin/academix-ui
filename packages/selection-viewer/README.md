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

Exports: `SelectionViewer` (default), `useSelectionController`, plus every prop/type
(`SelectionViewerProps`, `SelectionState`, `TitleProps`, `SearchProps`, `LoadingProps`,
`NoResultProps`, `ErrorProps`, `CancelButtonProps`, `LayoutProps`, `Padding`, `SnapPoint`).

## License

MIT © Academix
