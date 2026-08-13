# Navigation Devtools

Three surfaces over the same data:

| Surface | For | Entry point |
| --- | --- | --- |
| **Panel** | Debugging by eye while building | `<NavigationDevtools />` |
| **Console** | Poking at live state, bug reports | `window.__NAV_STACK__` |
| **Playwright** | E2E that asserts navigation, not the DOM | `@academix-admin/navigation-stack/playwright` |

Enabled automatically outside production. Nothing ships to a production bundle unless you opt in.

---

## 1. The panel

```tsx
import { NavigationDevtools } from '@academix-admin/navigation-stack';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <NavigationDevtools />       {/* renders null in production */}
    </>
  );
}
```

`Alt+N` toggles it. Safe to leave mounted permanently — it returns `null` when disabled, so there
is no build-time guard to remember.

| Tab | Shows |
| --- | --- |
| **stacks** | Every live stack, its entries top-first, and buttons to push / pop / popToRoot |
| **events** | Navigation timeline, colour-coded, with `from→to` depth transitions |
| **history** | `history.length` vs entries this library owns, per stack |
| **overlays** | Registered overlay ids per scope |

Two things the panel calls out because they are hard to see otherwise:

- **`depth > 1` with `pushDepth 0`** — you are several pages deep but own no history entries, so
  browser Back will *leave the site* instead of popping. Shown as an explicit warning.
- **An event with `from === to`** — a navigation that changed nothing. A pop that did not pop is
  highlighted, which is exactly the signature of "the popped page came back".

`copy` puts the full JSON snapshot on the clipboard for a bug report.

---

## 2. The console

```js
__NAV_STACK__.stacks()            // ['quiz-stack', 'profile-stack', …]
__NAV_STACK__.snapshot('quiz-stack')
__NAV_STACK__.history()           // historyLength vs ownedEntries
__NAV_STACK__.events()            // recent navigations
__NAV_STACK__.debug()             // everything, as one pasteable blob

await __NAV_STACK__.push('quiz-stack', 'detail', { id: 7 })
await __NAV_STACK__.pop('quiz-stack')      // → { before, after, popped }
```

`pop()` returns `popped: false` when the depth did not change — a distinction that is invisible if
you only watch the screen.

### Is the code I think is running actually running?

```js
__NAV_STACK__.history().historyLength   // note it
// …push a page…
__NAV_STACK__.history().historyLength   // increments only if historyPush is active
```

---

## 3. Playwright

```ts
import { installNavDevtools, navStack } from '@academix-admin/navigation-stack/playwright';

test.beforeEach(async ({ page }) => {
  await installNavDevtools(page);   // MUST precede page.goto()
  await page.goto('/main');
});
```

`installNavDevtools` uses `addInitScript`, so it survives reloads — which matters, because a flag
set with `page.evaluate()` would be erased by the very reload a deep-link test is exercising.

No Playwright dependency is added to your app: the `Page` type is structural, so Puppeteer or any
driver with `evaluate` + `addInitScript` works too.

### Why assert on the stack instead of the DOM

Rendering and navigation are **separate failures**. A pop can update the stack correctly and still
leave the old page mounted. A DOM-only assertion cannot tell those apart, and reports the wrong
cause:

```ts
const nav = navStack(page, 'quiz-stack');

await nav.push('detail');
await nav.expectDepth(2);

await nav.pop();
await nav.expectDepth(1);                 // navigation correct?
await nav.expectPoppedCleanly('detail');  // …and the page actually gone?
await expect(page.getByText('Detail')).toBeHidden();  // …and not visible?
```

---

## 4. The navigation test matrix

These are the four behaviours worth pinning for any stack-based app.

```ts
test('browser Back pops one page instead of leaving the site', async ({ page }) => {
  const nav = navStack(page, 'quiz-stack');
  await nav.push('detail');
  await nav.expectDepth(2);

  // If nothing was pushed, this assertion is what tells you — before Back is even pressed.
  expect(await nav.ownedHistoryEntries()).toBeGreaterThan(0);

  await page.goBack();
  await nav.waitForDepth(1);
  expect(page.url()).toContain('/main');   // still in the app
});

test('a deep-linked user is never sent off the front of history', async ({ page }) => {
  await page.goto('/main?nav=quiz-stack:quiz_page.detail');   // arrives mid-stack
  const nav = navStack(page, 'quiz-stack');

  // We own no entries here — we did not push them, the user arrived directly.
  expect(await nav.ownedHistoryEntries()).toBe(0);

  await nav.popToRoot();
  expect(page.url()).toContain('/main');   // popToRoot must not exit the site
});

test('a reload restores the same stack', async ({ page }) => {
  const nav = navStack(page, 'quiz-stack');
  await nav.push('detail');
  const before = await nav.keys();

  await page.reload();
  await nav.waitForDepth(before.length);
  expect(await nav.keys()).toEqual(before);
});

test('back closes an overlay before popping the page underneath', async ({ page }) => {
  const nav = navStack(page, 'quiz-stack');
  await nav.push('detail');
  await page.getByRole('button', { name: 'Share' }).click();   // opens a sheet
  expect(await nav.overlays()).not.toHaveLength(0);

  await page.goBack();
  expect(await nav.overlays()).toHaveLength(0);
  await nav.expectDepth(2);   // the page underneath must NOT have popped too
});
```

### Attach the timeline when something fails

```ts
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('navigation-stack', {
      body: JSON.stringify(await navStack(page, 'quiz-stack').debug(), null, 2),
      contentType: 'application/json',
    });
  }
});
```

A flaky navigation test usually becomes obvious the moment you can see the event timeline: the
`from→to` transitions show whether the pop happened twice, not at all, or on the wrong stack.

---

## 5. Production

Devtools are stripped from production builds. Bundlers substitute `process.env.NODE_ENV`
literally, so the dev branch is removed at build time rather than merely skipped at runtime.

To enable them deliberately — E2E against a production build, or diagnosing a live-only bug:

```js
window.__NAV_STACK_DEVTOOLS__ = true;   // before the app boots
```

An explicit value always wins, in both directions, so you can also force them **off** in
development with `= false`.
