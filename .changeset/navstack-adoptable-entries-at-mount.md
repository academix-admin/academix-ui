---
'@academix-admin/navigation-stack': patch
---

Back after a reload keeps working when another library writes over a history entry.

0.18.2 read `axPushed` off the current entry at pop time to decide whether an entry of ours sat
behind it. Next's app router replaces the entry's state on arrival (through state-stack's history
patch), so from the second Back onwards the mark was gone, the pop fell back to overwriting the
entry it stood on, and Forward broke again. The count is now taken once, when the stack is rebuilt
from the URL and the mark is still there, and each step additionally checks that the URL we stand on
describes a deeper stack than the one being popped to. A deep link, with nothing behind it, is still
popped in place.
