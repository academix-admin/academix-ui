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

## Nested & group stacks

Render a `<NavigationStack />` inside a page of another stack — the child
auto-detects its parent. For coordinated siblings (e.g. a tab bar), wrap them in
`<GroupNavigationStack>`.

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
