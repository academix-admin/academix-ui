---
'@academix-admin/state-stack': minor
---

`StateStack.core.scopeDependsOn(scope, upstream)`: declare once that a scope's data is made from other
scopes, and invalidating any of them invalidates it too — transitively, each scope once even in a loop,
with an undo. Staleness only; `clearScope` cascades nothing. A write no longer has to remember every
reader derived from what it changed (store-manager's printed logo outlived its removal that way).
