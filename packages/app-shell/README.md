# @academix-admin/app-shell

An installed app's frame for a React web app, from one component.

```tsx
<AppShell tabs={tabs} logo={<Logo />} />
```

Without it, every app wires the same ten things by hand. With it, you get:

- **One navigation stack per tab**, kept alive. Leave a tab and come back, and it's where you left it.
- **A tab bar on a phone and a sidebar on a wide screen**, fed the same tabs. The switch happens at one width (`breakpoint`).
- **Keyboard-safe on iOS and Android.** The frame is sized to the visible area above the keyboard, the page underneath can't be dragged up, the tab bar steps aside while a keyboard is up, and a focused field is scrolled clear of the keyboard.
- **The phone's safe areas** (the home indicator) are respected.
- **Tap the open tab again** to go back to its first page, and **Back stays in the tab**: it never jumps to another tab's history.
- **Full-screen when you need it** (`immersive`): no tab bar and no sidebar, and the pages keep their place.
- **Server-rendered layout.** The shell's CSS ships with the HTML, so the first paint is the app, not a page that jumps into place.

The pages and the look are yours. The shell is built on [`@academix-admin/navigation-stack`](../navigation-stack), [`@academix-admin/navigation-bar`](../navigation-bar) and [`@academix-admin/sidebar`](../sidebar).

## Install

```sh
npm install @academix-admin/app-shell @academix-admin/navigation-stack @academix-admin/navigation-bar @academix-admin/sidebar
```

React 18 or 19. The three building blocks are peer dependencies, so your app holds one copy of each and can use them directly too.

## Use

```tsx
'use client';
import { AppShell, type AppShellTab } from '@academix-admin/app-shell';
import { NavigationStack } from '@academix-admin/navigation-stack';

const tabs: AppShellTab[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, stack: <NavigationStack id="home" navLink={homePages} entry="home" /> },
  { id: 'orders', label: 'Orders', icon: <OrdersIcon />, stack: <NavigationStack id="orders" navLink={orderPages} entry="orders" /> },
];

export default function App() {
  return <AppShell id="main" tabs={tabs} logo={<Logo />} />;
}
```

Each tab's `stack` is its navigation stack. It's mounted once and kept. The shell reads the stack elements when the list of tab ids changes, not on every render, so an inline `tabs` array doesn't rebuild your pages.

### Holding the tab yourself

```tsx
const [tab, setTab] = useState('home');
<AppShell tabs={tabs} active={tab} onActiveChange={setTab} />
```

Leave `active` out and the shell keeps the tab itself (`defaultActive` picks the first one). `onActiveChange` is called only when the tab changes. If the open tab disappears from `tabs` (a permission is taken away), the shell falls back to the first tab.

### Inside the shell

```tsx
import { useAppShell, useAppShellBar } from '@academix-admin/app-shell';

const { active, setActive, immersive } = useAppShell(); // open another tab from a page
const bar = useAppShellBar(); // { hidden, height, mode } | null: move a floating pill with the bar
```

`useAppShellBar` re-renders only the component that reads it, never the shell. It's `null` until the bar reports. On a wide screen there is no bar, and it reports itself hidden.

## Props

| Prop | Default | |
|---|---|---|
| `tabs` | — | `{ id, label, icon, stack }[]` |
| `id` | `"app"` | Names the group of stacks (history, persistence) and scopes the shell's CSS |
| `active` / `defaultActive` / `onActiveChange` | first tab | Controlled or uncontrolled |
| `logo` / `sidebarFooter` | — | Shown at the head and foot of the sidebar |
| `breakpoint` | `800` | px. At or below it: tab bar. Above it: sidebar |
| `immersive` | `false` | No tab bar, no sidebar |
| `keyboardSafe` | `true` | Sizes the frame above the keyboard, holds the page still, hides the bar while typing |
| `revealFocusedField` | `true` | Scrolls a focused field clear of the keyboard (`true` or `{ margin }`) |
| `reselectToRoot` | `true` | Tapping the open tab goes back to its first page |
| `revealTappedInRows` | `true` | A card tapped in a sideways row scrolls fully into view |
| `persist` | `true` | Keeps each tab's pages across a reload |
| `backStaysInTab` | `true` | The phone's Back pops the tab on screen |
| `navigationBar` | — | Any `NavigationBar` prop over the shell's defaults: heights, mode, `floatingButton` and its styles |
| `sidebar` | — | Any `Sidebar` prop over the shell's defaults: widths, sizes |
| `className` / `classNames` | — | Your classes on `root`, `row`, `side`, `stacks`, `bar` |
| `children` | — | Drawn inside the shell after the pages, for something that belongs to the whole app |

`keyboardSafe` sets up navigation-stack's `ViewportInsetsProvider` and `useResizeToAvoidKeyboard`. If your app also mounts the provider at its root (for pages outside the shell, such as sign-in), both share one listener (navigation-stack 1.13.0).

## Theme

Colours are CSS variables, so a theme switch is a variable change and never a re-render. Set them wherever your theme lives:

```css
:root {
  --ax-shell-bg: #f4f6f5;            /* behind the pages */
  --ax-shell-surface: #ffffff;       /* the tab bar and the sidebar */
  --ax-shell-border: #dde1e0;
  --ax-shell-accent: #0b6252;        /* the open tab, the floating button */
  --ax-shell-accent-hover: #0f7a66;
  --ax-shell-accent-subtle: rgba(11, 98, 82, 0.1); /* the open tab's background in the sidebar */
  --ax-shell-on-accent: #ffffff;     /* text and icon on the floating button */
  --ax-shell-muted: #4d5554;         /* the other tabs */
  --ax-shell-hover-bg: rgba(0, 0, 0, 0.04);
  --ax-shell-bar-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  --ax-shell-button-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}
[data-theme='dark'] {
  --ax-shell-bg: #0f1413;
  --ax-shell-surface: #171d1c;
  /* … */
}
```

## Styling the parts

The parts are public: `.ax-shell`, `.ax-shell__row`, `.ax-shell__side`, `.ax-shell__stacks` and `.ax-shell__bar`, scoped by `[data-ax-shell="<id>"]`, with `[data-immersive]` while immersive. Style them from your CSS, or add your own classes with `classNames`. They're part of the API, so they won't change in a minor version.

## License

MIT
