---
"@academix-admin/navigation-stack": patch
---

Do not inherit the previous entry's history state on push.

`pushState` was called with `{ ...window.history.state, navStack, group, axSerial }`, so a newly
created history entry carried forward whatever the *previous* entry held. Any other consumer
writing its own marker into `history.state` — a bottom sheet, a dialog, an app's own bookkeeping —
then saw that marker on the pushed entry and concluded the entry was its own.

The observed failure: a modal that records `{ smSheet: id }` when it opens and calls
`history.back()` on close if that id is still on top. Settling a sale closed the modal and pushed a
receipt page in the same tick; the modal found its id on the pushed entry and popped the page. The
navigation reported success and the destination never appeared.

`replaceState` still merges, and must — that is the same entry, so another consumer's state on it
is still theirs. Only `push` is affected, in `core/persistence.ts` and in the overlay hash writer.
