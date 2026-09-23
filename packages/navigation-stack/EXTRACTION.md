# Extracting the model from the browser

**Status: stages 0 and 1 done, 2 and 3 deliberately not started.** Nothing here is urgent. This file
exists so that picking it up cold costs an afternoon of reading rather than a week of re-deriving,
and so nobody starts stage 2 without knowing what stage 3 is for.

## What this is trying to achieve

Two kinds of code live in the same files today:

- **The model** — what a navigation stack IS. "An entry is named by its group, its stack, which page
  it is, and its position." That sentence is true in Flutter, in Dart, on a server. It is a few
  hundred lines.
- **The web plumbing** — `history.pushState`, an entry ledger, `axPushed`, adoptable-entry counting,
  `sessionStorage`. None of it is about what a stack is. It exists because the browser gives you
  `pushState` and then lies to you about `history.state`.

Sorting them means the model becomes plain TypeScript that can be ported, and the browser code
becomes one swappable piece plugged into it. **Nothing about how the library is used changes.**

### The evidence that the model is the small part

Seven releases went out in one session (0.18.1 → 0.19.1). Only two touched the model — uid identity.
The other five were fights with the History API and Next's router. That ratio *is* the argument: the
model is small and portable, the plumbing is a tax the web charges.

## Done

| Stage | What | Commit |
|---|---|---|
| 0 | `test/public-api.test.ts` pins 78 runtime exports and 33 types. `tsconfig.test.json` and `npm run typecheck:test` — tests were never type-checked before, so `route-keys.test.ts`'s `@ts-expect-error` assertions were decoration. | `e177f48` |
| 1 | `generateCompositeUid` / `ensureCompositeUid` take a `GroupRef` value instead of the live `GroupNavigationContextType`. `toGroupRef()` converts at the call site. No files moved, no existing test changed. Payoff: `test/uid-rule.test.ts` — the rule as inputs-in, string-out, no DOM, no React. | `6870a60` |

Stage 0 paid for itself within the hour: when the unused `stackId` parameter was removed,
`typecheck:test` caught all ten call sites immediately.

## Stage 2 — move the pure functions (not started)

Move them to `src/model/`, **leaving a re-export shim at every old path**:

```ts
// src/core/persistence.ts — after the move
export { generateCompositeUid, ensureCompositeUid } from '../model/uid';
```

### Why the shims are not optional

The test suite does not only use the public API:

```
21  from '../src/index'              <- public API
20  from '../src/core/registry'      <- internals
11  from '../src/core/persistence'   <- internals
```

Half the suite reaches into internals. Without shims the move edits the tests, and a refactor that
edits its own safety net can no longer say "the tests did not change and still pass." With shims,
zero tests change and the suite is a true control.

### What moves

Pure, and ready to move:

- `generateCompositeUid`, `ensureCompositeUid`, `generateStableUid` (`core/persistence.ts`)
- `parseRawKey`, `storageKeyFor` (`core/persistence.ts`)
- the pop arithmetic in `core/api.ts` — "which entry puts this stack at the target depth"
- the decision half of `scroll/index.ts` — same width means the exact offset, a different width
  means the same proportion. NOT the DOM half.

### What does NOT move

`core/history-writer.ts`. Its own comment calls it "the only place this library touches
`window.history`", and that is exactly right. It is the part a Flutter port **throws away**, so it
does not need to move for the model to be portable. It is also where the subtlest bugs lived —
`axPushed`, adoption counting, the entry ledger — found by a person using the app on a phone, not by
a test. Leave it alone until there is a reason.

## Stage 3 — ports and adapters (not started, and should stay that way for now)

```ts
// src/model/ports.ts
export interface HistoryPort {
  currentUrl(): string;
  push(url: string, state: unknown): void;
  replace(url: string, state: unknown): void;
  go(delta: number): void;
}
export interface StoragePort { read(key: string): string | null; write(key: string, value: string): void; }
export interface ScrollPort  { positionOf(uid: string): number | null; restore(uid: string, top: number): void; }
```

Today's browser code becomes the implementation. It is not rewritten, it is labelled:

```ts
// src/web/history-adapter.ts
export const webHistory: HistoryPort = {
  currentUrl: () => window.location.href,
  push: (url, state) => window.history.pushState(state, '', url),
  replace: (url, state) => window.history.replaceState(state, '', url),
  go: (delta) => window.history.go(delta),
};
```

The package wires the web adapter in by default. `index.ts` exports the same names,
`<NavigationStack>` and `nav.push` are identical, store-manager changes nothing, and it ships as a
minor release because it is purely additive.

**Stage 3 only pays when a second renderer exists.** Do not start it before that.

## The decision gate

**None of this is worth doing until `academix-app` is actually going to adopt the model.**

As of 2026-09-23 it does not: `academix-app/lib/local_navigation_controller.dart` is 53 lines of its
own, and nothing in that repo references composite uids, per-entry scroll restoration or any shared
contract.

Store Manager is a different product and stays on the web — **the Flutter ladder is not how Store
Manager gets native capabilities.** If the goal is an iPhone printing receipts over Bluetooth, that
is Capacitor, and it needs none of this.

So the question that unlocks the ladder is one product decision:

> Is academix-app going to navigate by the same contract as academix-web?

- **No** — stages 2 and 3 are overhead. Stop here. Stages 0 and 1 were worth doing on their own
  merits and are already in.
- **Yes** — do stage 2, then stage 3, then the Dart port, in that order.

## If the answer is yes: what the port actually is

1. **`src/model/`** — port directly. Same uid formula, same pop arithmetic. A few hundred lines.
2. **`src/web/`** — throw away. Flutter's Navigator already does what the web adapter fakes, so a
   `FlutterHistoryPort` is small.
3. **academix-app adopting it** — the real work, and unbounded from here: every screen it already has
   moves onto the new stack. This is a product decision, not a refactor.

The prize for 1 and 2 is that both apps produce **the same uid for the same stack** — one model, two
renderers, rather than two implementations that behave similarly and drift.

## Traps found the hard way

- **`null` and `{ id: null }` are different, and both happen.** No group at all is `root:root`; a
  group that has not named itself yet is not. `GroupRef` is an object-or-null rather than
  `string | null` for exactly this reason. Collapsing them renames every entry in a group the moment
  it is named — which is every scrolled page reopening at the top, a regression reported from a shop
  once already.
- **A uid names a PLACE, not a moment.** 0.18.5 made it unique per push and broke scroll
  restoration; 0.19.1 made it position again. A counter here is always wrong: a tab switch unmounts
  the stack and rebuilds it from the URL, where no uid is carried.
- **A uid carries no stack id and does not need one** — it only has to be unique within its stack.
  The parameter threaded through eleven call sites was never read. Checked before removing, not
  after.
- **`history-state.test.tsx` "marks a popstate rebuild as browser-driven" is order-dependent.** It
  passed in a full run and failed when its file ran alone, on that commit and on its parent. Chasing
  it found a real bug — a page the app pushed itself mounting with no animation, fixed in 0.19.2 —
  and the test now asserts what a shop would see rather than a private flag. If it flakes again,
  that is history, not you.
- **A test that cannot fail is worth nothing.** Every guard added in stages 0 and 1 was checked by
  making it fail first. One ordering test passed with the implementation inverted and had to be
  rewritten to observe the flag from inside the listener. Do the same for anything added here.
