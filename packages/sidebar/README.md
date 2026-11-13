# @academix-admin/sidebar

A collapsible, resizable side navigation rail for wide screens. Feed it the same items as
`@academix-admin/navigation-bar` and let CSS show one or the other.

## Install

```bash
npm install @academix-admin/sidebar
npm install react react-dom
```

## Usage

```tsx
'use client';
import SideBar from '@academix-admin/sidebar';

const items = [
  { id: 'sell', text: 'Sell', svg: <ReceiptIcon /> },
  { id: 'stock', text: 'Stock', svg: <BoxIcon /> },
];

export function Rail({ active, setActive }) {
  return (
    <SideBar
      navKeys={items}
      activeId={active}
      onChange={(id) => setActive(id)}
      onReselect={(id) => popStackToRoot(id)}
      logo={<Logo />}
      widthExpanded="232px"
      widthCollapsed="68px"
      // A light sidebar: the selected, hover and divider tints default to white-on-dark.
      backgroundColor="#ffffff"
      activeColor="#0b6252"
      inactiveColor="#4d5554"
      hoverColor="#0f7a66"
      activeBackground="#e6f2ef"
      hoverBackground="#f1f3f3"
      dividerColor="#dde1e0"
      toggleColor="#4d5554"
      height="100%"
    />
  );
}
```

The component is the default export. It is also exported by name as `Sidebar` (`import { Sidebar } from '@academix-admin/sidebar'`). For a whole app frame (sidebar on wide screens, tab bar on phones), use `@academix-admin/app-shell`, which is built on it.

## Props

| Prop | What it does |
|---|---|
| `navKeys` | `{ id, text, svg }[]` — the items. |
| `activeId`, `onChange(id, item)` | The selected item, controlled. `onChange` fires for every tap, the active item included. |
| `onReselect(id, item)` | The active item was tapped again (after `onChange`) — e.g. back to that section's first page. |
| `logo`, `footer` | Shown at the top (expanded only) and the bottom. |
| `expandIcon`, `collapseIcon` | The toggle's icons. |
| `widthExpanded`, `widthCollapsed` | Default `280px` / `80px`. The rail can also be dragged wider or narrower by its edge. |
| `backgroundColor`, `activeColor`, `inactiveColor`, `hoverColor` | Surface and text colours. |
| `activeBackground`, `hoverBackground`, `dividerColor`, `toggleColor` | Tints, defaulting to white-on-dark — set them for a light sidebar. |
| `textSize`, `iconSize`, `fontWeight`, `borderRight`, `shadow` | Type and edges. |
| `height` | Default `100vh`; `100%` inside a shell that sizes it. |
| `id`, `className` | The root `<aside>`. |

The rail writes its current width to `--sidebar-width` on `<html>`.

Exported types: `NavItem`, `SidebarProps`.

## Styling the parts

Each part carries a stable class name you can style from your own CSS. These names are public: a release that renames or removes one is a breaking change (`test/parts.test.ts` holds them).

- `.sidebar`
- `.sidebar-header`
- `.sidebar-logo`
- `.sidebar-toggle`
- `.sidebar-nav`
- `.sidebar-item`
- `.sidebar-item-icon`
- `.sidebar-item-text`
- `.sidebar-footer`

## License

MIT © Academix
