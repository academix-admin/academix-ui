# @academix-admin/side-drawer

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
