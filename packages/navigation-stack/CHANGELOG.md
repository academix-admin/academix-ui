# @academix-admin/navigation-stack

## 0.10.0

### Minor Changes

- Navigation state is now carried per history entry, with the URL as a fallback.

  `?nav=` is a single mutable string that every stack **and** the group write to, so a write aimed at
  one of them can clobber another's slice. That is not a hypothetical: it is exactly how a popstate
  handler calling `restUrl()` blanked a neighbouring entry and made browser Forward restore the wrong
  page (fixed in 0.8.5 by removing that call — but the shared-URL design left the door open).

  Each entry now carries its own `{ navStack, group, axSerial }` in `history.state`, and popstate
  reads that first. A write aimed at a different entry cannot reach it, so an entry's record of what
  it was survives whatever else rewrites the URL. The URL stays authoritative for sharing and deep
  links, and remains the fallback for entries with no state (shared links, history written by an
  earlier version, or by another library).

  `axSerial` is a monotonic generation stamp, recorded for diagnosing the ordering that asynchronous
  `history.go(-n)` makes possible. It is deliberately **not** used to skip a rebuild: revisiting an
  entry is normal, so the same serial legitimately arrives when the stack does need rebuilding, and a
  redundant rebuild is already free via the existing isEqual guard.

  Foreign keys on `history.state` are preserved rather than overwritten, so this coexists with other
  libraries writing to the same object.

## 0.9.0

### Minor Changes

- Consistent history-entry state, and opt-in compile-time route-key safety.

  **`state.group` is no longer dropped on replace.** The replace path wrote `replaceState` twice —
  `{ group }` then `{ navStack }` — and the second call replaces state wholesale rather than merging,
  so `group` was silently lost. Pushed entries carried `{ navStack, group }` while replaced entries
  carried only `{ navStack }`, meaning the same logical position had two different state shapes
  depending on how it was reached, and anything branching on `event.state.group` during popstate
  behaved differently for the same page. Now a single write carries both.

  **`RouteKeys` + a generic `useNav`** make route names checkable:

  ```ts
  const routes = { home: Home, detail: Detail } satisfies NavigationMap;
  const nav = useNav<RouteKeys<typeof routes>>();
  nav.push("detial"); // Error: not assignable to 'home' | 'detail'
  ```

  `NavStackAPI<K extends string = string>` defaults to `string`, so this is entirely additive —
  existing consumers compile unchanged and adopt the safety when they choose to.

## 0.8.6

### Patch Changes

- History accounting now uses an entry ledger, closing two edge cases in the pop/push mapping.

  Direction comes from the action family; the count comes from a per-stack ledger recording the depth
  each owned entry was created at. Depth delta alone was wrong at both edges:

  - **A navigation that moves several levels at once** (deep link, `go`) creates ONE browser entry —
    one user action costs one Back press — but changed N levels. Consuming by delta asked for more
    entries than we own, drifting history out of sync with the stack. `popToRoot` after two pushes now
    gives back exactly two, not three.
  - **A net-shrinking forward navigation** — `pushAndPopUntil` that adds one page and pops three — has
    a POSITIVE delta, so a delta-only rule handed entries back even though the user moved forward, and
    Back then overshot. Forward navigations now always cost exactly one forward step.

  The invariant this establishes: one user action is always one Back press, however many stack levels
  it rearranged.

## 0.8.5

### Patch Changes

- Fix: browser Forward restored the wrong page because popstate blanked the entry it landed on.

  `GroupNavigationStack`'s popstate handler called `restUrl()`, which deletes `nav` and `group` from
  the **current** history entry — during popstate that is the entry the browser has just restored.
  The entry was left describing nothing, so navigating back onto it later found no state and fell
  back to the stack root.

  Captured on a three-deep walk (profile → redeem_codes → giveback_page):

  ```
  after push C   depth=3  nav=profile-stack:1.a1.c1.v1
  back -> B      depth=2  nav=null            <-- destroyed here
  back -> A      depth=1  nav=profile-stack:1.a1
  forward        depth=1  top=profile_page    <-- should have been B
  ```

  Hence the reported "Forward once stays on A, Forward twice jumps to C" — the middle entry was
  blanked while the deepest entry, never landed on, kept its state. It also explains the swipe
  variant: forward-swiping to C and then back skipped to A, because B's entry no longer described B.

  Clearing the URL is only meaningful when the app switches tabs itself. On popstate the browser has
  already restored the correct URL, so there is nothing to clean up.

  Found by an authenticated Playwright walk against the real app; the devtools trace showed
  `nav=null` appearing at the exact step.

## 0.8.4

### Patch Changes

- Fix two history-integrity bugs that made Back/Forward skip a page.

  **1. Entries are now decided by the stack's DEPTH DELTA, not the action's name.**

  The rule keyed off `action.type === 'push'`, which looked equivalent and was not: `pushAndPopUntil`,
  `pushAndReplace` and `go` can all GROW the stack, and were classified as "replace" — so they
  silently created no history entry. With `a → b → c` where b arrived via one of those, history held
  only `[a, c]`: one Back skipped straight to a, and Forward jumped straight to c, with b unreachable
  in both directions.

  Depth delta needs no per-action allow-list: grew → add one entry, shrank → hand back that many,
  unchanged → replace in place. One browser step per navigation regardless of how many stack levels
  were rearranged, so Back always means "undo that action".

  **2. Popping no longer corrupts the entry it is leaving.**

  `history.go(-n)` is asynchronous — it queues the move and returns. The `replaceState` that followed
  therefore landed on the entry being LEFT, overwriting that deeper entry's URL with the new shallower
  path before the browser had moved. Invisible going back, because the target entry is still correct,
  but it rewrites history _ahead_ of the cursor, so a later Forward restores the wrong state.

  Nothing needs writing after a consume: the browser restores the target entry's own URL when the
  move completes.

  Tests cover both directions of a three-deep walk (Back c→b→a and Forward a→b→c) standalone and
  inside a group, plus `pushAndPopUntil` creating an entry while `replace` does not.

## 0.8.3

### Patch Changes

- Fix: browser Back left the pushed page on top when returning to the first history entry.

  The popstate handler bailed out whenever the restored URL carried no `?nav=` state for the stack:

  ```js
  if (!navPathCombined) return;
  if (!ourPath) return;
  ```

  But the very first history entry has no `nav` param — it is only written once something has been
  pushed. So Back onto that entry hit the early return, and "no URL state" was treated as "leave the
  stack alone" rather than "this entry is the stack at its root". The URL went back while the stack
  did not, leaving the pushed page on top.

  Both cases now restore the stack to its root. Truncating to the existing first entry, rather than
  re-resolving the `entry` prop, preserves the root's uid and params so nothing needlessly remounts.

  Together with the `isActiveStack` fix in 0.8.2 this completes browser-Back support: 0.8.2 let the
  handler run at all, and this makes it do the right thing on the boundary entry. Verified against a
  real browser with Playwright — jsdom cannot produce a genuine popstate.

## 0.8.2

### Patch Changes

- Fix: browser Back did nothing for stacks configured with the `syncHistory` **prop**.

  `isActiveStack()` consulted only `regEntry.historySyncEnabled`, which is set exclusively by the
  imperative `syncWithBrowserHistory()` API — the `syncHistory` prop never touches it. The popstate
  handler opens with `if (!api.isActiveStack()) return`, so for prop-configured stacks (virtually
  all of them) every popstate was ignored: Back changed the URL while the stack stayed put, which
  presented as "Back does nothing, then leaves the site".

  `emit()` has always tested `syncHistory || regEntry.historySyncEnabled`; `isActiveStack()` tested
  half of it. Now consistent.

  Pre-existing, and independent of the 0.7.0 history work — pushing entries could not help while the
  handler that consumes them was disabled. Found by running the Playwright matrix against a real
  browser; jsdom unit tests never exercised a genuine popstate.

## 0.8.1

### Patch Changes

- Fix: the `EvaluablePage` structural type did not accept Playwright's real `Page`.

  `addInitScript` resolves to `Disposable` in Playwright, not `void`, and `evaluate` has far richer
  overloads than the single shape declared here — so `navStack(page, id)` failed to compile against
  the very library the helper exists for:

  ```
  Argument of type 'Page' is not assignable to parameter of type 'EvaluablePage'.
    Type 'Promise<Disposable>' is not assignable to type 'Promise<void>'.
  ```

  The structural contract is now just "has evaluate and addInitScript", with precise typing kept on
  the helper methods where it actually helps. Caught by wiring the helpers into a real Playwright
  suite rather than only testing them in isolation.

## 0.8.0

### Minor Changes

- Devtools: a visual panel, a console inspector, and first-class Playwright helpers.

  `§4` of the client-architecture plan asked for the equivalent of state-stack's
  `window.__STATE_STACK__`. This follows that pattern rather than inventing a second one, and adds
  the two surfaces that make it useful for building real apps.

  - **`<NavigationDevtools />`** — a floating panel (Alt+N) showing every live stack top-first, a
    colour-coded navigation timeline, history ownership, and overlay registrations, plus push / pop /
    popToRoot controls. Self-contained scoped styles, no dependencies, and no cross-package imports,
    so it cannot restyle or inherit from the app it is debugging. Returns `null` when disabled, so it
    is safe to leave mounted.

    It highlights two conditions that are otherwise invisible: a stack several pages deep that owns
    **zero** history entries (browser Back will leave the site), and a navigation whose depth did not
    change (a pop that did not pop).

  - **`window.__NAV_STACK__`** — `stacks()`, `snapshot()`, `history()`, `events()`, `debug()`, plus
    `push`/`pop`/`popToRoot` for reproducing a bug by hand. `pop()` returns `{ before, after, popped }`
    so a no-op pop is explicit rather than something you have to notice on screen.

  - **`@academix-admin/navigation-stack/playwright`** — `installNavDevtools(page)` and
    `navStack(page, id)` with `expectDepth`, `expectTop`, `expectPoppedCleanly`, `waitForDepth`,
    `ownedHistoryEntries`, `events()` and `debug()`. No Playwright dependency is added: the `Page`
    type is structural, so Puppeteer works too.

    This lets an E2E test assert on navigation state rather than the DOM, which matters because
    rendering and navigation fail independently — a pop can update the stack correctly and still
    leave the old page mounted, and a DOM-only assertion reports the wrong cause.

  Two details that would otherwise bite:

  - Every inspector payload is JSON-serializable, and params are sanitized to primitives. Returning
    a React element or function would throw "could not be cloned" inside `page.evaluate` — a failure
    that appears only under Playwright and never in the console. Covered by a `structuredClone` test.
  - Devtools are enabled outside production, but E2E normally runs against a **production** build, so
    they can be forced on with `window.__NAV_STACK_DEVTOOLS__ = true` (via `addInitScript`, which
    survives the reloads a deep-link test performs).

  See DEVTOOLS.md, which includes the full navigation test matrix as runnable Playwright tests.

## 0.7.0

### Minor Changes

- e3953a8: Real browser history, a group overlay layer, URL-addressable overlays, and native-gesture deference.

  **BEHAVIOUR CHANGE — read before upgrading.** In 0.x the minor slot is the breaking one, so this
  lands as 0.7.0. Any stack that sets `syncHistory` now creates real history entries, so the browser
  Back button (and the platform's back gesture) **pops a page instead of leaving the site**. That is
  the fix — previously the package wrote history with `replaceState` only, so five pages deep still
  left a single history entry — but it is a visible change in how Back behaves. Set
  `historyPush={false}` per stack to keep the old behaviour.

  - **`historyPush` prop (default `true`)** — `push` adds a history entry; `pop`/`popUntil`/
    `popToRoot` hand entries back; everything else still replaces. Only active when `syncHistory` is
    on. Consumes are clamped to entries this stack actually pushed, so a user who deep-linked into a
    nested page (one entry, not four) cannot be walked off the front of history and out of the app.

  - **Group overlay layer** — `getGroupOverlay(groupId)` with `insert`/`remove`/`clear`/`list`, hosted
    by `GroupNavigationStack` as a sibling of the per-tab containers. Because those containers are
    `display:none`'d on tab switch, an overlay hosted inside one would vanish or resurface in the
    wrong tab; this layer survives the switch. Dialogs stay stack-scoped via `nav.overlay`; sheets,
    selectors and pickers belong here.

  - **Overlay state in the URL fragment** — `readOverlayFragment`/`writeOverlayFragment` plus the pure
    `parseFragment`/`buildFragment`/`setInFragment`. The codec owns exactly one `&`-separated segment
    (`ax=…`) and passes every other segment through untouched, so ordinary `#section` anchors keep
    working. Fragment rather than query string: it never round-trips to the server, and each open
    becomes a real history entry — which is what lets the platform's own back gesture close an
    overlay.

  - **Named overlays** — `registerOverlayFactory(key, factory)` plus `serializeOverlays`/
    `parseOverlays`. `nav.overlay.insert` takes a closure and a random id, so an open overlay could
    never be expressed in a URL. A named overlay is addressed by a stable key the app registers up
    front (as it already does for routes), so a reload or deep link can reconstruct it. `parseOverlays`
    treats its input as hostile — it comes from the URL bar — and drops malformed entries and
    non-primitive params rather than throwing.

  - **`respectNativeGesture` swipe-back option (default `true`)** — stands down on iOS/Android, where
    the platform's own gesture occupies the same edge region and, on Android, cannot be
    `preventDefault`ed (running both meant a double pop). Stays enabled in installed/standalone PWAs
    and on desktop, where no native gesture exists. Detection is exported as `hasNativeBackGesture()`.

  The Library Charter is preserved throughout: this package still has no knowledge of any viewer
  component. Callers pass render functions and opaque factories; wiring a specific viewer to a scope
  remains the app's job.

  52 new tests (68 total, up from 16).
