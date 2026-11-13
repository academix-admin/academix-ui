# @academix-admin/side-drawer

## 0.2.1

### Patch Changes

- 41a8f7b: Documentation: every export is named in its README (forms and pin-input had no README at all), and each
  package's README lists its parts' class names under "Styling the parts" — a public contract now, held by
  `test/parts.test.ts`, so an app can style any part without reaching into internals. No code changes.

## 0.2.0

### Minor Changes

- Add an optional `mountPoint` so a host can keep the overlay inside its own layer.

  Both components portalled to the document root with no way to redirect it: `bottom-viewer` passed
  nothing to the underlying sheet, and `side-drawer` hardcoded `portalRoot = document.body`. That is
  fine standalone, but it prevents a host that owns an overlay layer from keeping the overlay inside
  it — for instance a navigation library's group-level host, which stays mounted across tab switches,
  so an overlay portalled to `body` would outlive or escape the layer meant to manage it.

  `mountPoint?: Element` now flows through to the portal, defaulting to `document.body`, so existing
  behaviour is unchanged and this is purely additive. `modal-sheet` already accepted this prop;
  `bottom-viewer` simply forwards it.

  Deliberately generic: these packages take a DOM element and know nothing about who supplies it, so
  they remain usable standalone with no navigation library present.

  No change was needed in `dialog-viewer`, `selection-viewer`, `scroll-date-picker` or
  `search-viewer` — they render in place rather than portalling, so a host can already position them
  by rendering them where it wants.
