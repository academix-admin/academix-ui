# @academix-admin/state-stack

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
