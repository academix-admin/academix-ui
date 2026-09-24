# @academix-admin/state-stack

## 0.6.2

### Patch Changes

- The route-scope warning no longer fires at callers that named a scope

  `useDemandState` warned "resolved pathname is null … risking key collisions" whenever the pathname
  was unknown — including for every caller that had passed an explicit `scope`, for whom the pathname
  is not used for anything and the claim is false. An app that scopes all of its state properly, which
  is exactly what the warning exists to encourage, saw the most of it: four copies on every page.

  It now fires only when there is no `scope` and the pathname really is what the state would be scoped
  by. The message says so.

## 0.6.1

### Patch Changes

- A read interrupted by an unmount no longer leaves the screen on a spinner for ever

  `useDemandResource` aborted its read when the component unmounted. Because `demand()` is shared by
  key, a second mount asking the same question was handed the FIRST mount's still-pending operation
  rather than starting its own — and that one then resolved into nothing, because it had been aborted.
  The screen was left on:

      { loaded: false, loading: true, error: null, data: null }

  for ever. No error, because nothing failed. React's Strict Mode performs exactly that sequence —
  mount, unmount, mount — on every component, so in development every screen built on this hook could
  hang; in production it hung for anyone who left a screen and came straight back. Found on a page
  stuck on "Loading orders" whose RPC had plainly answered `200 []`.

  A read belongs to the KEY, not to whichever component happened to ask first. Unmounting no longer
  cancels it: the answer lands in the store, where the next mount finds it. Only a read SUPERSEDED by
  a newer read of the same key is abandoned. The on-screen flags are still only set on a living
  component.

## 0.6.0

### Minor Changes

- The same page renders on a server, with its data in it.

  ```
  renderToPipeableStream(<ProductPage />)

    before   <h1>Loading</h1><p>₦</p>
    after    <h1>Gulder 60cl</h1><p>₦12500</p>
  ```

  The page is unchanged. It calls `useDemandResource` exactly as it does in a browser — no `seed`, no
  `typeof window`, no server-only copy.

  **A store per request.** `StateStackProvider` + `createRequestStore()`, because the core is a
  module-level singleton and on a server a module is shared by every request the process handles. A
  store written while rendering one shopper's page would be readable while rendering the next
  shopper's, and what leaks is their cart and their prices. This has been harmless only because
  nothing WROTE during a server render; server rendering with data ends that, so the isolation goes
  in first and is tested first. An app that provides nothing behaves exactly as before.

  **`dehydrate()` / `hydrate()`** — what the server fetched, carried in the page, so the browser
  starts with the answers rather than reading them again and flashing empty between. A hydrated key
  is treated as already fresh for its first mount, or `revalidateOnMount` would immediately undo the
  point.

  **Suspend on a server, never on a client.** 0.5.1 said these hooks never suspend, because
  suspending blanks a screen that already has an answer. That reason does not exist on a server:
  there is no screen, nothing to blank and nobody watching, so waiting for the answer is the honest
  thing. The rule is now stated precisely rather than absolutely.

  Three things the tests found, each a real defect:

  - `useSyncExternalStore`'s SERVER snapshot returned the initial value and ignored the store, so a
    page rendered on a server showed its empty state however much the store knew.
  - A resource's `null` — "nothing read yet" — was being taken for an answer, so the server decided
    it already knew and rendered the empty state it was trying to avoid.
  - A failed read suspended for ever: React retries a suspended tree when its promise settles, so a
    read that throws starts again, and the page never renders at all. One attempt per key per
    request; after that the page renders without it, exactly as a browser would.

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
