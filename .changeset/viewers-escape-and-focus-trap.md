---
"@academix-admin/search-viewer": minor
"@academix-admin/selection-viewer": minor
---

Escape closes the viewer, and Tab stays inside it.

Both viewers cover the screen and already announced themselves as `role="dialog" aria-modal="true"`,
but nothing backed that up for the keyboard: Tab walked straight out of the results into the page
underneath, where a person operates controls they cannot see, and Escape — the one key everybody
reaches for to get out of a search or a picker — did nothing at all.

Found the hard way: a UI run stalled with an overlay that would not dismiss and every subsequent tap
landing on a result row.

Each package carries its own copy of the handler rather than sharing one, so neither picks up a
dependency on the other. Additive: no prop, callback or DOM class changes.
