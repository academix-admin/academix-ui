---
'@academix-admin/overlay-route': minor
'@academix-admin/navigation-stack': minor
'@academix-admin/modal-sheet': minor
'@academix-admin/bottom-viewer': minor
'@academix-admin/dialog-viewer': minor
'@academix-admin/selection-viewer': minor
---

New package `@academix-admin/overlay-route`, and every sheet in the project can now use it.

An overlay needs its own history entry, or the platform's Back closes the overlay AND the page under
it — measured in a real shop, the back gesture walked straight out of a half-built sale. The rules
for doing that correctly are small in number and each was paid for with a bug: closing on the wrong
tick, a sheet dismissing itself 400ms after opening, a cleanup discarding the page that had just
been pushed.

They lived inside one app. They now live in a package with no dependencies, so any app can have
them — and so the viewer packages here can offer the capability without any of them depending on a
navigation library.

**`modal-sheet`, `bottom-viewer`, `dialog-viewer` and `selection-viewer` gain an optional
`historyRoute` prop.** Name it and the overlay gets a real entry, so Back closes the sheet; leave it
off and nothing changes, which is what makes this a minor.

**The two halves meet at one function, not a dependency.** An overlay's entry is a real entry, and a
navigation library popping pages with `history.go(-n)` has to count it — `go` counts positions in
the browser's single global list, so an entry it has never heard of leaves every later pop short by
one. Rather than have either package import the other, overlay-route offers `setHistoryWriter` and
navigation-stack fills it on import: no wiring, no provider. An app using overlay-route alone still
gets a working back gesture; it simply has no ledger to join.

navigation-stack re-exports the whole surface, so every existing import of `useOverlayRoute`,
`readOverlayFragment`, `writeOverlayFragment` and the codec continues to resolve unchanged.
