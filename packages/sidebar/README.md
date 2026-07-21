# @academix-admin/sidebar

A flexible, collapsible React **sidebar / side navigation** with nested items.

## Install

```bash
npm install @academix-admin/sidebar
npm install react react-dom
```

## Usage

```tsx
'use client';
import Sidebar from '@academix-admin/sidebar';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
  { key: 'settings', label: 'Settings', icon: <CogIcon /> },
];

export default function Nav() {
  return <Sidebar items={items} activeKey="dashboard" onSelect={(k) => console.log(k)} />;
}
```

Exported types: `NavItem`, `SidebarProps`.

## License

MIT © Academix
