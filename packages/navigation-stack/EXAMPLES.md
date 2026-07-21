# @academix-admin/navigation-stack — Examples

Real-world patterns, adapted from a production app. Each snippet is a client
component (`'use client'`).

- [1. Define a stack](#1-define-a-stack)
- [2. Navigate and pass params](#2-navigate-and-pass-params)
- [3. `pushAndPopUntil` — return to a specific page](#3-pushandpopuntil--return-to-a-specific-page)
- [4. Page lifecycle](#4-page-lifecycle)
- [5. Cross-page dependency injection](#5-cross-page-dependency-injection)
- [6. Require objects before navigating (`pushWith`)](#6-require-objects-before-navigating-pushwith)
- [7. Request / response between pages](#7-request--response-between-pages)
- [8. Nested stacks](#8-nested-stacks)
- [9. Lazy-loaded pages](#9-lazy-loaded-pages)

---

## 1. Define a stack

A stack maps route keys to page components and picks an entry route. This is the
whole integration surface — everything else happens through `useNav()` inside
pages.

```tsx
'use client';

import NavigationStack from '@academix-admin/navigation-stack';
import PaymentPage from './payment-page/payment-page';
import TopUpPage from './top-up-page/top-up-page';
import WithdrawPage from './withdraw-page/withdraw-page';
import ViewTransactionPage from './view-transaction-page/view-transaction-page';

const paymentStackNavLink = {
  payment_page: PaymentPage,
  top_up_page: TopUpPage,
  withdraw_page: WithdrawPage,
  view_transaction: ViewTransactionPage,
};

export const PaymentStack = () => (
  <NavigationStack
    id="payment-stack"
    navLink={paymentStackNavLink}
    entry="payment_page"
    transition="slide"
    syncHistory
    persist
  />
);
```

## 2. Navigate and pass params

Params travel with the route key; the target page reads them from its `params`
prop.

```tsx
'use client';
import { useNav } from '@academix-admin/navigation-stack';

function PaymentPage() {
  const nav = useNav();
  return (
    <button
      onClick={() =>
        nav.push('view_transaction', { transactionId: 'txn_123' })
      }
    >
      View transaction
    </button>
  );
}

function ViewTransactionPage({ params }: { params?: { transactionId: string } }) {
  const nav = useNav();
  return (
    <>
      <h1>Transaction {params?.transactionId}</h1>
      <button onClick={() => nav.pop()}>Back</button>
    </>
  );
}
```

## 3. `pushAndPopUntil` — return to a specific page

Push a page and, once done, collapse the stack back to a known route — great for
"open detail from a deep list, then return to the section root".

```tsx
await nav.pushAndPopUntil(
  'view_transaction',
  (entry) => entry.key === 'payment_page',
  { transactionId },
);
```

Related: `nav.popUntil(predicate)`, `nav.popToRoot()`, `nav.pushAndReplace(key)`.

## 4. Page lifecycle

`usePageLifecycle(nav, callbacks, deps)` reacts to navigation events for the
current page. Handlers: `onEnter`, `onExit`, `onPause`, `onResume`,
`onBeforePush`/`onAfterPush`, `onBeforePop`/`onAfterPop`,
`onBeforeReplace`/`onAfterReplace`.

```tsx
'use client';
import { useNav, usePageLifecycle } from '@academix-admin/navigation-stack';

function QuizPage() {
  const nav = useNav();

  usePageLifecycle(
    nav,
    {
      // Fires when this page becomes visible again after a child page pops.
      onResume: ({ current }) => {
        refreshCountdown();
      },
      onExit: () => stopPolling(),
    },
    [/* deps */],
  );

  return null;
}
```

## 5. Cross-page dependency injection

A page can **provide** a value or callback that another page **consumes** —
without prop drilling or global state. Scope keeps providers isolated; `global`
shares across nested stacks.

```tsx
// Provider page — expose a lookup function
function TransactionsPage() {
  const nav = useNav();
  nav.provideObject(
    'getTransactionById',
    () => (id: string) => transactions.find((t) => t.id === id),
    { global: true, scope: 'payment-transactions' },
  );
  return null;
}

// Consumer page — read it back
import { useObject } from '@academix-admin/navigation-stack';

function DetailPage({ params }: { params?: { id: string } }) {
  const result = useObject<(id: string) => Transaction | undefined>(
    'getTransactionById',
    { global: true, scope: 'payment-transactions' },
  );
  const txn = result.isProvided ? result.getter()(params!.id) : undefined;
  return <pre>{JSON.stringify(txn, null, 2)}</pre>;
}
```

The hook form `useProvideObject` ties provision to a component's lifecycle and
re-provides when dependencies change:

```tsx
useProvideObject<PinController>(
  'pin_controller',
  () => ({
    inUse: showConfirm,
    action: async (pin: string) => handleConfirm(pin),
  }),
  { scope: 'pin_scope', dependencies: [showConfirm, profile] },
);
```

## 6. Require objects before navigating (`pushWith`)

Push a page only after declaring the objects it needs — the target can rely on
them being present.

```tsx
nav.pushWith('pin', { requireObjects: ['pin_controller'] });
```

## 7. Request / response between pages

Ask another page for data and `await` the answer.

```tsx
// Handler page
useProvideRequestHandler('confirm', async (message: string) =>
  window.confirm(message),
);

// Caller page
const confirmed = await nav.sendRequest<string, boolean>(
  'confirm',
  'Delete this item?',
);
```

## 8. Nested stacks

Render a `<NavigationStack />` inside a page of another stack. The child
auto-detects its parent; `pop()` past a child's root can exit to the parent
(guarded by `onExitStack`).

```tsx
function ProfilePage() {
  return (
    <NavigationStack
      id="profile-inner"
      navLink={{ overview: Overview, settings: Settings }}
      entry="overview"
    />
  );
}
```

For coordinated siblings (e.g. a tab bar with one stack per tab), wrap them in
`<GroupNavigationStack>`.

## 9. Lazy-loaded pages

Code-split heavy routes with `lazyComponents`; they load on first navigation.

```tsx
<NavigationStack
  id="app"
  navLink={{ home: HomePage }}
  entry="home"
  lazyComponents={{
    reports: () => import('./reports/reports-page'),
  }}
/>
```
