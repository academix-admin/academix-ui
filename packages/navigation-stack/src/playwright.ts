/**
 * Playwright helpers for navigation-stack.
 *
 * Deliberately NOT importing from '@playwright/test'. The Page type here is structural — anything
 * with `evaluate` and `addInitScript` satisfies it — so this package takes no test-framework
 * dependency and stays installable in an app that has never heard of Playwright. It also means
 * these work unchanged with Puppeteer or any driver exposing the same two methods.
 *
 * WHY THIS EXISTS
 * E2E tests for navigation usually assert on the DOM ("is the detail page visible?"), which
 * conflates rendering with navigation state — precisely the distinction that matters when a pop
 * updates the stack but leaves the old page mounted. These helpers read the stack directly, so a
 * test can assert the two independently and say which one broke.
 *
 * USAGE
 *
 *   import { installNavDevtools, navStack } from '@academix-admin/navigation-stack/playwright';
 *
 *   test.beforeEach(async ({ page }) => {
 *     await installNavDevtools(page);   // MUST run before the app boots
 *     await page.goto('/main');
 *   });
 *
 *   test('back pops one page', async ({ page }) => {
 *     const nav = navStack(page, 'quiz-stack');
 *     await nav.push('detail');
 *     await nav.expectDepth(2);
 *
 *     await page.goBack();
 *     await nav.expectDepth(1);        // fails loudly if Back left the site instead
 *   });
 */

/**
 * Minimal structural Page — satisfied by Playwright's Page, and by Puppeteer's.
 *
 * Intentionally loose. A tighter signature does not accept the real thing: Playwright's
 * `addInitScript` resolves to `Disposable`, not `void`, and its `evaluate` overloads are far more
 * elaborate than the one shape used here. Declaring exact types made this fail to compile against
 * the very library it exists to serve, so the structural contract is kept to "has these two
 * methods" and the precise typing lives on the helpers below, where it is actually useful.
 */
export type EvaluablePage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluate: (fn: any, arg?: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addInitScript: (script: any, arg?: any) => Promise<any>;
};

/**
 * Turn devtools on for the page BEFORE any app code runs.
 *
 * Required against a production build, where devtools are off by default. addInitScript runs on
 * every navigation including reloads, which matters for reload/deep-link tests — a flag set with
 * a plain evaluate() would be wiped by the very reload under test.
 */
export async function installNavDevtools(page: EvaluablePage): Promise<void> {
  await page.addInitScript({ content: 'window.__NAV_STACK_DEVTOOLS__ = true;' });
}

type Snapshot = {
  id: string;
  depth: number;
  entries: { uid: string; key: string; params?: Record<string, unknown> }[];
  top: string | null;
  pushDepth: number;
  historySyncEnabled: boolean;
  overlays: string[];
};

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(`[navigation-stack] ${msg}`);
}

/** Bind the helpers to one stack id. */
export function navStack(page: EvaluablePage, stackId: string) {
  // Each call passes a plain, serializable arg and a self-contained arrow function. Playwright
  // serializes the function source and runs it in the page, so it must not close over anything
  // from this module -- hence __NAV_STACK__ is looked up inside every callback rather than hoisted.
  const NOT_INSTALLED =
    '[navigation-stack] devtools not installed - call installNavDevtools(page) before page.goto()';

  const api = {
    async snapshot(): Promise<Snapshot> {
      const snap = await page.evaluate((id: string) => {
        const nav = (window as never as { __NAV_STACK__?: any }).__NAV_STACK__;
        return nav ? nav.snapshot(id) : null;
      }, stackId as never);
      assert(snap !== null, NOT_INSTALLED);
      assert(snap !== undefined, `unknown stack "${stackId}"`);
      return snap as Snapshot;
    },

    async depth(): Promise<number> {
      return (await api.snapshot()).depth;
    },

    async top(): Promise<string | null> {
      return (await api.snapshot()).top;
    },

    async keys(): Promise<string[]> {
      return (await api.snapshot()).entries.map((e) => e.key);
    },

    /**
     * History entries this stack owns. 0 while several pages deep means nothing was pushed, so
     * browser Back will leave the site -- a different failure from Back popping twice, and worth
     * distinguishing in a test rather than just seeing "wrong page".
     */
    async ownedHistoryEntries(): Promise<number> {
      return (await api.snapshot()).pushDepth;
    },

    async overlays(): Promise<string[]> {
      return (await api.snapshot()).overlays;
    },

    // ---- driving ------------------------------------------------------------------------

    push(key: string, params?: Record<string, unknown>) {
      return page.evaluate(
        (a: { id: string; key: string; params?: Record<string, unknown> }) =>
          (window as never as { __NAV_STACK__: any }).__NAV_STACK__.push(a.id, a.key, a.params),
        { id: stackId, key, params } as never,
      );
    },

    pop(): Promise<{ before: number; after: number; popped: boolean }> {
      return page.evaluate(
        (id: string) => (window as never as { __NAV_STACK__: any }).__NAV_STACK__.pop(id),
        stackId as never,
      );
    },

    popToRoot() {
      return page.evaluate(
        (id: string) => (window as never as { __NAV_STACK__: any }).__NAV_STACK__.popToRoot(id),
        stackId as never,
      );
    },

    /** Recorded navigations -- the timeline to attach when a flake needs explaining. */
    events() {
      return page.evaluate(
        () => (window as never as { __NAV_STACK__: any }).__NAV_STACK__.events(),
      );
    },

    /** One JSON blob for a failure artifact. */
    debug() {
      return page.evaluate(
        () => (window as never as { __NAV_STACK__: any }).__NAV_STACK__.debug(),
      );
    },

    // ---- waiting / asserting ------------------------------------------------------------

    /** Poll until the stack reaches `depth`. Avoids waitForTimeout guesses. */
    async waitForDepth(depth: number, timeoutMs = 5000): Promise<void> {
      const start = Date.now();
      let last = -1;
      while (Date.now() - start < timeoutMs) {
        last = await api.depth();
        if (last === depth) return;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error(
        `[navigation-stack] stack "${stackId}" did not reach depth ${depth} within ${timeoutMs}ms (last: ${last})`,
      );
    },

    async expectDepth(depth: number): Promise<void> {
      const actual = await api.depth();
      assert(actual === depth, `expected stack "${stackId}" depth ${depth}, got ${actual}`);
    },

    async expectTop(key: string): Promise<void> {
      const actual = await api.top();
      assert(actual === key, `expected top of "${stackId}" to be "${key}", got "${actual}"`);
    },

    /**
     * Assert the stack popped AND the old page actually went away.
     *
     * These are separate failures: the stack can pop correctly while the popped page stays
     * mounted. Asserting only the DOM hides the former; asserting only depth hides the latter.
     */
    async expectPoppedCleanly(previousTopKey: string): Promise<void> {
      const snap = await api.snapshot();
      assert(
        snap.top !== previousTopKey,
        `stack "${stackId}" still reports "${previousTopKey}" on top after a pop`,
      );
      assert(
        !snap.entries.some((e) => e.key === previousTopKey),
        `"${previousTopKey}" is still in the stack of "${stackId}" after a pop: [${snap.entries.map((e) => e.key).join(', ')}]`,
      );
    },
  };

  return api;
}

/** Every registered stack id — useful for a smoke assertion that the app mounted what you expect. */
export function navStackIds(page: EvaluablePage): Promise<string[]> {
  return page.evaluate(() => (window as never as { __NAV_STACK__: any }).__NAV_STACK__.stacks());
}
