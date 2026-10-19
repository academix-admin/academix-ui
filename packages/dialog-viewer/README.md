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
import { useDialog, createConfirmDialog } from '@academix-admin/dialog-viewer';

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const dialog = useDialog();
  return (
    <>
      <button onClick={() => dialog.open()}>Delete</button>
      <dialog.DialogViewer
        {...createConfirmDialog('Delete item?', 'This cannot be undone.', () => {
          onDelete();
          dialog.close();
        }, dialog.close)}
        historyRoute="delete-item"   // Back closes the dialog, not the page
      />
    </>
  );
}
```

Or controlled: `<DialogViewer isOpen={open} onClose={close} title message buttons={[{ text, onClick,
variant: 'primary' | 'secondary' | 'danger', loading, disabled }]} />`, or `customView={<YourCard />}`
for content of your own.

`useDialog(initialContent?)` returns `{ isOpen, open(content?), close, toggle, updateContent,
clearContent, DialogViewer, currentContent }`. The presets return props to spread and take
positional arguments: `createAlertDialog(title, message, onOk)`, `createConfirmDialog(title,
message, onConfirm, onCancel)`, `createDestructiveDialog(title, message, confirmText, onConfirm)`.

## Theming

The dialog takes an app's look as `layoutProp` (it never reads the app's CSS). Every key is
optional and defaults to what the package has always drawn.

| Key | What it sets |
|---|---|
| `backgroundColor`, `maxWidth`, `borderRadius`, `margin` | The card (the radius also holds on phones, 0.6.0+) |
| `titleColor`, `messageColor` | Text colours |
| `primaryColor`, `primaryTextColor`, `secondaryColor`, `secondaryTextColor`, `dangerColor`, `dangerTextColor` | Button colours |
| `boxShadow`, `contentPadding` | Set `'none'` / `'0'` (with a transparent background) to draw nothing around a `customView` card |
| `fontFamily` (0.6.0+) | The dialog's face |
| `headerBackground`, `headerAlign`, `titleFontSize`, `titleFontWeight` (0.6.0+) | The title as a coloured band across the top |
| `buttonRadius`, `buttonFontSize`, `buttonFontWeight`, `buttonShadow` (0.6.0+) | The buttons' shape, e.g. a solid `0 4px 0 rgba(0,0,0,.2)` for a pressable look |

Exports: `DialogViewer` (default), `useDialog`, `useDialogController`,
`createAlertDialog`, `createConfirmDialog`, `createDestructiveDialog`.

## License

MIT © Academix
