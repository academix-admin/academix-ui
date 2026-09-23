# @academix-admin/state-stack

## 0.4.0

### Minor Changes

- `useInvalidation(scope, fn)` — re-read when a scope goes stale, for screens that own their loader.

  `invalidateScope` marks a scope's keys stale while keeping their values, which reaches every
  `useDemandState` consumer: the next `demand()` runs. It reached nothing that fetches for itself —
  a paginated list, an infinite scroll, a read assembled from several calls — because those own the
  loader and the package cannot call it.

  So consumers cleared the scope instead, and clearing is a different thing wearing the same coat:
  it empties what is on screen. Reported twice from a real shop — saving one product blanked the
  whole stock list, and LEAVING a customer's account blanked the people list behind it, with nothing
  written at all. Both are one page deleting another page's data in the name of freshness.

  The listener registry lives in the core beside the invalidation it listens for; `useInvalidation`
  is its React binding. Listeners are told AFTER the flags are cleared, or a re-read would be
  refused as already-demanded. Additive: nothing happens unless somebody subscribes, so every
  existing caller of `invalidateScope` behaves exactly as before.

  Also here: the README now lists `useDemandState`'s real options — `deps`, `revalidateOnMount`,
  `revive`, the `clearOn*` family, and that **`persist` defaults to `true`** — and mentions
  `useDemandResource`, which has been exported and undocumented since 0.3.0.

## 0.2.2

### Patch Changes

- Fix: `clearScope()` did not remove persisted data, only in-memory data.

  It iterated `stacks.get(scope)` plus orphaned `loadedKeys` — both in-memory. A key persisted in an
  earlier session, or whose entry had since been evicted, was in neither, so its stored record
  survived the clear and rehydrated on the next load.

  This is why leaving a flow _looked_ like it cleared: the in-memory values really do go, and the
  stale data only reappears later on a fresh load, far from the clear that was supposed to remove it.
  On IndexedDB-backed scopes (`mission_flow`, `secondary_flow`, …) the durable copy is the source of
  truth on the next load, so a scope clear that skips it has not cleared the scope.

  `clearScope` now also sweeps storage by prefix via the adapter's `getAllKeys()` (implemented by all
  four bundled adapters). The scope/key separator makes the boundary exact — `clearScope('mission')`
  must not destroy `mission_flow`, which a bare name match would. `removePersist: false` still skips
  it, and an adapter that cannot enumerate degrades to the previous behaviour rather than failing.
