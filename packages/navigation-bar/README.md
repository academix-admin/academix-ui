# @academix/navigation-bar

A configurable React navigation / tab bar with **normal**, **floating** and
**auto-hide-on-scroll** modes.

## Install

```bash
npm install @academix/navigation-bar
npm install react react-dom
```

## Usage

```tsx
'use client';
import NavigationBar from '@academix/navigation-bar';

const items = [
  { key: 'home', label: 'Home', icon: <HomeIcon /> },
  { key: 'search', label: 'Search', icon: <SearchIcon /> },
];

export default function Bar() {
  return (
    <NavigationBar
      items={items}
      activeKey="home"
      mode="autohide"
      onChange={(key) => console.log(key)}
    />
  );
}
```

Exported types: `NavItem`, `NavigationBarProps`, `NavigationModeType`,
`NavigationBarScrollEvent`. `mode` is `'normal' | 'float' | 'autohide'`.

## License

MIT © Academix
