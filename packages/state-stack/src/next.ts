'use client';

/**
 * @academix-admin/state-stack/next
 * Next.js adapter — wires the App Router's `usePathname` into state-stack so
 * route-scoped state (`useDemandState`) aligns with client-side navigation.
 *
 * Usage (call once, before any state hooks render — e.g. in a client
 * providers component or the root layout's client boundary):
 *
 *   'use client';
 *   import { connectNextRouter } from '@academix-admin/state-stack/next';
 *   connectNextRouter();
 *
 * Requires `next` >= 13 (App Router) as a peer dependency.
 */

import { usePathname } from 'next/navigation';
// Import the package's public entry (not the relative source) so this adapter
// and the app share a SINGLE state-stack core instance. If this imported the
// relative module, the bundler would emit a second copy of the core and
// `connectNextRouter()` would configure a different singleton than the one the
// app's hooks read from — making the adapter a silent no-op.
import { initStateStack } from '@academix-admin/state-stack';

/** A hook returning the current route pathname, or null before it is known. */
type UsePathnameHook = () => string | null;

/** The Next.js App Router pathname hook, typed for state-stack. */
export const useNextPathname: UsePathnameHook = () => usePathname();

/**
 * Connect state-stack's route scoping to the Next.js App Router.
 * Idempotent — safe to call more than once.
 */
export function connectNextRouter(): void {
  initStateStack({ usePathname: useNextPathname });
}
