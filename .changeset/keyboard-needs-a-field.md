---
'@academix-admin/navigation-stack': minor
---

`pageScrollerOf(el)`: the page's own scroll region (the `ColumnBody` an element sits in, overflowing or not; else the nearest scrolling ancestor), so apps stop finding it by the package's class name. And `data-ax-keyboard` now needs a focused field: it closes when the field is let go, whatever the visual viewport still measures. On iPhone, Done blurred the field mid-animation and, with no resize at the end, left the tab bar and floating buttons hidden over a page with no keyboard; a pinch-zoom opened it with no field at all.
