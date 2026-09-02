'use client';

import { useEffect, useRef } from 'react';
import { readOverlayFragment, writeOverlayFragment, settleOverlayFragment } from './fragment';
import { claimOverlay, releaseOverlay } from './claims';

/**
 * Give an overlay a history entry, so the platform's own Back closes it.
 *
 * A sheet, a picker, a dialog — anything drawn over a page that should be dismissed by the back
 * gesture rather than dismissing the PAGE. Without an entry of its own, Back with a picker open
 * closes the picker and leaves the page behind it too: measured in a real shop, the back gesture
 * walked straight out of a half-built sale.
 *
 * WORKS WITH ANY OVERLAY, whoever drew it. This does not require the overlay to be registered with
 * a NavigationStack, own a portal, or be one of this project's viewer packages — it takes a name,
 * an open flag and a way to close, which is all any overlay already has. It began as seventy lines
 * inside one app, carrying three fixes that each cost a bug in production; every app that draws a
 * sheet needs the same seventy lines, so they live here.
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 * useOverlayRoute('cart:picker', open, () => setOpen(false));
 * ```
 *
 * ## Surviving a reload
 *
 * The fragment outlives a refresh, so an app can come back with `#ax=…` naming a sheet. Pass
 * `onRestore` and this hook will call it when it finds its own name already in the URL on mount —
 * the sheet reopens exactly where the shop left it. That only works with a name STABLE across
 * loads: `'cart:picker'` restores, `` `picker:${useId()}` `` cannot, because the id is new every
 * time.
 *
 * An overlay that does not pass `onRestore` is transient, and says so by not claiming its name.
 * Anything left unclaimed is closed by {@link settleOverlayFragment}, so the URL never goes on
 * naming a sheet that is not on screen — which used to cost a whole Back press, the shop pressing
 * it twice to leave one page.
 */
export function useOverlayRoute(
  /**
   * Which overlay this is. Two open sheets must not share a name, or they mistake each other's
   * entry. Make it stable across loads if you want `onRestore` to work.
   */
  name: string,
  open: boolean,
  onClose: () => void,
  options?: {
    /**
     * Called on mount when the URL already names this overlay — a reload with it open. Reopen the
     * sheet here. Omit it and the overlay is treated as transient: its name is cleared instead.
     */
    onRestore?: () => void;
  },
) {
  /*
   * `onClose` is nearly always an inline arrow, so its identity changes on every render of the
   * parent. Held in a ref so the effect below depends on `open` ALONE.
   *
   * Depending on it directly is what broke the first version of this: every parent re-render tore
   * the effect down, the cleanup went back a step, and the sheet dismissed itself about 400ms after
   * opening. It looked like a rendering glitch and was a dependency-array bug.
   */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const restoreRef = useRef(options?.onRestore);
  restoreRef.current = options?.onRestore;

  // ── Reopening after a reload ────────────────────────────────────────────────────────
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!name) return;
    if (restoredRef.current) return;
    restoredRef.current = true;

    /*
     * Ask for the settle from here, so an app gets the right behaviour without knowing the problem
     * exists. It runs once however many overlays mount, and anything on screen has claimed its name
     * by the time it fires.
     */
    settleOverlayFragment();
    if (typeof window === 'undefined') return;
    if (readOverlayFragment() !== name) return;

    const restore = restoreRef.current;
    if (!restore) return;

    /*
     * Claimed BEFORE reopening, not after.
     *
     * The settle that closes unclaimed overlays runs on a timer measured in frames, and a consumer
     * that reopens through state has not finished rendering by then. Claiming first says "this one
     * is spoken for" immediately, so the settle leaves it alone whatever React does next.
     */
    claimOverlay(name);
    restore();
  }, [name]);

  // ── The entry, and the back gesture ────────────────────────────────────────────────
  useEffect(() => {
    /*
     * An empty name is a component saying "not routed", and must do nothing at all.
     *
     * Components that offer this as an optional prop call the hook unconditionally — hooks cannot
     * be called conditionally — so the no-name case is the common one, not an error. Acquiring an
     * entry here would change what Back means in an app that never opted in.
     */
    if (!name || !open || typeof window === 'undefined') return;

    if (readOverlayFragment() !== name) writeOverlayFragment(name, 'push');
    claimOverlay(name);

    const onPop = () => {
      // Our segment is gone from the fragment, so this overlay is no longer the open one.
      if (readOverlayFragment() !== name) closeRef.current();
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      releaseOverlay(name);

      /*
       * Closed by a button rather than by Back: our entry is still on the stack, so take it off, or
       * the next Back press appears to do nothing at all.
       *
       * Deferred by a tick, and only if the entry on top is still OURS. Choosing something inside
       * an overlay usually closes it and pushes a page in the same handler; React runs this cleanup
       * before the push completes, so the immediate version saw its own fragment, queued a step
       * back, and that step landed on the page that had just been pushed — tapping a customer in
       * the search results dismissed the search and went nowhere, every time. `axOverlay` is the
       * marker put on the entry we created; once a page has been pushed the top entry carries the
       * stack's own state instead, which is how "still our overlay" is told from "already moved
       * on".
       */
      const ours = name;
      window.setTimeout(() => {
        const state = window.history.state as { axOverlay?: string } | null;
        if (readOverlayFragment() === ours && state?.axOverlay === ours) window.history.back();
      }, 0);
    };
  }, [name, open]);
}
