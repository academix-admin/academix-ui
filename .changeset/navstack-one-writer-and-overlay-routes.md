---
'@academix-admin/navigation-stack': minor
---

Make the entry log's invariant structural, and turn overlay routing into a capability.

**One history writer, enforced.** Every pop asks the entry log which entry it wants, because
`history.go(-n)` counts positions in the browser's single global list and stacks interleave. The
log can only answer if it knows about every entry — an invariant that had nothing enforcing it, and
two of three writers did not honour it. The failure is silent, delayed and self-erasing: an
undeclared write does not break its own navigation, it renames the entry the log believed it was
standing on, so every LATER pop drops to counting, and the next write then discards the log and the
evidence with it.

`pushState` and `replaceState` now appear in `core/history-writer.ts` and nowhere else, and
`test/one-writer.test.ts` fails the build if that stops being true. The writer also owns
`navStack`, so an entry can no longer disagree with what it was logged as standing on — the first
version of the funnel let callers pass it, and the overlay writer, which changes no stack, simply
did not, making its entries unreadable.

**The fallback is no longer silent.** `navDevtools.debug().history.pops` reports how many pops the
log justified, how many fell back to counting, whether the log can currently see where it is
standing, and why the last fallback happened. Falling back is correct behaviour; doing it without a
word is how an app runs for weeks with this mechanism disabled and nothing looking wrong.

**`useOverlayRoute(name, open, onClose, { onRestore })`** — new, and the reason this matters beyond
this package: any overlay, drawn by anything, gets a real history entry so the platform's own Back
closes the SHEET rather than the page under it. Without one, Back with a picker open closes the
picker and the page behind it too. It began as seventy lines inside one app carrying three fixes
that each cost a production bug; every app that draws a sheet needs the same seventy lines.

**Reloading with a sheet open now settles itself.** A fragment survives a reload, so an app comes
back with `#ax=…` naming a sheet nothing has drawn. Pass `onRestore` and the sheet comes back
exactly where it was (with a name stable across loads). Pass nothing and it is closed for you —
because a URL naming a sheet nobody is showing costs a whole Back press, the shop pressing it twice
to leave one page. Overlays on screen claim their name, so the settle never takes one away.

Also: `resetNavigationLedgers()` clears the log, the push counts and the pop health together —
resetting some of them is how a test passed against a library that still had the bug in it.
