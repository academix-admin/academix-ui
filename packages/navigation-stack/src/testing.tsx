'use client';

/**
 * TESTING A PAGE THAT LIVES IN A STACK.
 *
 * A page built on this library is not a component you can render on its own: `useNav`, `useIsTop`,
 * `usePageLifecycle` and the scroll helpers all need a stack above them, and a test that renders the
 * page bare gets an error instead of an answer. The usual workaround is to mock `useNav`, which
 * tests that the page calls a function rather than that pushing does anything — the interesting
 * failures (the wrong page arrives, the stack does not pop, a param is lost) all survive it.
 *
 * `renderInStack` puts a real stack around the page and hands back the same API the app uses, so a
 * test can push, pop and read the stack exactly as a person would drive it.
 *
 *     import { renderInStack } from '@academix-admin/navigation-stack/testing';
 *
 *     const { nav, stack, settle } = renderInStack(<CustomerPage />, {
 *       navLink: { receipt: ReceiptPage },
 *     });
 *
 *     await nav.push('receipt', { id: '7' });
 *     await settle();
 *     expect(stack().map((e) => e.key)).toEqual(['page', 'receipt']);
 *
 * Requires `@testing-library/react`, which is an optional peer dependency: an app that does not
 * import this entry point never needs it.
 */

import React from 'react';
import { act, render, type RenderResult } from '@testing-library/react';
import NavigationStack from './components';
import { getRegistry } from './core/registry';
import type { NavStackAPI, NavigationMap, StackEntry } from './types';

export interface RenderInStackOptions {
  /**
   * Extra routes this page can push to. The page under test is registered as `page` unless `entry`
   * says otherwise, so a test can push away from it and back.
   */
  navLink?: NavigationMap;
  /** The route the stack opens on. Defaults to the page passed in, registered as `page`. */
  entry?: string;
  /**
   * The stack's id. Unique per render by default: two tests sharing one id share a registry entry,
   * and the second sees the first one's stack.
   */
  id?: string;
  /** Off by default — a test rarely wants the URL rewritten under it. */
  syncHistory?: boolean;
  persist?: boolean;
  /** Zero by default, so a test is not waiting out animations it did not ask for. */
  transitionDuration?: number;
}

export interface StackHarness extends RenderResult {
  /** The same navigation API the app uses. */
  nav: NavStackAPI;
  /** The stack as it stands, newest last. */
  stack: () => StackEntry[];
  /** Let effects, transitions and the reconciler finish. */
  settle: (ms?: number) => Promise<void>;
  /** The stack's id, for a test that needs to reach the registry itself. */
  id: string;
}

let n = 0;

export function renderInStack(
  page: React.ComponentType<Record<string, unknown>> | React.ReactElement,
  options: RenderInStackOptions = {},
): StackHarness {
  const {
    navLink = {},
    entry = 'page',
    id = `test-stack-${++n}`,
    syncHistory = false,
    persist = false,
    transitionDuration = 0,
  } = options;

  // An element is wrapped so it can be a route like any other; a component is registered as it is.
  const PageRoute: React.ComponentType<Record<string, unknown>> = React.isValidElement(page)
    ? () => page
    : (page as React.ComponentType<Record<string, unknown>>);

  const result = render(
    <NavigationStack
      id={id}
      navLink={{ page: PageRoute, ...navLink }}
      entry={entry}
      syncHistory={syncHistory}
      persist={persist}
      transitionDuration={transitionDuration}
    />,
  );

  const regEntry = () => getRegistry().get(id);

  const nav = new Proxy({} as NavStackAPI, {
    get(_t, prop: string) {
      const api = regEntry()?.api;
      if (!api) {
        throw new Error(
          `[renderInStack] the stack "${id}" is not mounted yet. Await settle() before using nav.`,
        );
      }
      return (api as unknown as Record<string, unknown>)[prop];
    },
  });

  const settle = async (ms = 0) => {
    await act(async () => {
      await new Promise((r) => setTimeout(r, ms));
    });
  };

  return {
    ...result,
    id,
    nav,
    stack: () => regEntry()?.stack ?? [],
    settle,
  };
}

/**
 * Forget a stack between tests.
 *
 * The registry is process-global and outlives `cleanup()`, so a stack id used twice carries the
 * first test's pages into the second. `renderInStack` generates a fresh id for exactly this reason;
 * this is for a test that passed its own.
 */
export function forgetStack(id: string): void {
  getRegistry().delete(id);
}
