---
'@academix-admin/navigation-stack': patch
---

The keyboard flag (`html[data-ax-keyboard="open"]`) follows the keyboard the visible viewport measures,
not focus. A field focused from code — refocused after an await, which raises no keyboard on iOS —
no longer opens it and leaves the tab bar and floating buttons hidden over a page with no keyboard.
A field the finger touched still opens it at once, for at most a second until the keyboard measures.
