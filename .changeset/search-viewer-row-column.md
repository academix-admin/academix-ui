---
"@academix-admin/search-viewer": minor
---

Add composable `Row`/`Column` sections. `Row` is an independently-paginating,
horizontally-scrolling section built on the existing query engine (search text via
context, no manual `containerRef` wiring). `Column` is a vertical arrangement of
`Row`s (or other content) — identical in default layout to today's flat `children`
usage — that aggregates every `Row`'s state and reports one cumulative state up to
`SearchViewer`, so `loadingProp`/`noResultProp`/`errorProp` react automatically with
no manual wiring. `Column`s can nest.

Also, internally: split the single 2400+ line `SearchViewer.tsx` (half of it dead,
already-commented-out legacy code, now removed) into `core.tsx`, `SearchViewer.tsx`,
`EachViewer.tsx`, `MultipleSearchViewer.tsx`, `Row.tsx`, `Column.tsx`. The public
export surface from `index.ts` is unchanged for every pre-existing export — this
split is non-breaking. Fixed a real bug surfaced while building `Column`:
`SearchViewer`'s internal state-machine `switch` only rendered `children` for the
`"initial"` state, unmounting them (and any Column/Row inside) the instant the state
moved to loading/empty/error — which would have caused the very reporter that
produced that state to unmount, resetting it back to initial in a loop. Composed mode
(anything reporting via the new aggregate context) now always keeps `children`
mounted and layers the loading/empty/error view alongside it instead.
