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
