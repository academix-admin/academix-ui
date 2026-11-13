# Academix UI

React packages for web apps that should feel like installed phone apps: tabs that keep their place, Back that does what the phone means, sheets and dialogs Back can close, and layouts the keyboard doesn't wreck. They're published under the `@academix-admin` scope, and each one works on its own.

## Start here

**[`examples/app-shell`](./examples/app-shell)** is a starter. Copy it and you have a working app frame, built on [`@academix-admin/app-shell`](./packages/app-shell): tabs on a phone and a sidebar on a laptop, pages that push and pop, a form, full screen, and a pill that rides the tab bar.

## Packages

### The frame

| Package | What it's for |
| --- | --- |
| [`app-shell`](./packages/app-shell) | The whole app frame from one component: one stack per tab, a tab bar on phones and a sidebar on wide screens, keyboard-safe sizing, safe areas, tap-again-to-go-home, and Back that stays in its tab. |
| [`navigation-stack`](./packages/navigation-stack) | Pages and tabs without a router: transitions, swipe-back, scroll restoration, nested and grouped stacks, params, and a keyboard-safe layout. |
| [`navigation-bar`](./packages/navigation-bar) | The bottom tab bar: normal, floating, or hidden while you scroll. |
| [`sidebar`](./packages/sidebar) | The side rail for wide screens, collapsible. |
| [`header`](./packages/header) | A page's title bar, with back and actions. |

### Overlays

| Package | What it's for |
| --- | --- |
| [`overlay-route`](./packages/overlay-route) | A sheet, picker or dialog gets its own history entry, so Back closes the overlay and not the page under it, and it reopens after a reload. |
| [`modal-sheet`](./packages/modal-sheet) | A gesture-driven bottom sheet: snap points and keyboard avoidance. |
| [`bottom-viewer`](./packages/bottom-viewer) | A bottom sheet you open from code. |
| [`dialog-viewer`](./packages/dialog-viewer) | Alert, confirm and destructive dialogs from a controller hook. |
| [`selection-viewer`](./packages/selection-viewer) | Pick one from a list in a sheet, with search and paging. |
| [`search-viewer`](./packages/search-viewer) | Debounced search over local and server data, with loading, empty and error states. |
| [`side-drawer`](./packages/side-drawer) | A slide-in panel. |

### Inputs

| Package | What it's for |
| --- | --- |
| [`forms`](./packages/forms) | Headless text input, select field, checkbox and radio group. |
| [`pin-input`](./packages/pin-input) | OTP and PIN boxes, and an on-screen keypad. |
| [`scroll-date-picker`](./packages/scroll-date-picker) | An iOS-style wheel date picker. |

### Data

| Package | What it's for |
| --- | --- |
| [`state-stack`](./packages/state-stack) | Fetched and shared state: IndexedDB persistence, sync across tabs, scoped invalidation, per-request stores for server rendering. |
| [`lottie-cache`](./packages/lottie-cache) | Preload and cache Lottie animation JSON. |

## What every package promises

Each promise below is enforced by a check, not just a convention. `npm run verify` runs all of them.

- **Every export is documented and locked.** Each one is named in its package's README, and `test/public-api.test.ts` fails if one disappears (`npm run check:surface`).
- **The parts are styleable.** Each part carries a stable class name, listed under "Styling the parts" in the package's README and held by `test/parts.test.ts`. You never need to reach into internals.
- **They stay small.** Each package's gzipped size has a budget in `size-budgets.json` (`npm run size`).
- **Phone behaviour is tested on phone engines.** `e2e/` runs the example apps in WebKit as an iPhone and Chromium as an Android phone, with touch (`npm run e2e`).
- **React 18 and 19.**

## Develop

```bash
npm install
npm run verify       # build, typecheck, unit tests, public surface, sizes
npm run e2e          # the example apps in WebKit (iPhone) and Chromium (Android)
```

Each package builds with [tsup](https://tsup.egoist.dev/) to ESM and CJS with type declarations. `react` and `react-dom` are peer dependencies, and the `"use client"` directive is kept for React Server Components.

## Release

[Changesets](https://github.com/changesets/changesets): `npx changeset` records a bump, `npx changeset version` applies it, and `npm run release` builds and publishes. Publishing needs an `NPM_TOKEN` with access to the scope (the root `.npmrc` reads it from the environment). Run `npm run verify` and `npm run e2e` first.

## License

MIT
