---
'@academix-admin/selection-viewer': patch
---

The empty and error views show even when the rows are wrapped in a container

`noResultProp` and `errorProp` only rendered when the sheet had no children at all, or when a
Column/Row descendant was reporting its own state. That misses the commonest arrangement there is:
a consumer that wraps its rows in a single container element. `React.Children.count` is then 1
whether the container holds fifty rows or none, so the empty branch never ran.

The result was a blank white sheet at the exact moment somebody had searched for something that is
not there — when the empty state is the only useful thing on screen, and often the only route
forward, since that is where consumers put "add it". Found in store-manager: a seller searching the
till for an item the shop had never entered saw nothing at all.

Now layered alongside the children rather than substituted for them, which is what the composed
case already did and for the same reason: a child that reports its own state must stay mounted to
go on reporting. A consumer whose `selectionState` says "empty" is asserting there is nothing to
show, so drawing its own view beside visually-empty children is what it asked for.

Behavioural fix, not an API change. A consumer that was relying on its `noResultProp` being ignored
while it had children would see it appear — but that is the prop doing what it says.
