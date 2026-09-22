---
'@academix-admin/navigation-stack': patch
---

A uid names an entry's PLACE in its stack, so scroll positions survive a rebuild.

0.18.5 gave each new entry its own number, which told two copies of one page apart but made a uid a
moment rather than a place. A tab switch unmounts the stack that leaves and rebuilds it from the URL
on the way back — where no uid is carried — so every entry was renamed and everything keyed by one
was lost. The scroll position is keyed by uid, so every page a person had scrolled through opened at
the top again: reported from a shop as "it starts from the top after I change tab and come back".

The uid is now the entry's position, which is unique within a stack and the same on every rebuild.
The trade runs the other way: removing an entry BELOW another renames it (a trimmed stack,
`pushAndPopUntil`) and that page remounts — rare, and a remount rather than a thing noticed daily.
