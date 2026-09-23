# Two tabs that remember where you were

**[Open it in StackBlitz →](https://stackblitz.com/github/academix-admin/academix-ui/tree/main/examples/two-tabs)**

The shortest demonstration of what `@academix-admin/navigation-stack` is for. Four steps:

1. In **Stock**, open a product, then open its history. You are three pages deep.
2. **Scroll that page a long way down.**
3. Switch to **People** and open somebody.
4. Come back to **Stock**.

You are still three pages deep, and still scrolled exactly where you were. Press the browser's Back
button and it walks back through what you did — popping a page of the tab you are in rather than
jumping to an address.

A router cannot do this, because a route is an address and this is a place.

## What to look at in the code

Everything is in [`src/App.tsx`](./src/App.tsx), about 170 lines including the styles.

- **`GroupNavigationStack`** holds one `NavigationStack` per tab. Each keeps its own pages.
- **`nav.push('history', { name })`** — a route key and params. Params are spread onto the page, so
  they arrive as props; `useLocation()?.params` reads them too, which is what the example does.
- **Scroll restoration is not configured.** It is on by default, keyed per entry.
- `syncHistory` puts the whole stack in the URL — copy the address bar mid-flow, paste it in another
  window, and you land where you were, three pages deep.

## Running it locally

```bash
npm install
npm run dev
```

## Verifying it

`verify.mjs` drives the built example and checks each claim on this page — that the tab comes back
three deep, that the scroll position returns to the same pixel, that Back pops. It needs Playwright,
which is deliberately not a dependency here so that installing the example stays quick:

```bash
npm run build && npm run preview     # in one terminal
npx playwright install chromium      # once
node verify.mjs                      # in another
```
