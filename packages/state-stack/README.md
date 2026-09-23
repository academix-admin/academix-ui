# @academix-admin/state-stack

Production-ready, **framework-agnostic** cross-tab state management for React.

- 🗂️ **IndexedDB-first persistence** with automatic `localStorage` fallback
- 📡 **Cross-tab sync** via `BroadcastChannel` (self-message suppression)
- ⏪ **Undo / redo** for both persistent and ephemeral state
- ⏱️ **TTL** expiry per key
- 🧵 **Serialized updates** — per-key promise chain, no dropped concurrent writes
- ⚛️ **Atoms, computed, demand-state** — pick the primitive that fits
- 🧭 **Route-scoped state** — framework-agnostic, with an optional Next.js adapter
- 🔒 **React 18 safe** — built on `useSyncExternalStore`

> `react` / `react-dom` are peer deps. `next` is an **optional** peer dep, used
> only if you import the `/next` adapter.

> 📖 **[More real-world examples →](./EXAMPLES.md)** — typed stores, demand
> state, atoms, undo/redo and router wiring, adapted from a production app.

## Install

```bash
npm install @academix-admin/state-stack
npm install react react-dom
```

## Primitives at a glance

| Hook | Scope | Persists? | Use it for |
|------|-------|-----------|------------|
| `useAtom(key, initial)` | Global by key | No | Simple shared in-memory value |
| `useComputed(fn, default, deps)` | Local | No | Derived values, no stale flash |
| `useToggle(initial)` / `useList(initial)` | Local | No | Ergonomic local state |
| `useDemandState(initial, opts)` | Route (default) or custom | Optional | Per-page state, persistence, undo/redo, TTL |
| `createStateStack(blueprints)` | Custom scope | Optional | Redux-like typed stores with methods + middleware |
| `useDemandResource(loader, opts)` | Route or custom | Optional | The same read, with `status` / `error` handled for you |
| `useInvalidation(scope, fn)` | Custom scope | — | Re-read when something says that scope went stale |

## `useDemandState` — route-scoped persistent state

```tsx
'use client';
import { useDemandState } from '@academix-admin/state-stack';

function SearchPage() {
  const [query, load, setQuery, ctl] = useDemandState('', {
    key: 'search',
    persist: true,     // survives reloads (IndexedDB → localStorage)
    ttl: 60_000,       // optional expiry
    historyDepth: 10,  // undo/redo depth
  });

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      // ctl.clear(), ctl.clearByScope(), ctl.isHydrated, …
    />
  );
}
```

Returns a tuple: `[value, load, set, controls]`.

- `value` — current state
- `load(loader)` — async loader with `{ get, set }` helpers (e.g. fetch-then-set)
- `set(next | prev => next)` — update the value
- `controls` — `{ clear, clearByScope, clearByPathname, clearByPrefix, clearByCondition, isHydrated }`

State is scoped to the current route by default (`route:<pathname>`). Provide an
explicit `scope` to share across routes, or configure route resolution (below).

### Options

| Option | Default | What it does |
|---|---|---|
| `key` | route-derived | Names the value. One key is one shape — two hooks sharing a key must agree on it. |
| `scope` | `route:<pathname>` | Groups keys, so one write can invalidate a family of them. |
| `persist` | **`true`** | Keeps the value on the device (IndexedDB → localStorage). It is ON unless you turn it off. |
| `deps` | `[]` | Changing these re-runs the loader, like a `useEffect` dependency list. |
| `revalidateOnMount` | `true` | Whether a fresh mount re-runs the loader. `false` is "load once": a remount — navigating back, a cold start — reuses the stored value. `deps` changes and TTL expiry still reload. |
| `revive` | — | Rebuild the stored value on hydration, e.g. turning flattened JSON back into class instances. A throw keeps the raw value. |
| `ttl` | — | How long the value stays fresh, in milliseconds. |
| `storage` | the configured default | Which adapter holds it. |
| `historyDepth` | — | How many steps of undo/redo to keep. |
| `clearOnUnmount` | `false` | Drop the value when the component goes away. |
| `clearOnBack` | `false` | Drop it when the route is left backwards. |
| `clearOnZeroSubscribers` | `false` | Drop it once nothing is reading it. |

`set(value, { override: true })` writes even when the value is "empty" (null, `[]`, `{}`, an empty
Map or Set). Without it, an empty value does NOT overwrite a non-empty stored one — so a loader whose
fetch failed or was blocked cannot wipe what is already on screen. Use `override` for a deliberate
reset.

## Atoms & derived state

```tsx
import { useAtom, useComputed } from '@academix-admin/state-stack';

const [count, setCount] = useAtom('counter', 0);
const doubled = useComputed(() => count * 2, 0, [count]);
```

## Typed stores with methods — `createStateStack`

```tsx
import { createStateStack } from '@academix-admin/state-stack';

const { useStack } = createStateStack({
  cart: {
    addItem: (state: { items: string[] }, item: string) => ({
      items: [...state.items, item],
    }),
    clear: () => ({ items: [] }),
  },
});

function Cart() {
  const { cart, cart$, __meta } = useStack('cart', {
    initial: { items: [] },
    persist: true,
    historyDepth: 50,
  });

  return (
    <>
      <span>{cart.items.length} items</span>
      <button onClick={() => cart$.addItem('Book')}>Add</button>
      <button onClick={() => __meta.undo()} disabled={!__meta.canUndo()}>Undo</button>
    </>
  );
}
```

`useStack('cart', …)` returns `{ cart, cart$, __meta }` — the state, its method
object (each method returns a `Promise<void>`), and metadata
(`undo`, `redo`, `canUndo`, `canRedo`, `clear`, `clearByScope`, `isHydrated`).

## Saying something changed — `useInvalidation`

```tsx
import { StateStack, useInvalidation } from '@academix-admin/state-stack';

function StockList() {
  const [page, loadPage] = usePagedProducts();          // a loader this screen owns
  useInvalidation('catalog', () => loadPage.reload());  // re-read when the catalogue changes
  …
}

// Anywhere a write happens:
StateStack.core.invalidateScope('catalog');
```

`invalidateScope` marks every key in a scope as stale while KEEPING its value, so `useDemandState`
consumers re-read on their next demand. `useInvalidation` is the other half, for screens that own
their loader — a paginated list, an infinite scroll, a read assembled from several calls — which
nothing else can call.

**This is not `clearScope`.** Clearing deletes the values, so a write in one place empties a list
somewhere else and whoever was reading it loses their place. Clear only when the data must not be
seen again — signing out, or switching account. Everything else is staleness, and the answer to
staleness is to read again while keeping what is on screen.

A `null` scope subscribes to nothing, so a screen that does not know its scope yet can call the hook
unconditionally.

## The `StateStack` façade

```ts
import { StateStack } from '@academix-admin/state-stack';

StateStack.init({ storagePrefix: 'myapp', preferredStorage: 'auto' });
StateStack.clearScope('route:/checkout');
StateStack.clearCurrentPath();
StateStack.clearByPrefix('search');
```

## Configuration — `initStateStack`

Call once at startup (before any state hooks render):

```ts
import { initStateStack } from '@academix-admin/state-stack';

initStateStack({
  storagePrefix: 'myapp',        // namespace persisted keys
  preferredStorage: 'auto',      // 'indexeddb' | 'localstorage' | 'auto'
  crossTabSync: true,
  debug: false,
  // usePathname: myRouterHook,   // see route scoping below
});
```

## Route scoping (framework-agnostic)

By default, route-scoped state reads the pathname from `window.location` and
tracks History API navigations (`pushState`/`replaceState`/`popstate`). That
works in any React app with **no configuration**.

To align scoping with your router, inject its pathname hook once:

```ts
initStateStack({ usePathname: myRouterUsePathnameHook });
```

### Next.js App Router adapter

```tsx
'use client';
import { connectNextRouter } from '@academix-admin/state-stack/next';

connectNextRouter(); // wires next/navigation's usePathname
```

Call it once in a client boundary (e.g. a providers component) before rendering
components that use `useDemandState`. `next` is an optional peer dependency —
only required if you import this adapter.

## Storage adapters

`indexedDBAdapter`, `browserStorageAdapter`, `defaultStorageAdapter` (IndexedDB
→ localStorage) and `fallbackStorageAdapter` (no-op) are exported. Implement the
`StorageAdapter` interface for custom backends and pass it via `storage`.

## Dev inspector

In development, `window.__STATE_STACK__` exposes `core`, `atomStore`, adapters
and a `debug()` snapshot. Stripped in production builds.

## License

MIT © Academix
