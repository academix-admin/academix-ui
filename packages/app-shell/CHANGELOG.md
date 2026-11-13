# @academix-admin/app-shell

## 0.1.0

### Minor Changes

- First release. `AppShell`: one navigation stack per tab, a tab bar on a phone and a sidebar on a wide
  screen fed the same tabs, keyboard-safe sizing (the frame follows the visible area, the document is held
  still, the bar steps aside while typing), safe areas, tap-again-to-go-home, Back that stays in the tab,
  and `immersive` full screen — themed with CSS variables, its CSS rendered with the HTML.
  `useAppShell()` opens another tab from a page; `useAppShellBar()` says where the tab bar is without
  re-rendering the shell.

### Patch Changes

- Updated dependencies
  - @academix-admin/navigation-stack@1.13.0
