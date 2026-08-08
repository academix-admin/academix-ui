---
"@academix-admin/selection-viewer": minor
---

Add composable `Row`/`Column` sections, independent from `@academix-admin/search-viewer`'s
equivalent (Library Charter: packages stay mutually independent — same shapes, duplicated
intentionally). `Row` is a horizontally-scrolling section that triggers `onPaginate` near its
end; unlike search-viewer's `Row` it owns no query/fetch engine (`SelectionViewer` never had
one either) — you fetch/filter yourself and pass each `Row` its own `state`, the same idea as
today's `selectionState` prop, just per-section. `Column` is a vertical arrangement of `Row`s
(identical in default layout to today's flat `children` usage) that aggregates every `Row`'s
state and reports one cumulative state up to `SelectionViewer`, so `loadingProp`/`noResultProp`/
`errorProp` react automatically with no manual wiring. `Column`s can nest.
