---
'@academix-admin/navigation-stack': patch
---

`data-ax-keyboard` closes when a keyboard that was measured goes away, even if the field keeps focus (swiped down, Android Back, the iPad's hide key). Focus alone still opens it, for iOS's first focus, where no inset is reported.
