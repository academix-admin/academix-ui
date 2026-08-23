---
"@academix-admin/bottom-viewer": minor
"@academix-admin/dialog-viewer": minor
---

Both viewers are now real modal dialogs.

`BottomViewer` and `DialogViewer` looked modal and behaved modal to a pointer, but neither told
assistive technology so, neither answered Escape, and neither kept focus inside itself. A screen
reader read the sheet as one more region of the page and offered every control behind it as if it
were reachable; a keyboard user could Tab straight out under the overlay and operate things they
could not see, with no key to dismiss what was covering the screen.

Both now render `role="dialog"` + `aria-modal="true"`, close on Escape, and trap Tab/Shift+Tab
within themselves. Both take a new optional `ariaLabel` for the accessible name — `DialogViewer`
defaults it to its visible `title`, so existing dialogs get a correct name with no change; supply it
only when the visible title is not a usable name alone (an icon-only header, or a title as terse as
"Are you sure?"). `BottomViewer` has no title of its own, so a sheet without `ariaLabel` is
announced simply as "dialog" — set it.

Additive: no existing prop, callback or DOM class changes.
