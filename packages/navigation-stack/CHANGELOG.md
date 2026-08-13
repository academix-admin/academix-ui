# @academix-admin/navigation-stack

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
