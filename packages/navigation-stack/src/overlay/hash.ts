/**
 * Overlay routing, provided by `@academix-admin/overlay-route`, with this library's ledger behind
 * it.
 *
 * ## Why the capability lives in another package
 *
 * A sheet needing its own history entry is not a navigation-stack problem — it is every app's
 * problem, including apps with no navigation library at all. Keeping it here would have meant that
 * anyone who wanted a back-closable bottom sheet had to take a router with it, and that the four
 * viewer packages in this project could only have the capability by depending on this one.
 *
 * ## What this file adds
 *
 * The one thing only this library can: an overlay's entry is a real history entry, and every pop
 * here asks the entry log which entry it wants, because `history.go(-n)` counts positions in the
 * browser's single global list. An entry the log has never heard of leaves every later pop short by
 * one — measured, in an app using both: one picker opened anywhere in a journey and a Back press
 * landed on another tab's page with that picker's fragment restored into the URL.
 *
 * So this registers our writer with overlay-route on import. Neither package imports the other's
 * internals; they meet at one function. An app using overlay-route WITHOUT this library still gets
 * a working back gesture — it simply has no ledger to join.
 */
import { setHistoryWriter } from '@academix-admin/overlay-route';
import { writeHistoryEntry } from '../core/history-writer';

setHistoryWriter(({ mode, href, state }) => {
  writeHistoryEntry({
    mode,
    href,
    /*
     * Carried across unchanged, and truthfully: an overlay opening moves no stack, so this entry
     * stands exactly where the one before it did. A depth lookup steps over it — right, it is not
     * a target — while it still counts towards the distance a `go(-n)` has to travel.
     */
    navParam:
      typeof window === 'undefined'
        ? null
        : new URL(window.location.href).searchParams.get('nav'),
    state,
  });
});

export {
  OVERLAY_FRAGMENT_KEY,
  parseFragment,
  buildFragment,
  setInFragment,
  readOverlayFragment,
  writeOverlayFragment,
  closeUnrestoredOverlay,
  settleOverlayFragment,
  resetOverlaySettle,
  claimOverlay,
  releaseOverlay,
  isOverlayClaimed,
  overlayClaims,
  resetOverlayClaims,
  useOverlayRoute,
} from '@academix-admin/overlay-route';
export type { ParsedFragment } from '@academix-admin/overlay-route';
