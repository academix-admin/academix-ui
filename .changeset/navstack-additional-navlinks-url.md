---
'@academix-admin/navigation-stack': patch
---

Routes registered through `additionalNavLinks` now survive the URL.

Pushing encoded a route by its position in the merged map (`navLink` plus `additionalNavLinks`),
but rebuilding a stack from the URL — on a reload, and on every browser Back — decoded against
`navLink` alone. A route that lived only in `additionalNavLinks` was not found, and its raw code
(`aH`) was pushed as if it were a route name: an empty page, a Back with nothing behind it. The
stack also recorded `navLink` alone on its registry entry, so URLs for sibling stacks in a group
could be written from the wrong map and a Back could land in another stack. The component now uses
the merged map for all three, the same map the navigation API already used.
