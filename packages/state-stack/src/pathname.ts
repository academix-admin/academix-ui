// Framework-agnostic pathname resolution (defaults to window.location + History API).

import { useSyncExternalStore } from 'react';
import type { UsePathnameHook } from './types';

/** Subscribe to History API / hash / popstate navigations. Patches
 *  pushState & replaceState once so client-side routers emit updates too. */
const subscribeLocation = (() => {
  let patched = false;
  const patchHistory = () => {
    if (patched || typeof window === 'undefined' || typeof history === 'undefined') {
      return;
    }
    patched = true;
    (['pushState', 'replaceState'] as const).forEach((method) => {
      const original = history[method];
      history[method] = function patchedHistoryMethod(
        this: History,
        ...args: Parameters<History['pushState']>
      ) {
        const result = original.apply(this, args as never);
        window.dispatchEvent(new Event('statestack:locationchange'));
        return result;
      } as History[typeof method];
    });
  };

  return (callback: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    patchHistory();
    window.addEventListener('popstate', callback);
    window.addEventListener('hashchange', callback);
    window.addEventListener('statestack:locationchange', callback);
    return () => {
      window.removeEventListener('popstate', callback);
      window.removeEventListener('hashchange', callback);
      window.removeEventListener('statestack:locationchange', callback);
    };
  };
})();

/** Default, dependency-free pathname hook backed by `window.location`. */
export const useLocationPathname: UsePathnameHook = () =>
  useSyncExternalStore(
    subscribeLocation,
    () => (typeof window !== 'undefined' ? window.location.pathname : null),
    () => null
  );
