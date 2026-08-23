---
"@academix-admin/navigation-stack": patch
---

A push must not inherit the previous entry's overlay fragment.

`writeNav` copied the current location — including `#ax=…` — onto every newly pushed entry. Any
overlay that records itself in the fragment then finds its own id still on top after a navigation,
concludes the new entry belongs to it, and calls `history.back()` as it closes, discarding the page
that was just pushed.

Observed in store-manager: settling a sale closes the payment sheet and pushes a receipt page in
the same tick, and the receipt was silently thrown away. `push()` resolved true and nothing
appeared.

This is the same defect 0.13.1 fixed for `history.state`, arriving by the other route — the two
places a new entry could inherit what belonged to the old one. `replace` still keeps the fragment,
because that is the same entry and an overlay open on it is still open.
