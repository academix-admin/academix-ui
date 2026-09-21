---
'@academix-admin/navigation-stack': patch
---

Back and Forward work across a reload.

After a reload the in-memory entry ledger is empty — those entries belong to the previous document —
so `pop` could not tell "an entry of ours sits behind this one" from "this is the only entry there
is", and replaced the entry it was standing on. That overwrote the entry the user had just come back
from: the browser's Forward led nowhere, and the entries behind it described a stack that no longer
matched. Each entry now records `axPushed`, which outlives the document, so a pop after a reload
steps back through the browser exactly as it would have before — while a deep link, with nothing
behind it, is still popped in place rather than walked out of.

An entry whose recorded `navStack` is empty (our own teardown clears it) now falls back to the URL
instead of resetting to the stack's root page.
