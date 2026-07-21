# @academix-admin/modal-sheet

A flexible, gesture-driven **bottom sheet / modal** for React, built on
[Motion](https://motion.dev). Drag to dismiss, snap detents, keyboard avoidance,
safe-area aware, and a clean compound-component API.

- 👆 Drag-to-dismiss with velocity + distance thresholds
- 📐 Detents: `content` (fit children), `default`, `full`
- ⌨️ `avoidKeyboard` for mobile inputs
- 🎨 Fully themeable container / header / content / backdrop
- 🧩 Compound API: `Sheet.Container` / `Sheet.Header` / `Sheet.Content` / `Sheet.Backdrop`
- 🛡️ SSR-safe (`"use client"`)

## Install

```bash
npm install @academix-admin/modal-sheet
# peer deps
npm install react react-dom motion
```

> `motion` (v11+) is a **peer dependency** so your app controls the version and
> shares a single Motion context.

## Usage

```tsx
'use client';
import { useState } from 'react';
import { Sheet } from '@academix-admin/modal-sheet';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open sheet</button>

      <Sheet isOpen={open} onClose={() => setOpen(false)} detent="content">
        <Sheet.Container backgroundColor="#fff" maxWidth="500px">
          <Sheet.Header>
            <h3 style={{ padding: 16 }}>Title</h3>
          </Sheet.Header>
          <Sheet.Content>
            <div style={{ padding: 16 }}>Your content…</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
```

## `<Sheet>` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | **Required.** Open/closed state. |
| `onClose` | `() => void` | — | **Required.** Called on dismiss. |
| `detent` | `'content' \| 'default' \| 'full'` | `'content'` | Height behaviour. |
| `duration` | `number` | `0.22` | Animation duration (seconds). |
| `ease` | `string` | `'easeOut'` | Animation easing. |
| `dragVelocityThreshold` | `number` | `500` | Velocity to trigger close. |
| `dragCloseThreshold` | `number` | `0.6` | Fraction dragged before close. |
| `disableDrag` | `boolean` | `false` | Disable drag gestures. |
| `disableDismiss` | `boolean` | `false` | Prevent closing entirely. |
| `avoidKeyboard` | `boolean` | `false` | Lift above the on-screen keyboard. |
| `maxHeight` | `string \| number` | — | Initial-position height hint (match `Container`). |
| `mountPoint` | `Element` | `document.body` | Portal target. |
| `onOpenStart` / `onOpenEnd` | `() => void` | — | Open animation lifecycle. |
| `onCloseStart` / `onCloseEnd` | `() => void` | — | Close animation lifecycle. |

### Sub-components

- **`Sheet.Container`** — the sheet surface. Props: `backgroundColor`,
  `borderRadius`, `boxShadow`, `maxHeight`, `minHeight`, `maxWidth`,
  `paddingBottom` (defaults to `env(safe-area-inset-bottom)`), plus `style` /
  `className` / `id`.
- **`Sheet.Header`** — a drag handle region. Props: `disableDrag`, `style`,
  `className`.
- **`Sheet.Content`** — scrollable body. Props: `disableScroll`, `scrollStyle`,
  `disableDrag`, `style`, `className`.
- **`Sheet.Backdrop`** — the dimmed overlay. Props: `backgroundColor`, `onTap`.

All prop/interface types (`SheetProps`, `SheetContainerProps`, `SheetDetent`, …)
are exported.

## License

MIT © Academix
