---
'@academix-admin/dialog-viewer': minor
---

The dialog can now wear the app's colours.

`layoutProp` already carried the background and the title colour; the buttons and the message did
not, so they stayed iOS blue, iOS red and a fixed grey whatever the app around them looked like. A
shop whose every other button is deep green got a bright blue OK — it reads as somebody else's
dialog, and people hesitate before pressing a button they do not recognise.

Adds `messageColor`, `primaryColor`, `primaryTextColor`, `secondaryColor`, `secondaryTextColor`,
`dangerColor` and `dangerTextColor`. Every one defaults to what this package has always drawn, so a
consumer passing none sees no change at all. Hover is now a brightness filter rather than a second
hardcoded shade, so it follows whatever colour it is given.

Handed over rather than read from CSS variables: this package is app-agnostic and has no business
knowing what an app calls its colours.

Also: the stylesheet is re-injected when those colours change, not only when the id does. It was
written once and left, so an app that switched theme mid-session kept the first theme's dialog until
a reload.
