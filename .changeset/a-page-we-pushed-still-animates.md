---
'@academix-admin/navigation-stack': patch
---

A page the app pushes itself still animates, after the platform brought the last one.

`browserDrivenChange` says "the arrival being reconciled is already on screen — iOS's edge-swipe or
Android's Back drew it — so mount it at rest rather than sliding it in over the platform's own
animation". The reconciler consumed it only on the pass that ADDS an entry, and a popstate does not
always add one: arriving back on a page still being rendered out leaves nothing to add, the pass
returns early, and the flag stays set. It is per-stack and long-lived, so the next page the app
pushed itself mounted at rest — appearing instantly, with no transition, for no reason anybody could
reproduce.

Every programmatic navigation goes through the action lock, and a popstate does not — it writes the
snapshot directly and calls `_notifyExternalStackChange`. Clearing the flag there clears what is
stale without ever clearing what is true.

The test that covered this asserted the flag itself, which is a race: which reconcile pass consumes
it depends on whether the page being left has finished rendering out, so it passed in a full run and
failed when its file ran alone. It now asserts what a shop would notice — that the pushed page
carries its entrance class.
