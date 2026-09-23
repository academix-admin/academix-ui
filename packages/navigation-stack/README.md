# @academix-admin/navigation-stack

A powerful client-side navigation **stack** for React — the ergonomics of a
native mobile navigator, in the browser.

- 🧭 **Stack routing** — `push` / `pop` / `replace` / `popUntil` / `popToRoot`
- 🎞️ **Transitions** — built-in `fade` / `slide` / … or bring your own renderer
- 👆 **Swipe-back** — iOS-style edge-swipe gesture, fully configurable
- 📜 **Scroll restoration** — per-page scroll position preserved across navigation
- 💤 **Lazy pages** — code-split routes loaded on demand
- 🪆 **Nested & group navigation** — independent or coordinated child stacks
- 🧩 **Dependency injection** — `provideObject` / `useObject` across pages
- 📨 **Request/response bus** — ask a page for data and await the answer
- ♻️ **Lifecycle hooks** — `onEnter` / `onExit` / `onPause` / `onResume` / before+after push/pop/replace
- 🛡️ **SSR-safe** — guards for `window`, works with Next.js App Router (`'use client'`)

> Zero runtime dependencies beyond React. `react` / `react-dom` are peer deps.

> 📖 **[More real-world examples →](./EXAMPLES.md)** — lifecycle, DI, nested
> stacks, request/response and more, adapted from a production app.

> **Working on the library itself?** [EXTRACTION.md](https://github.com/academix-admin/academix-ui/blob/main/packages/navigation-stack/EXTRACTION.md) records the staged plan for
> separating the navigation MODEL from the browser plumbing — what is done, what is deliberately not
> started, and the one product decision that makes the rest worth doing.

## Install

```bash
npm install @academix-admin/navigation-stack
# peer deps (if not already present)
npm install react react-dom
```

## Quick start

A stack is defined by a **navLink map** (route key → component) and an **entry**
route. Each page receives navigation via the `useNav()` hook.

```tsx
'use client';

import NavigationStack, { useNav } from '@academix-admin/navigation-stack';

function HomePage() {
  const nav = useNav();
  return (
    <div>
      <h1>Home</h1>
      <button onClick={() => nav.push('details', { id: 42 })}>
        Open details
      </button>
    </div>
  );
}

function DetailsPage({ params }: { params?: { id: number } }) {
  const nav = useNav();
  return (
    <div>
      <h1>Details #{params?.id}</h1>
      <button onClick={() => nav.pop()}>Back</button>
    </div>
  );
}

const navLink = {
  home: HomePage,
  details: DetailsPage,
};

export default function App() {
  return (
    <NavigationStack
      id="app"
      navLink={navLink}
      entry="home"
      transition="slide"
      swipeBack
    />
  );
}
```

## `<NavigationStack />` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | **Required.** Unique id for this stack (used for nesting & scroll keys). |
| `navLink` | `Record<string, ComponentType>` | — | **Required.** Route key → page component. |
| `entry` | `string` | — | **Required.** Route key to render first. |
| `transition` | `"fade" \| "slide" \| …` | `"fade"` | Built-in transition. |
| `transitionDuration` | `number` | `300` | Transition duration (ms). |
| `renderTransition` | `TransitionRenderer` | — | Custom transition renderer. |
| `swipeBack` | `boolean \| SwipeBackOptions` | `true` | Edge-swipe-to-go-back. |
| `persist` | `boolean` | `false` | Persist the stack across reloads. |
| `syncHistory` | `boolean` | `false` | Reflect navigation in browser history. |
| `enableScrollRestoration` | `boolean` | `true` | Restore scroll per page. |
| `lazyComponents` | `Record<string, () => Promise<{ default }>>` | — | Code-split route loaders. |
| `maxStackSize` | `number` | — | Cap the stack depth. |
| `autoDispose` | `boolean` | `true` | Dispose pages on pop. |
| `missingRouteConfig` | `MissingRouteConfig` | — | UI/labels for unknown routes. |
| `additionalNavLinks` | `NavigationMap[]` | `[]` | Merge extra route maps (lower priority). |
| `componentTags` | `Record<string, NavigationMap>` | `{}` | Tag-organized component registries. |
| `className` / `style` | — | — | Applied to the stack container. |
| `onExitStack` | `() => void` | — | Called when the root is popped. |
| `historyPush` | `boolean` | `true` | Whether a push writes a real browser history entry, so the platform's Back and the edge-swipe step through the stack. `false` overwrites the current entry instead. Only meaningful with `syncHistory`. |
| `redirect` | `RedirectFn` | — | Runs BEFORE guards on every `push` / `replace` / `go` and on deep links. Return a target to send the navigation elsewhere, or `null` to let it through. See below. |
| `routeOptions` | `Record<string, { redirect?: RedirectFn }>` | — | The same thing per route, for when only one page needs it. |

## Navigation API (`useNav()`)

```ts
const nav = useNav();

await nav.push('route', params?, metadata?);
await nav.replace('route', params?);
await nav.pop();
await nav.popUntil((entry, i, stack) => entry.key === 'home');
await nav.popToRoot();
await nav.pushAndReplace('route', params?);
await nav.pushAndPopUntil('route', predicate, params?);
nav.peek();               // current entry
await nav.replaceParam({ tab: 'settings' }, /* merge */ true);
```

Every mutating call returns `boolean | NavActionResult`, where a failure is
`{ ok: false, reason: 'guard' | 'lock' | 'empty-stack' | 'parent-only' }`.

### Cross-page objects (dependency injection)

Provide a value (or a function) from one page and consume it in another —
scoped, and optionally `global` across nested stacks.

```tsx
// Provider page
useProvideObject<Cart>('cart', () => cart, {
  scope: 'checkout',
  dependencies: [cart],
});

// Consumer page — useObject returns a discriminated result
const result = useObject<Cart>('cart', { scope: 'checkout' });
if (result.isProvided) {
  const cart = result.getter();
}

// Or provide imperatively via the nav API:
nav.provideObject('getById', () => (id: string) => items.find((i) => i.id === id), {
  global: true,
  scope: 'items',
});
```

### Request/response between pages

```ts
// Handler page
useProvideRequestHandler('confirm', async (msg: string) => window.confirm(msg));

// Caller page
const ok = await nav.sendRequest<string, boolean>('confirm', 'Delete item?');
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useNav()` | Access the current stack's navigation API. |
| `useIsTop()` | Whether the calling page is the top of its stack. |
| `usePageLifecycle(nav, callbacks, deps?)` | `onEnter` / `onExit` / `onPause` / `onResume` / `onBefore*` / `onAfter*` per page. |
| `usePageState(nav, key?)` | Read/observe page-scoped state. |
| `useObject<T>(key, opts?)` / `useProvideObject<T>(key, getter, opts?)` | Cross-page DI. |
| `useObjectWithFallback` / `useObjectExists` / `useObjectSync` | DI variants. |
| `useProvideRequestHandler` / `useSendRequest` | Request/response bus. |
| `useSwipeBack(...)` | Low-level swipe-back binding. |
| `useUnifiedScrollRestoration(...)` | Low-level scroll restoration control. |
| `useComponentsByTag(tag)` | Retrieve components registered under a tag. |
| `useIsActiveStack()` | Whether THIS stack is the one on screen. In a group, only one tab is — so a screen that pushes on its own (an alert, a gate) asks this first, or it pushes onto whichever tab the person is actually looking at. |
| `useOverlayRoute(...)` | Give a sheet or dialog its own history entry, so the platform's Back closes the SHEET rather than the page under it. |
| `useViewportInsets()` / `useResizeToAvoidKeyboard()` | Keyboard and safe-area insets. |
| `popStackToRoot(id)` | Pop a stack to its root from OUTSIDE React — what a tab bar calls when the active tab is tapped again. |

### Lists that page, and pull-to-refresh

```tsx
useInfiniteScroll({ onLoadMore, hasMore, loading });   // scroll position
useInfiniteScrollObserver({ onLoadMore, hasMore });    // IntersectionObserver
usePullToRefresh({ onRefresh });                       // returns { pulling, distance, refreshing }
useScrollEvents({ onScroll, onReachEnd, onReachTop });
scrollIntoViewBelow(el, opts) / useScrollIntoViewBelow()  // scroll something clear of a pinned bar
```

These live here rather than in a list library because they need the stack: a page that is not on top
must not react to a scroll it cannot see, and a restored page must not fire "reached the end" while
it is being put back where it was.

## Redirects — deciding before the page exists

```tsx
<NavigationStack
  id="main"
  navLink={routes}
  entry="home"
  redirect={({ to, action, stackSnapshot, location }) => {
    if (to.key === 'account' && !session) return 'login';
    if (to.key === 'checkout' && cart.isEmpty) return { key: 'cart', params: { why: 'empty' } };
    return null;                       // let it through
  }}
/>
```

Runs before guards, on `push`, `replace`, `go` and on a deep link arriving through the URL. Returning
a target redirects; returning `null` or `undefined` allows the navigation as it stands. Chains are
resolved with a hop limit of five, and exceeding it fails the navigation with
`{ ok: false, reason: 'redirect-loop' }` rather than looping.

Use `routeOptions` when one route needs it rather than the whole stack:

```tsx
routeOptions={{ account: { redirect: () => (session ? null : 'login') } }}
```

## A keyboard-safe page — `Scaffold`

A page is a column: a bar that stays, a body that scrolls, and a bar at the bottom that rides above
the keyboard instead of being buried by it.

```tsx
import { Scaffold, ColumnBody, RowBody } from '@academix-admin/navigation-stack';

<Scaffold
  appBar={<Header position="static" title="Stock" />}
  bottomBar={<PayButton />}
>
  {rows.map((r) => <Row key={r.id} {...r} />)}
</Scaffold>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appBar` | `ReactNode` | — | Top bar. |
| `appBarBehavior` | `'pinned' \| 'scroll'` | `'pinned'` | `'pinned'` stays put — right for a screen you read. `'scroll'` travels with the content and returns as you scroll up — right for a screen with its own sticky toolbar beneath, which cannot share the top with a pinned bar. The bar is laid OVER the body and the body padded by its height, so nothing jumps. |
| `bottomBar` | `ReactNode` | — | Pinned bottom bar. Rides above the keyboard, never scrolls. |
| `scroll` | `boolean` | `true` | Wrap `children` in a `ColumnBody`. Set `false` to supply your own body — a `RowBody`, for instance. |
| `bodyClassName` / `bodyStyle` | — | — | On the scroll body. Put the page's theme-variant class here so its CSS custom properties are in scope for the content. |

`ColumnBody` and `RowBody` are the scroll regions themselves, for pages that lay themselves out.

### Keyboard and viewport insets

```tsx
useViewportInsets();                    // publish the keyboard/safe-area insets as CSS variables
<ViewportInsetsProvider>…</ViewportInsetsProvider>
useResizeToAvoidKeyboard({ enabled });  // shrink the page instead of letting the keyboard cover it
```

## Nested & group stacks

Render a `<NavigationStack />` inside a page of another stack — the child
auto-detects its parent. For coordinated siblings (e.g. a tab bar), wrap them in
`<GroupNavigationStack>`.

## Scroll restoration

Each page's scroll position is captured as you scroll and restored when you return to it.

Positions are stored with the container **width** and max scroll at capture time, because a pixel
offset only means something at the width it was measured at:

| On return | Restored to |
|---|---|
| Same width | The exact offset — what the user actually saw |
| Different width | The same **proportion** of the document, clamped to its current height |

Without this, an offset captured at 1200px and replayed at 430px lands somewhere the user was never
at: narrower columns make content taller, so the same number is much earlier in the document. And if
it exceeds the new height the browser silently clamps it, so reading the value back cannot tell you
it was wrong.

**Limitation:** proportional position is not *semantic* position. If content reflows unevenly, 10%
down at 1200px is not the same paragraph as 10% down at 430px. Exactness there needs a content
anchor — remembering which element was at the top — which this does not do.

## Devtools

In any non-production build, the library installs `window.__NAV_STACK__` — a JSON-safe inspector
you can use from the browser console.

```js
__NAV_STACK__.stacks()              // ['home-stack', 'profile-stack', ...]
__NAV_STACK__.snapshot('signup')    // depth, entries, top, pushDepth, historySync…
__NAV_STACK__.history()             // browser history vs. entries this library owns
__NAV_STACK__.events()              // recent navigations (ring buffer, oldest first)
__NAV_STACK__.debug()               // one pasteable blob for a bug report
```

**Watching navigation as it happens** — the answer to "I'm about to press Back, what fires?":

```js
__NAV_STACK__.trace()        // start streaming to the console
__NAV_STACK__.trace(false)   // stop
```

```
nav signup push        1->2 top=step2       pushDepth=1
nav signup lifecycle:onExit  2  top=step2   pushDepth=1
nav signup popstate    2->1 top=step1       pushDepth=0
```

Lifecycle triggers are recorded *before* the has-handlers check, so a hook that fires with nothing
attached looks different from one that never fires at all — which is the actual question when you
are auditing whether some exit path reaches your cleanup.

Two fields answer most "Back is behaving strangely" reports:

- **`pushDepth` is 0 while pages are stacked** → nothing was pushed to history, so Back will leave
  the site rather than pop a page. Different bug from Back popping twice.
- **`history().historyLength` vs `ownedEntries`** → how much of the browser's history this library
  believes it owns.

`setHistorySync(stackId, bool)` flips history behaviour at runtime with no rebuild, so you can A/B a
suspected regression on a live page: toggle, repeat the gesture, compare.

In a production build the inspector is absent by default. Set `window.__NAV_STACK_DEVTOOLS__ = true`
before the app boots to force it on — which is how the Playwright helpers (`./playwright`) drive it
against a real production bundle.

## SSR / Next.js

Both the component and its hooks are client-only; the module carries the
`'use client'` directive, so import it from client components. `isBrowser()` and
`safeWindow()` are exported for guarding your own code.

## License

MIT © Academix
