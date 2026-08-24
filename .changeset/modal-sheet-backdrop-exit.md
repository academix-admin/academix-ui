---
"@academix-admin/modal-sheet": patch
---

The backdrop stops taking pointer events the moment it starts fading out.

It swallows events on purpose while the sheet is up — that is what keeps a scroll from bleeding
through to the page behind. On the way out it kept doing so for the whole fade, invisibly: a tap
aimed at the page a fraction of a second after the sheet closed landed on a backdrop that was almost
transparent and about to be unmounted.

It looked like the app dropping taps at random, and it is why an automated UI run would fail on one
pass and pass on the next with nothing changed.
