---
'@academix-admin/navigation-stack': patch
---

A uid identifies an ENTRY, not a page — so the same page can be in a stack twice.

It was a hash of the route and its params, so pushing the same page again with the same params
produced the same uid twice. React then drew two pages under one key, and the two entries shared a
scroll container, a transition and a cached instance: popping the second landed on a blank page.
Reported from a shop following a customer's empties, up to their account, and into their empties
again — a journey every app with cross-linked records will make.

New entries take their own number; a stack rebuilt from a URL (which carries no uid) takes one per
position, so the uid is the same on every rebuild. A persisted uid of the old shape is regenerated
by position rather than trusted.
