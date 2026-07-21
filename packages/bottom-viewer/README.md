# @academix/bottom-viewer

An imperative **bottom-sheet viewer** for React — open/close from anywhere via a
controller hook. Built on [`@academix/modal-sheet`](../modal-sheet).

## Install

```bash
npm install @academix/bottom-viewer
# peer deps
npm install react react-dom motion
```

> `@academix/modal-sheet` is installed as a dependency; `motion` is a shared peer
> dependency.

## Usage

```tsx
'use client';
import BottomViewer, { useBottomController } from '@academix/bottom-viewer';

function Page() {
  const sheet = useBottomController();
  return (
    <>
      <button onClick={() => sheet.open()}>Open sheet</button>
      <BottomViewer controller={sheet}>
        <div style={{ padding: 16 }}>Sheet content…</div>
      </BottomViewer>
    </>
  );
}
```

Exports: `BottomViewer` (default), `useBottomController`, `useBottomSheet`.

## License

MIT © Academix
