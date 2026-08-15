# @academix-admin/navigation-stack

## 0.12.3

### Patch Changes

- Fix: the devtools panel covered the app's bottom navigation bar.

  Default anchor moved from `bottom-right` to `top-right`, and the panel is now capped to the
  viewport (`calc(100vw - 32px)` / `calc(100vh - 32px)`) so it cannot run off the edge of a
  phone-sized window — the part that runs off is the part you cannot scroll to.

  Bottom corners are where app UI actually lives. A mobile-style bottom nav bar sits exactly under a
  bottom-anchored panel, and the panel's high z-index means it _swallows_ those taps rather than
  merely overlapping them. Found when it blocked tab clicks in an E2E probe. A debugging tool that
  breaks the app it is meant to observe is the one failure mode it cannot have.

  New `offset` prop (default 16) for the distance from the anchored corner. `position` still accepts
  all four corners, so the old placement is one prop away.

## 0.12.2

### Patch Changes

- Fix: browser Back left the history ledger over-counting, so a later pop jumped several entries.

  `_pushDepth`/`_entryDepths` track "entries this stack pushed that sit behind us", and every
  programmatic pop hands them back with `history.go(-n)`. Only `consumeHistoryEntries()` decremented
  them — the programmatic path. A browser Back also crosses an owned entry (that entry is now _ahead_
  of us) but left the ledger untouched.

  The error is silent until the next programmatic pop multiplies it: that pop calls `history.go(-n)`
  with an `n` larger than what is actually behind us and travels several entries at once, landing on
  an old URL. In a tab-group app that old URL carries a different `group=`, so the whole app
  re-derives to a different tab — **pressing Back on one tab lands you on another**, which is what
  this looked like from the outside and nothing like a counter being wrong.

  Reconciliation is symmetric: Forward puts those entries back behind us, so they are re-recorded.
  Handling only Back would trade an over-count for an under-count, and an under-count is worse — a pop
  that gives back too few entries leaves the URL describing a page the user already left.

## 0.12.1

### Patch Changes

- Fix: devtools reported `historySyncEnabled: false` for stacks that were syncing.

  `historySyncEnabled` on the registry is only the _imperative_ override set by
  `syncWithBrowserHistory()`. Effective sync is `syncHistory prop || override` — every internal call
  site already tests that OR, but the devtools snapshot reported just the override. So a stack mounted
  with `syncHistory` read as `historySyncEnabled: false`.

  That is the first field anyone checks when Back misbehaves, and it pointed at the wrong conclusion:
  "history sync is off, that's why Back leaves the site" — when sync was on and the cause was
  elsewhere. Found while reading a real timeline for the signup stack, which showed
  `historySyncEnabled: false` next to a URL the same stack had just written.

  The snapshot now reports the effective value, plus `historySyncSource` (`prop` | `runtime` |
  `prop+runtime` | `off`) so the override is still distinguishable from the prop.

## 0.12.0

### Minor Changes

- Add `__NAV_STACK__.trace()` — a live console stream of every navigation.

  `events()` is a ring buffer you read _after_ the fact, which is the wrong shape for the question a
  developer has at the console: "I am about to press Back — show me what fires." Reading a buffer
  afterwards cannot distinguish "no event fired" from "an event fired and I'm looking at the wrong
  entry"; a line appearing the instant you press Back can.

  ```js
  __NAV_STACK__.trace(); // start
  __NAV_STACK__.trace(false); // stop
  ```

  Prints `nav profile-stack popstate 2->1 top=profile_page pushDepth=1`. Lifecycle hooks stream as
  their own `lifecycle:onExit` lines, recorded _before_ the has-handlers check — so a path that fires
  with nothing attached reads differently from one that never fires at all.

  Also: `debug()` reported a hardcoded `version: '0.7.0'` that had drifted several releases behind.
  In a bug report that is worse than no version — it points the reader at the wrong source. It is now
  injected at build time from package.json.

## 0.11.4

### Patch Changes

- Fix: `api.subscribe()` listeners were not notified for browser-driven navigation.

  Same root cause as the lifecycle fix in 0.11.3 — the popstate path bypasses `emit()`, which is
  where both lifecycle triggers AND subscriber notification live. 0.11.3 fixed lifecycle; subscribers
  had the identical blind spot.

  This one has a concrete consequence: `onExitStack` is implemented as a subscriber watching for the
  stack reaching length 0. So a stack could be left via browser Back or the edge-swipe without its
  owner ever being told — which is precisely the "abandon the signup flow with Back" case that
  `onExitStack` exists to catch.

  Browser-driven changes are also recorded in the devtools timeline as `popstate` events, so a
  timeline no longer shows an unexplained gap where the user pressed Back.

  New test asserts a subscriber observes a browser-driven pop.

## 0.11.3

### Patch Changes

- Fix: `onExit`/`onEnter` never fired for browser-driven navigation.

  The popstate handler re-derives the stack and assigns it directly, bypassing `emit()` — which is
  where lifecycle triggers live. So browser Back/Forward, the iOS edge-swipe and the Android back
  gesture changed the stack **without** firing lifecycle hooks, while `pop()`, `popToRoot()` and
  `replace()` all did.

  Anything bound to `onExit` therefore silently skipped the most common ways a user leaves a page.
  Consumers clearing flow-scoped state there (see the ACADEMIX_PLAN §3b pattern) leaked it on every
  gesture and browser exit — stale data surviving into the next visit.

  Lifecycle now fires on the popstate path too, deliberately without any history or URL writes, since
  the browser already owns both by then.

  Also: lifecycle triggers are recorded in the devtools timeline as `lifecycle:onExit` etc., and
  recorded BEFORE the has-handlers check — so an exit path that fires with nothing attached is
  distinguishable from one that never fires at all, which is exactly the question when auditing
  coverage.

  New test asserts `onExit` for pop, popToRoot, replace and browser Back. Browser Back was failing
  before this fix.

## 0.11.2

### Patch Changes

- Fix: browser-driven navigations were animated twice.

  Going back and then forward again showed the destination page and _then_ slid it in — "I have
  already seen the page, then the slide applies very fast".

  The cause is not a paint flash (the previous release's diagnosis). It is that **the platform has
  already animated the navigation**: iOS Safari's edge-swipe, Android's back gesture, and the
  back/forward buttons all animate before `popstate` fires. Our reconciler then saw the page's uid
  reappear in the stack, classified it as newly `added`, and replayed its own enter transition over
  the top of the animation the browser had just finished.

  Arrivals that came from `popstate` now mount at rest instead of animating. Programmatic
  navigation is unaffected and still animates.

  Diagnosed from a screen recording: frame-stepping an iOS Safari capture showed the native
  edge-swipe drag (the outgoing page tracking right across frames 42–47) followed by a separate,
  clean 330ms slide of our own — two animations for one navigation.

## 0.11.1

### Patch Changes

- Fix: a re-entered page flashed at its final position before animating.

  Walking a → b → c, going back to b, then forward to c again showed c already in place and only
  _then_ ran the slide — "I have already seen the page, then the slide applies very fast".

  `useState`'s initial value only applies on a fresh MOUNT, and forward does not remount the page:
  `memoryManager` caches it by uid and the render record is reused, so only `state` flips to `"enter"`
  while `stage` is still `"done"` — the final position. A passive `useEffect` then reset it _after_
  paint, producing: paint at rest (page visibly there) → `init` (snapped off-screen) → `active`
  (slides in).

  Both transitions now set their entering stage in a layout effect, so the off-screen class lands in
  the same frame the page becomes visible. Only affects re-entered pages; a first-time push already
  mounted fresh with the correct initial stage, which is why this never showed on the way forward
  through new pages.

## 0.11.0

### Minor Changes

- The active tab is now recorded in the URL instead of being erased.

  A tab switch called `restUrl()`, which DELETED both `group` and `nav`. That lost on every axis: the
  tab was not shareable, not restorable from the URL, not carried into a new window (sessionStorage is
  per-tab) — and Back did not undo the switch either, so it did not even buy the trade-off. Reading
  already preferred `?group=`; nothing ever wrote it back.

  Switching now writes `?group=<tab>` and **preserves `nav`**, so every tab keeps its depth in the URL.
  Previously one tab's change discarded all of them.

  It **replaces** rather than pushes, deliberately. Switching tabs is lateral navigation while Back is
  a depth operation, and mixing them makes Back ambiguous — "previous page" or "previous tab"?
  Pushing also floods history (toggling two tabs ten times would cost ten Backs to leave) and spends
  history writes against the rate limits browsers enforce (Safari most aggressively), which a drummed
  bottom-nav can realistically hit; once throttled, navigation state silently stops updating.

  For the Android "back from a secondary tab returns home" convention, express it as an explicit app
  policy — when Back fires and the active stack is at its root, switch to the home tab — rather than
  as a side effect of pushed entries. That keeps it inspectable and out of the history stack.

  `history.state` is spread rather than replaced on a tab change, so the entry keeps its own record of
  every stack (and any foreign keys) — a tab change is not a navigation and must not blank it.

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
