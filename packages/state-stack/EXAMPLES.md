# @academix/state-stack — Examples

Real-world patterns, adapted from a production app. Each snippet is a client
component or hook (`'use client'`).

- [1. Typed store with methods (`createStateStack`)](#1-typed-store-with-methods-createstatestack)
- [2. Route-scoped demand state (`useDemandState`)](#2-route-scoped-demand-state-usedemandstate)
- [3. Async loading into demand state](#3-async-loading-into-demand-state)
- [4. Shared event bus with `useAtom`](#4-shared-event-bus-with-useatom)
- [5. Undo / redo](#5-undo--redo)
- [6. Clearing state](#6-clearing-state)
- [7. Wire it to your router](#7-wire-it-to-your-router)

---

## 1. Typed store with methods (`createStateStack`)

Define state transitions as pure functions; `createStateStack` gives you a fully
typed `useStack` hook. State, methods and metadata come back as
`{ <key>, <key>$, __meta }`.

```tsx
'use client';
import { createStateStack, type StackConfig } from '@academix/state-stack';
import { UserData } from '@/models/user-data';

const methods = {
  userData: {
    set: (state: UserData | null, patch: Partial<UserData> | null) => {
      if (!patch) return null;
      return state ? UserData.from(state).copyWith(patch) : new UserData(patch);
    },
    changeImage: (state: UserData | null, image: string | null) =>
      state ? UserData.from(state).changeImage(image) : null,
    get: (state: UserData | null) => state,
  },
};

export const { useStack } = createStateStack(methods);

const userDataConfig: StackConfig<UserData | null> = {
  initial: null,
  persist: true,      // survives reloads (IndexedDB → localStorage)
  historyDepth: 1,
};

// A tidy domain hook — note the third arg is the scope.
export const useUserData = () => useStack('userData', userDataConfig, 'secondary_flow');
```

Consume it:

```tsx
function Header() {
  const { userData, userData$, __meta } = useUserData();

  if (!__meta.isHydrated) return <Spinner />;

  return (
    <>
      <span>{userData?.name}</span>
      <button onClick={() => userData$.changeImage(null)}>Remove photo</button>
    </>
  );
}
```

## 2. Route-scoped demand state (`useDemandState`)

Per-screen state with optional persistence, TTL and a `deps` array that
re-derives when inputs (e.g. language) change. Wrap it in a domain hook:

```tsx
'use client';
import { useDemandState } from '@academix/state-stack';
import type { RedeemCodeModel } from '@/models/redeem-code-model';

export const useRedeemCodes = (lang: string) =>
  useDemandState<RedeemCodeModel[]>([], {
    key: 'redeemCodes',
    persist: true,
    ttl: 600,               // seconds
    scope: 'redeem_code_flow',
    deps: [lang],           // refresh when language changes
  });
```

```tsx
function RedeemCodesPage({ lang }: { lang: string }) {
  const [codes, load, setCodes, ctl] = useRedeemCodes(lang);

  if (!ctl.isHydrated) return <Spinner />;
  return <List items={codes} />;
}
```

Without an explicit `scope`, state is keyed to the current route
(`route:<pathname>`) — see [§7](#7-wire-it-to-your-router).

## 3. Async loading into demand state

The second tuple element is a **loader** with `{ get, set }` helpers — ideal for
fetch-then-store, with the result persisted per the options above.

```tsx
const [codes, loadCodes, setCodes, ctl] = useRedeemCodes(lang);

useEffect(() => {
  loadCodes(async ({ set }) => {
    const res = await fetch(`/api/redeem-codes?lang=${lang}`);
    set(await res.json());
  });
}, [lang]);
```

## 4. Shared event bus with `useAtom`

`useAtom(key, initial)` is a global-by-key in-memory value — perfect for a light
cross-component event/notification channel.

```tsx
'use client';
import { useAtom } from '@academix/state-stack';

interface QuizDisplayEvent {
  isOpen: boolean;
  status?: string;
  timestamp: number;
}

export function useQuizDisplay() {
  const [event, setEvent] = useAtom<QuizDisplayEvent | null>('quiz-last-event', null);

  return {
    isOpen: event?.isOpen ?? false,
    open: (status: string) =>
      setEvent({ isOpen: true, status, timestamp: Date.now() }),
    close: () => setEvent({ isOpen: false, timestamp: Date.now() }),
  };
}
```

Any component calling `useQuizDisplay()` sees the same value and re-renders on
change — across the whole app, and across browser tabs.

## 5. Undo / redo

Both `createStateStack` stores and `useDemandState` keep bounded history
(`historyDepth`). Stores expose it via `__meta`:

```tsx
const { cart, cart$, __meta } = useStack('cart', { initial: { items: [] }, historyDepth: 50 });

<button onClick={() => __meta.undo()} disabled={!__meta.canUndo()}>Undo</button>
<button onClick={() => __meta.redo()} disabled={!__meta.canRedo()}>Redo</button>
```

## 6. Clearing state

From a store's `__meta`, from a `useDemandState` control object, or globally via
the `StateStack` façade:

```tsx
import { StateStack } from '@academix/state-stack';

// Store / demand-state controls
__meta.clear();               // this key
ctl.clearByScope('checkout'); // a whole scope

// Global façade
StateStack.clearScope('redeem_code_flow');
StateStack.clearCurrentPath();          // everything scoped to the current route
StateStack.clearByPrefix('quiz');       // any key/scope starting with "quiz"
```

## 7. Wire it to your router

Route scoping works with **zero config** (reads `window.location` and tracks
History navigations). To align it with your framework's router, inject its
pathname hook once at startup.

**Next.js (App Router):**

```tsx
// app/providers.tsx
'use client';
import { connectNextRouter } from '@academix/state-stack/next';
import { initStateStack } from '@academix/state-stack';

connectNextRouter();
initStateStack({ storagePrefix: 'academix' });

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Any other router:**

```tsx
import { initStateStack } from '@academix/state-stack';
import { useMyRouterPathname } from 'my-router';

initStateStack({ usePathname: useMyRouterPathname });
```
