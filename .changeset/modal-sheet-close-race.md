---
"@academix-admin/modal-sheet": patch
---

A sheet now always ends in the state `isOpen` asks for. Closed as its entrance finished, the entrance's
last frame could set it open after the close and it stayed open, backdrop over the page, with `isOpen`
false; reopened during its slide-out, it ended closed with `isOpen` true. The state machine now
re-checks `isOpen` whenever its own state changes, and a finished entrance only counts if the sheet
is still wanted open.
