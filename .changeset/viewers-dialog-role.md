---
"@academix-admin/search-viewer": patch
"@academix-admin/selection-viewer": patch
---

Announce the sheet as a modal dialog.

Neither viewer set `role="dialog"` or `aria-modal`, so a screen reader read an open sheet as one
more region of the page behind it, with nothing to say that the page was unavailable — and no way
for a user to tell that a modal had taken over. `ariaLabel` names it; without a name a modal is
announced simply as "dialog", which says something has taken the screen and nothing about what.

Found by an automated check against store-manager: every search surface passed on behaviour —
opened, filtered, closed on back, drew above the tab bar — and every one failed on "is a dialog
present", because there was nothing for a dialog query to match.

Matches the semantics `bottom-viewer` and `dialog-viewer` gained in the same round.
