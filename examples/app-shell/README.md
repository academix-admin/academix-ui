# App shell starter

A phone-app frame for a React web app, built on [`@academix-admin/app-shell`](../../packages/app-shell). Start a new app by copying this folder.

It shows the things an installed app does and a web page usually doesn't:

- **Tabs that keep their place.** In Stock, open a product, then Sell some. Go to People and come back: Stock is still three pages deep. Tap Stock again to return to its first page.
- **Back stays in the tab.** The phone's Back pops the tab you're on, never another tab's pages.
- **The keyboard doesn't wreck the layout.** The Sell page's box puts the cursor back after Add, as a till does. The tab bar steps aside only while a keyboard is up.
- **Full screen** for a flow that needs it: the tab bar and sidebar go, and the pages keep their place.
- **A pill that rides the tab bar** (`useAppShellBar`), and a sidebar instead of a tab bar on screens wider than 800px.

## Run it

```sh
npm install
npm run dev -- --host
```

Open the network address Vite prints on your phone, which must be on the same Wi-Fi, or use your browser's device mode.

## Make it yours

1. **Theme:** set the `--ax-shell-*` variables in `index.html` (or your CSS) to your colours. The full list is in app-shell's README.
2. **Tabs:** edit `tabs` in `src/App.tsx`. Each tab is `{ id, label, icon, stack }`, where `stack` is a `<NavigationStack>` with that tab's pages.
3. **Pages:** a page is a component. `useNav()` pushes and pops, and `useLocation()` reads its params. Push an id, not a record.
4. **State:** for data fetched from a server, add [`@academix-admin/state-stack`](../../packages/state-stack). Don't keep server data in `useState`.

## In this repo

Here the example builds from the packages' source, not from npm (`vite.config.ts`). `e2e/app-shell.spec.ts` runs it in WebKit as an iPhone and Chromium as an Android phone, so every change to the packages is tested in it before release. Run that with `npm run e2e` from the repo root.
