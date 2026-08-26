---
"@academix-admin/bottom-viewer": patch
"@academix-admin/dialog-viewer": patch
---

Make the sheet and the dialog behave with a keyboard up, the way the search and selection viewers already do.

**bottom-viewer**

- `detent` was accepted, documented and then **ignored** — the underlying sheet was always given
  `"content"`. A consumer asking for a full-height sheet silently got a short one.
- No minimum height, so the panel animated open at nothing and snapped to its content's height a
  frame later. That is the jank; the search and selection viewers avoid it by stating a minimum.
- No ceiling, so a long child list pushed the sheet's top above the viewport and its title and
  close button went off screen, unreachable.
- The whole surface is a drag handle, so a touch settling on a text field read as a dismiss
  gesture and the sheet closed mid-sentence, taking what had been typed with it. Dragging is now
  off while a field has focus, and the sheet goes full-height so the field can be scrolled clear
  of the keyboard.
- Content is padded by exactly what the keyboard covers.

**dialog-viewer**

- The stylesheet subtracted `--ax-keyboard-inset` from the dialog's max height in two places and
  **nothing ever set it**. It fell back to 0 every time, so the accommodation was written, shipped
  and inert: on a phone the dialog kept its full height and the keyboard was drawn over the field
  being typed into. The inset is now published from `visualViewport`.

Field focus is detected with `focusin`/`focusout` on the container rather than by wiring props
through, because the children belong to the consumer and neither component can know where their
fields are.
