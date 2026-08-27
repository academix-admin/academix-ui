---
"@academix-admin/state-stack": patch
---

`clearScope` / `clearKey` now make mounted consumers fetch again.

Invalidating dropped the demand flag and the cached value — which looks correct in isolation:
`isDemanded` goes false, so the next `demand()` call would run the loader. But a mounted consumer
has no reason to call `demand()` again. Its effect already ran, and neither its `deps` nor the
callback identity changed. So the value went to empty and STAYED there.

The reported shape: a screen writes something, invalidates its own scope so every screen showing
those figures re-reads, and then sits on a loading state forever — no request in flight, no error.
The clear worked; nothing followed it, and the only way out was for the consumer to arrange its own
re-fetch, which in practice means a timer.

`useDemandState` now remembers the last loader it was given and re-runs it when its key is
invalidated while mounted. Guarded three ways so it cannot loop: only with a loader recorded, only
when the demand flag is actually clear (an ordinary `set` marks it, so normal writes do not
re-enter), and only while mounted.

Covered by `test/invalidation.test.tsx`, which fails without the change — including a case pinning
that a plain `set` does not trigger a re-fetch.
