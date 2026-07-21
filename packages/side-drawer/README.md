# @academix/side-drawer

A lightweight, portal-based React **side drawer / off-canvas panel**.

## Install

```bash
npm install @academix/side-drawer
npm install react react-dom
```

## Usage

```tsx
'use client';
import { useState } from 'react';
import SideDrawer from '@academix/side-drawer';

export default function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <SideDrawer isOpen={open} onClose={() => setOpen(false)} side="left">
        <nav>Drawer content…</nav>
      </SideDrawer>
    </>
  );
}
```

Rendered through a React portal (`react-dom`). `SideDrawerProps` typing is
exported.

## License

MIT © Academix
