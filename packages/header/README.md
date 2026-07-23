# @academix-admin/header

A Flutter `AppBar`-style **header** for React: an optional back button, a title,
and a row of right-side action icons (with built-in loading spinners). Styles are
**self-contained** (injected once — no CSS import), theme-aware (light/dark),
responsive, and every part accepts a class override.

## Install

```bash
npm install @academix-admin/header
npm install react react-dom
```

## Usage (the common case)

```tsx
'use client';
import { Header } from '@academix-admin/header';

export default function Page() {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <Header
      title="Redeem Codes"
      theme="dark"
      onBack={() => history.back()}
      actions={[
        { icon: <RefreshIcon />, onClick: refresh, loading: refreshing, ariaLabel: 'Refresh' },
        { icon: <GiveBackIcon />, onClick: openGiveBacks, ariaLabel: 'Give backs' },
      ]}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `ReactNode` | — | Rendered as an `<h1>`. |
| `theme` | `'light' \| 'dark'` | `'light'` | Colour scheme. |
| `onBack` | `() => void` | — | Back handler; shows the back button when set. |
| `showBack` | `boolean` | `onBack != null` | Force the back button on/off. |
| `backIcon` | `ReactNode` | built-in chevron | Override the back icon. |
| `backAriaLabel` | `string` | `'Go back'` | Back button aria-label. |
| `actions` | `HeaderAction[]` | `[]` | Right-side icon buttons (see below). |
| `rightContent` | `ReactNode` | — | Escape hatch rendered after `actions`. |
| `className` | `string` | — | Root element class (alias for `classNames.root`). |
| `classNames` | `HeaderClassNames` | `{}` | Per-part overrides: `root`, `content`, `backButton`, `backIcon`, `title`, `action`. |
| `position` | `'fixed' \| 'sticky' \| 'static'` | `'fixed'` | `fixed` offsets by the sidebar width (see tokens). |
| `style` | `CSSProperties` | — | Inline style on the root. |

**`HeaderAction`**: `{ icon, onClick?, ariaLabel?, disabled?, loading?, className?, key? }`.
While `loading` is true the icon is replaced by a spinner and the button is disabled.

## Theming tokens

The injected CSS reads these variables (with fallbacks), so it drops into an
existing design system with no config:

| Variable | Fallback | Purpose |
|----------|----------|---------|
| `--ax-header-sidebar-width` | `--sidebar-width` → `0px` | Left offset when `position="fixed"`. |
| `--ax-header-text-color` | `--text-color` → `currentColor` | Icon/title colour. |
| `--ax-header-z` | `10` | z-index. |

Below 800px / 500px the header spans full width and the title/back-icon scale
down (responsive, matching the original design).

## License

MIT © Academix
