# @academix-admin/state-stack

## 0.5.1

### Patch Changes

- Documentation: what happens on a server, and why nothing here suspends.

  **Client-only, on purpose.** Every file this package ships carries `'use client'`, so nothing runs
  during a server render. That is not an oversight — what it holds is what ONE DEVICE knows: a value
  in that browser's IndexedDB, scoped to where that person is, invalidated by what they did. A server
  has none of those, and inventing them there is how an app renders one person's cache to somebody
  else. The README now says so, with what follows: client components, no server snapshot and
  therefore no hydration mismatch to manage, and `persist` being a browser store.

  Also there: wiring route scoping in the Next App Router, and how to seed the client's copy when the
  server already has the data.

  **These hooks do not suspend, and that is a decision.** Suspending means "show nothing until ready"
  — the component is replaced by a fallback. That is the exact behaviour this package exists to
  prevent: a screen with an answer keeps it while a newer one is fetched, and a failed refresh keeps
  what it has and says so. A suspending read cannot express either, because from outside both look
  like "not ready". Branch on `loaded` and `isValidating` instead. Suspense remains right for code —
  a lazily loaded page is waiting for a module, not an answer, and takes nothing off the screen.

  Both documented patterns are RUN, in `test/ssr-seeding.test.tsx`, rather than asserted on a page:
  the seed shows until the read lands and is then replaced, and rendering the hook throws no promise.


## 0.5.0

### Minor Changes

- `useDemandResource` is reshaped to the contract that two dozen real screens proved out. **This
  changes its signature and its behaviour, and it is safe to do because it had no consumers** —
  exported since 0.3.0, used by nobody, while the app beside it ran a hand-rolled equivalent.

  **No initial value, and `data` is `T | null`.** It used to require one and return `T`, which reads
  harmlessly and is not: a screen renders a default before any answer exists, and a default cannot be
  told apart from an answer. A `0` meaning "we could not ask" looks exactly like a `0` meaning "none"
  — which reached a real shop as stock counts of zero, a customer list reading "no customers", and a
  till claiming something was counted when nothing had been asked.

  **An empty answer is an answer.** `keepPreviousData` used to drop an empty refetch result to
  protect the cache. But the thing it was protecting against is a read that FAILED, and a failed read
  throws — it never reaches the commit. All the guard could actually catch was a true answer that
  happens to be empty, and it threw it away: a customer pays off everything they owe, the screen
  re-reads, the answer is an empty history, and the old debts stay on screen. The option is gone and
  a resolved value is always committed.

  **`error` is a string you can show somebody**, with `cause` carrying the thrown thing for a caller
  that wants to decide rather than display. `fallbackMessage` covers a throw that says nothing
  useful.

  **`enabled: false` holds the read** — no id yet, no account chosen, nobody signed in — and
  `refetch()` clears the demanded flag before reading, so a "try again" button actually tries again
  rather than returning the served value.

  Kept from before: `AbortSignal` cancellation, one read at a time, and retry with a linearly growing
  delay.

  Not added: an explicit invalidation subscription. `useDemandState` already re-runs its loader when
  its scope is invalidated, and wiring `useInvalidation` in here changed nothing measurable — the
  test passed with the line deleted and one invalidation caused one read either way. Re-reading on
  invalidation is this hook's contract and is tested; it is simply not this hook's job to deliver it.


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
