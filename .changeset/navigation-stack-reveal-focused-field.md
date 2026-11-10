---
'@academix-admin/navigation-stack': minor
---

`revealFocusedField` on `useViewportInsets` / `ViewportInsetsProvider`: keeps the field being typed in above the keyboard, as a native screen does. On focus, and each time the visible viewport gets shorter, the field's own scroller moves by the least amount that shows it. Opt-in; nothing changes without it.
