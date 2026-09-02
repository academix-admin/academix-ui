---
'@academix-admin/navigation-stack': patch
---

Fix: a pop after switching tabs could land in a different tab.

Switching between stacks in a `GroupNavigationStack` restamps the current history entry with a
fresh serial, but never told the entry log. The log is keyed by serial, so from that moment it
could no longer find where it was standing: `findBackDeltaForDepth` returned null and every pop
fell back to counting the stack's own entries — the approximation the log exists to replace. The
next write could not find its predecessor either, and reset the log to a single record.

With two tabs one page deep each, popping (or reselecting the active tab) travelled one entry
back, which was the OTHER tab's entry: "I pressed Back on this tab and it took me to that one."

The tab switch now records itself in the log, the same way every other history write does. Same
entry, new name — the nav paths it already held are untouched. Behaviour is unchanged wherever
the log was already intact.

Fix: a pop could also come up one entry short after an overlay had been opened.

An overlay (a sheet, a picker) pushes a real history entry so the platform's back gesture closes
it, and that push was never recorded in the entry log either. The log's answer to "how far back"
is a distance in log positions, which equals the browser's only when the log knows every entry in
between — so one picker opened anywhere in a journey left every later pop short by one. The
overlay entry now records itself, carrying the nav param of the entry it opened over: it is not a
target for a depth lookup, but it is counted in the distance.

Hardening on the same mechanism, so that a wrong answer is not reachable by another route:

- **Serials are scoped to the document that issued them.** The counter restarts at 0 on every page
  load while history entries keep the serials they were given, so after a reload the same number
  meant two different entries and the log could match the wrong one — confidently. Entries now
  carry an `axEpoch`, and `currentSerial()` returns null for an entry from another load, which
  puts the caller back on the count-based fallback. `readAxState` still reads a foreign entry's
  `navStack`, because that is how Back after a refresh restores the page.
- **A programmatic pop lands with no overlay named in the URL.** A push already cleared the
  fragment; a pop could not, because it does not write the URL — the browser restores the target
  entry's, and that entry may have been written while a sheet was open over it. The pop now clears
  our fragment segment on arrival, and records that write like any other. A BROWSER Back onto such
  an entry is untouched: restoring where you were, sheet included, is what the platform gesture
  means.

The pure fragment codec moved to `overlay/fragment-codec.ts` so `core/persistence` can use it
without a cycle; `overlay/hash` re-exports it, so every existing import still resolves.
