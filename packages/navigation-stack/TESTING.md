# Testing pages that live in a stack

A page built on this library is not a component you can render on its own. `useNav`, `useIsTop`,
`usePageLifecycle` and the scroll helpers all need a stack above them, so a test that renders the
page bare gets an error instead of an answer.

The usual workaround is to mock `useNav`. Don't: it proves the page *called a function*, and every
failure worth catching survives it — the wrong page arrives, the stack does not pop, a param is
lost, the page under the top one is rebuilt when it should not be.

```bash
npm i -D @testing-library/react   # an optional peer dependency of this package
```

```tsx
import { renderInStack } from '@academix-admin/navigation-stack/testing';
```

## The shape of a test

```tsx
const { nav, stack, settle, getByText } = renderInStack(<CustomerPage />, {
  navLink: { receipt: ReceiptPage },   // routes this page can push to
});

await settle();
getByText('Open receipt').click();     // what a person does
await settle(50);

expect(stack().map((e) => e.key)).toEqual(['page', 'receipt']);
```

The page under test is registered as `page`. `nav` is the same API the app uses, so a test can drive
it directly when that is clearer than clicking:

```tsx
await nav.push('receipt', { id: '7' });
await settle();
expect(getByText('Receipt 7')).toBeTruthy();

await nav.pop();
await settle();
expect(stack().map((e) => e.key)).toEqual(['page']);
```

## What it returns

Everything `render()` returns, plus:

| | |
|---|---|
| `nav` | The stack's navigation API — `push`, `pop`, `popUntil`, `replace`, … |
| `stack()` | The entries as they stand, newest last |
| `settle(ms?)` | Let effects, transitions and the reconciler finish |
| `id` | The stack's id, for a test that needs the registry itself |

## Options

| | Default | |
|---|---|---|
| `navLink` | `{}` | Extra routes, merged with the page under test |
| `entry` | `'page'` | Which route the stack opens on |
| `id` | unique per render | Two tests sharing an id share a stack — see below |
| `syncHistory` | `false` | A test rarely wants the URL rewritten under it |
| `persist` | `false` | |
| `transitionDuration` | `0` | So a test is not waiting out animations it did not ask for |

## The trap worth knowing

**The registry is process-global and outlives `cleanup()`.** Two renders sharing a stack id share a
stack, so the second test starts with the first one's pages already pushed — and that failure reads
as "my test passes alone and fails in the suite," which is a day gone.

`renderInStack` generates a fresh id each time for exactly this reason. If you pass your own, clear
it:

```tsx
import { forgetStack } from '@academix-admin/navigation-stack/testing';

afterEach(() => forgetStack('my-stack'));
```

## Testing params

Params are spread onto the page as props, and are also readable with `useLocation()`:

```tsx
function ReceiptPage({ id }: { id?: string }) { … }          // as a prop
const id = useLocation()?.params?.id as string | undefined;   // or from the location
```

There is no `params` prop. A page written as `({ params })` receives `undefined`.

## Testing lifecycle

`onResume` fires when a page becomes the top again — which is where a screen refetches, so it is
usually the thing a test is actually about:

```tsx
await nav.push('receipt');
await settle();
await nav.pop();          // the page under it resumes
await settle();
expect(refetch).toHaveBeenCalledTimes(1);
```

## End-to-end, in a real browser

For Playwright there is a separate entry — `@academix-admin/navigation-stack/playwright` — with
`installNavDevtools(page)`, `navStack(page, id)` and `navStackIds(page)`, which read the live stack
out of a running app. See [DEVTOOLS.md](./DEVTOOLS.md).
