---
"@academix-admin/navigation-stack": patch
---

A page built on `Scaffold` comes back where it was left on Safari. The scroll restore picked a page's
scroller once, when the page mounted — the wrapper, which registers first — and the Scaffold body
that claims the scroll a render later was never listened to, so nothing was recorded. Chrome keeps a
hidden page's offset through `display: none` and hid it; Safari drops it, so on an iPhone every
Scaffold page went back to the top after a push and Back. The restore now follows the scroller
registered now, and hears it in the capture phase from wherever it first attached.
