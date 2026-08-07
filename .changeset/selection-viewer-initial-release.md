---
"@academix-admin/selection-viewer": minor
---

Initial release: `@academix-admin/selection-viewer`, extracted from `academix-web`'s
`src/lib/SelectionViewer.tsx`. Imperative selection sheet — search + pick from a list,
scroll-triggered pagination via `onPaginate` — built on `@academix-admin/modal-sheet`
(dependency). Dropped an unused, dead `activeSnap` internal state variable during the move;
the public API is otherwise unchanged from the original `academix-web` component.
