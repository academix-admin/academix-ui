# @academix-admin/overlay-route

Give a sheet, picker or dialog its own history entry, so the platform's own **Back** closes the
overlay rather than the page under it.

Without one, Back with a picker open closes the picker *and* leaves the page behind it. Measured in
a real shop: the back gesture walked straight out of a half-built sale.

```tsx
import { useOverlayRoute } from '@academix-admin/overlay-route';

const [open, setOpen] = useState(false);
useOverlayRoute('cart:picker', open, () => setOpen(false));
```

That is the whole API for most consumers. The name must be unique among overlays that can be open
at the same time, or they mistake each other's entry.

## Surviving a reload

The fragment outlives a refresh, so an app can come back with `#ax=…` naming a sheet. Pass
`onRestore` and the overlay reopens exactly where it was left:

```tsx
useOverlayRoute('cart:picker', open, () => setOpen(false), {
  onRestore: () => setOpen(true),
});
```

This needs a name that is **stable across loads**: `'cart:picker'` restores, `` `picker:${useId()}` ``
cannot, because the id is new every time.

An overlay that does not restore is closed for you. A URL naming a sheet nobody is showing costs a
whole Back press — the user pressing it twice to leave one page, which is exactly how a web app
stops feeling like a real one.

## Working alongside a navigation library

An overlay's entry is a real history entry, and a navigation library that pops pages with
`history.go(-n)` has to count it: `go` counts positions in the browser's single global list, so an
entry it does not know about leaves every later pop short by one.

Neither package should have to know the other exists. They meet at one function:

```ts
import { setHistoryWriter } from '@academix-admin/overlay-route';

setHistoryWriter(({ mode, href, state }) => {
  // write it, and record it in your own ledger
});
```

`@academix-admin/navigation-stack` does this on import — no wiring, no provider. Nothing registers?
The default writer is used and everything here still works; there is simply no ledger to join.

## What it does to the URL

State lives in the URL **fragment**, because a fragment write never reaches the server, so opening a
sheet cannot trigger a server render. The fragment is not ours, though — `#section-3` deep links and
`scrollIntoView` anchors are ordinary site behaviour — so this owns exactly one `&`-separated `ax=`
segment and passes every other one through untouched, in its original order.

## API

| | |
|---|---|
| `useOverlayRoute(name, open, onClose, opts?)` | The hook. `opts.onRestore` reopens after a reload. |
| `readOverlayFragment()` | The overlay named in the URL now, or `null`. |
| `writeOverlayFragment(name, mode)` | Write the segment directly. |
| `closeUnrestoredOverlay()` | Close one the URL names but nothing showed. |
| `settleOverlayFragment()` | Schedule that, once, after the first frames. |
| `claimOverlay` / `releaseOverlay` / `isOverlayClaimed` / `overlayClaims` | Say what is on screen. |
| `setHistoryWriter(fn)` | Hand history writing to a navigation library. |
| `parseFragment` / `buildFragment` / `setInFragment` | The pure codec. |
