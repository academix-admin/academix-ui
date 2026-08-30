---
'@academix-admin/selection-viewer': minor
---

A close button a thumb can hit, and rows that keep off the edges of the screen

The cancel button sat at `right: 0, top: 8` with no padding, so the only thing that could be
tapped was the icon glyph itself — a target well under half what a finger needs, in the corner of
the screen where a thumb is least accurate. It is now inset by 4px and padded out to 44px square,
so it still reads as sitting in the corner while the hittable area reaches the edges. Both the
left and right positions get the same treatment.

It also had no accessible name, being a button whose only content is an icon, so a screen reader
announced the one control that dismisses the sheet as "button". New optional `cancelButton.ariaLabel`,
defaulting to "Close".

And the content had no horizontal inset while the title and the search box above it have carried
16px from the start — so a list of rows ran flush into the sides of the screen under a search box
that did not. Now inset to match, with `layoutProp.contentPadding` to override it (pass `0px` for
rows that should reach the edges).

Additive: both new options are optional, and `cancelButton.style` is still spread last, so a
consumer already overriding any of this keeps overriding it. The content inset is a visual change
for consumers that were relying on the previous flush-to-edge default.
