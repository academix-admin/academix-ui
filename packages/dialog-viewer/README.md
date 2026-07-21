# @academix-admin/dialog-viewer

Imperative React **dialogs** — alert, confirm and destructive — driven by a
controller hook, so you can open dialogs from anywhere without wiring local
state.

## Install

```bash
npm install @academix-admin/dialog-viewer
npm install react react-dom
```

## Usage

```tsx
'use client';
import DialogViewer, { useDialog, createConfirmDialog } from '@academix-admin/dialog-viewer';

function DeleteButton() {
  const dialog = useDialog();
  return (
    <button
      onClick={() =>
        dialog.show(
          createConfirmDialog({
            title: 'Delete item?',
            message: 'This cannot be undone.',
            onConfirm: () => remove(),
          })
        )
      }
    >
      Delete
    </button>
  );
}

// Mount once near the app root:
export function Dialogs() {
  return <DialogViewer />;
}
```

Exports: `DialogViewer` (default), `useDialog`, `useDialogController`,
`createAlertDialog`, `createConfirmDialog`, `createDestructiveDialog`.

## License

MIT © Academix
