# @academix-admin/bottom-viewer

An imperative **bottom-sheet viewer** for React — open/close from anywhere via a
controller hook. Built on [`@academix-admin/modal-sheet`](../modal-sheet).

## Install

```bash
npm install @academix-admin/bottom-viewer
# peer deps
npm install react react-dom motion
```

> `@academix-admin/modal-sheet` is installed as a dependency; `motion` is a shared peer
> dependency.

## Usage

```tsx
'use client';
import BottomViewer, { useBottomController } from '@academix-admin/bottom-viewer';

function Page() {
  const [sheetId, sheet, isOpen] = useBottomController();
  return (
    <>
      <button onClick={() => sheet.open()}>Open sheet</button>
      <BottomViewer id={sheetId} isOpen={isOpen} onClose={sheet.close} ariaLabel="Details" historyRoute="details">
        <div style={{ padding: 16 }}>Sheet content…</div>
      </BottomViewer>
    </>
  );
}
```

Or controlled: `<BottomViewer isOpen={open} onClose={close} ariaLabel="…">…</BottomViewer>`.

`useBottomController()` returns `[id, ops, isOpen, setIsOpen, sheetRef, currentContent]`; `ops` is
`{ open, close, toggle, updateContent, replaceContent, clearContent, isEventFromSheet }`.
`useBottomSheet(initialContent?)` is the dialog-style variant with a bound `BottomViewer`.

Props: `isOpen`, `onClose`, `id`, `backDrop`, `mountPoint`, `historyRoute`, `cancelButton { text,
view, position, style, onClick }`, `layoutProp`, `detent: 'content' | 'full'`, `disableDrag`,
`avoidKeyboard`, `closeThreshold`, `unmountOnClose`, `zIndex`, `ariaLabel`.

## Theming

The sheet takes an app's look as `layoutProp` (it never reads the app's CSS). Every key is optional
and defaults to what the package has always drawn.

| Key | What it sets |
|---|---|
| `backgroundColor`, `handleColor`, `handleWidth` | Colours and the drag handle |
| `maxHeight`, `minHeight`, `maxWidth` | Size |
| `borderRadius`, `boxShadow` (0.5.0+) | The top corners (default `16px`) and the shadow |
| `fontFamily`, `textColor` (0.5.0+) | The sheet's face and text colour (default: inherited) |

Exports: `BottomViewer` (default), `useBottomController`, `useBottomSheet`.

## License

MIT © Academix
