---
'@academix-admin/navigation-stack': minor
---

Add `closeUnrestoredOverlay()`, for apps that do not put overlays back after a reload.

An overlay keeps its name in the URL fragment and a fragment survives a reload, so an app comes
back up with `#ax=…` naming a sheet — and it is the consumer, not this package, that decides
whether to restore it. An app that restores nothing was left standing on that sheet's own history
entry with the URL still claiming it was open: the next Back spent itself closing a sheet that was
not there, so leaving one page took two presses.

This package cannot tell an unclaimed overlay from one about to be claimed a tick later, so the
call is opt-in and belongs after the consumer's first render. It steps off the overlay's entry when
the overlay pushed one — exactly what closing it would have done — and otherwise just clears our
fragment segment. Returns whether there was anything to do, and is a no-op on an ordinary boot.
