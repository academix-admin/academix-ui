'use client';

import { useEffect, useRef } from 'react';
import { StateStackCore } from '../core/StateStackCore';

/**
 * RE-READ WHENEVER THIS SCOPE IS INVALIDATED.
 *
 * `useDemandState` needs nothing of this: it holds a key, and invalidating the scope clears that
 * key's demand flag so the next `demand()` runs the loader. This is for everything that fetches for
 * itself — a paginated list, an infinite scroll, a read that assembles several calls — where the
 * loader belongs to the screen and nothing else can call it.
 *
 * The alternative consumers reach for is clearing the scope, and that is a different thing wearing
 * the same coat: clearing EMPTIES what is on screen, so a write in one place blanks a list in
 * another, and the person who was reading it loses their place. Staleness is answered by reading
 * again, keeping what is shown until the new answer lands.
 *
 * ```tsx
 * useInvalidation(CATALOG_SCOPE, reload);       // re-read when anything writes to the catalogue
 * StateStack.core.invalidateScope(CATALOG_SCOPE); // ...which this says has happened
 * ```
 *
 * A `null` scope subscribes to nothing, so a screen that does not know its scope yet — waiting on
 * an id, a shop, a signed-in person — can call this unconditionally rather than around a branch.
 */
export function useInvalidation(scope: string | null, onChanged: () => void): void {
  /*
   * Held in a ref so an inline closure does not resubscribe on every render: the subscription
   * follows the SCOPE, not the identity of the function.
   */
  const ref = useRef(onChanged);
  ref.current = onChanged;

  useEffect(() => {
    if (!scope) return;
    return StateStackCore.instance.onInvalidate(scope, () => ref.current());
  }, [scope]);
}
