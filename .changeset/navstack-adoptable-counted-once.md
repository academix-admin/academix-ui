---
'@academix-admin/navigation-stack': patch
---

Count the entries left over from a previous load ONCE per document.

The rebuild that counts them runs again whenever a stack re-initialises, and by then another library
may have written over the entry that carries the mark — so the second count answered "not pushed"
and set it back to nothing, breaking Back from the second press onwards. Proven against the real app
(Next 15 in a four-stack group): follow a chain, reload mid-stack, walk back with the header arrow,
then Forward returns to the page that was left.
