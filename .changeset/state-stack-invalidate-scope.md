---
'@academix-admin/state-stack': minor
---

`invalidateScope` — stale, but keep what is on screen

The missing middle between leaving a cache alone and `clearScope`. A write elsewhere makes cached
data stale; the screens holding it should re-read on their next demand and, until that lands, go on
showing the last good answer.

`clearScope` was the only tool for this and it deletes: the value goes, the demanded flag goes with
it, and every screen holding that scope blanks and re-fetches from nothing. The obvious workaround —
tell the screens to load again — does nothing, because `demand()` returns early once a key has been
demanded. So a consumer wanting "refetch, don't blank" had to choose between a blank screen and a
cache that never refreshed.

`StateStack.core.invalidateScope(scope)` clears the demanded and loaded flags and notifies
subscribers, so the next `demand()` runs its loader. It keeps the value, the persisted copy, the
history, the TTL timer, and the hydration flag — a screen that already has data must not be told it
is waiting for some.

Additive and non-breaking: nothing calls it unless it asks for it, and `clearScope` is untouched for
the cases that genuinely must forget — signing out, or switching account.
