# @academix-admin/navigation-bar

A configurable React bottom tab bar with **normal**, **float** and **autohide** (slides away on a
downward scroll, back on an upward one) modes, an optional floating button, and a report of its own
state for anything that has to sit beside it.

## Install

```bash
npm install @academix-admin/navigation-bar
npm install react react-dom
```

## Usage

```tsx
'use client';
import NavigationBar from '@academix-admin/navigation-bar';
import { popStackToRoot, scrollBroadcaster } from '@academix-admin/navigation-stack';

const items = [
  { id: 'sell', text: 'Sell', svg: <ReceiptIcon /> },
  { id: 'stock', text: 'Stock', svg: <BoxIcon /> },
];

export function TabBar({ active, setActive }) {
  return (
    <NavigationBar
      navKeys={items}
      activeId={active}
      onChange={(id) => setActive(id)}
      onReselect={(id) => popStackToRoot(id)}
      onScroll={(callback) => scrollBroadcaster.subscribe(callback)}
      onVisibilityChange={(state) => report(state)}
      mode="autohide"
      // A side rail takes over on wide screens: the bar only exists below 801px.
      media="(max-width: 800px)"
    />
  );
}
```

## Props

| Prop | What it does |
|---|---|
| `navKeys` | `{ id, text, svg }[]` — the tabs. |
| `activeId`, `onChange(id, item)` | The selected tab, controlled. |
| `onReselect(id, item)` | The active tab was tapped again (after `onChange`). |
| `onScroll(subscribe)` | Hands the bar a scroll subscription — it drives `float` and `autohide`. |
| `onVisibilityChange({ hidden, height, mode })` | The bar's own state on every change, for a control that sits at the other end of its line. |
| `media` | A media query: the bar is shown only while it matches. Otherwise it renders nothing, removes the `--nav-height` it wrote, and reports `{ hidden: true, height: '0px' }`. Omit it and the bar always shows. |
| `mode`, `floatScrollThreshold`, `snapPoint` | `'normal' \| 'float' \| 'autohide'`, and how `float` shrinks. |
| `normalHeight`, `shrinkHeight`, `direction`, `itemSpacing`, `iconSize`, `textSize`, `fontWeight`, `paddingX`, `paddingY`, `breakpointSpacing` | Size and layout. |
| `activeColor`, `inactiveColor`, `hoverColor`, `backgroundColor`, `barBorderTop`, `barBorderRadius`, `barShadow` | Look. |
| `floatingButton` and `floatingButton*` | A floating button that brings a hidden bar back; position, size, colours and when it shows. |
| `className` | The bar's root. |

While shown, the bar writes the room it takes to `--nav-height` on `<body>` (height, border, safe
area, and the floating button's room while hidden), so a page can pad its foot by it.

Exported types: `NavItem`, `NavigationBarProps`, `NavigationModeType`, `NavigationBarScrollEvent`,
`NavigationBarVisibility`.

## License

MIT © Academix
