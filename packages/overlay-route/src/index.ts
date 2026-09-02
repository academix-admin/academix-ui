/**
 * `@academix-admin/overlay-route`
 *
 * A sheet, picker or dialog that gets its own history entry, so the platform's own Back closes the
 * OVERLAY rather than the page under it.
 *
 * Without one, Back with a picker open closes the picker AND leaves the page behind it: measured in
 * a real shop, the back gesture walked straight out of a half-built sale. Every app that draws a
 * sheet needs the same handful of rules, and each one here was paid for with a bug — closing on the
 * wrong tick, dismissing itself 400ms after opening, discarding a page that had just been pushed.
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 * useOverlayRoute('cart:picker', open, () => setOpen(false));
 * ```
 *
 * ## Working alongside a navigation library
 *
 * An overlay's entry is a real entry, and a navigation library that pops pages with
 * `history.go(-n)` has to count it — `go` counts positions in the browser's global list, so an
 * entry it does not know about leaves every later pop short by one. Neither package should have to
 * know the other exists, so they meet at one function: a navigation library calls
 * {@link setHistoryWriter} on import and this package routes its writes through it. Nothing
 * registers? The default writer is used and everything here still works; there is simply no ledger
 * to join.
 *
 * ## Owning one segment of the fragment, and no more
 *
 * State lives in the URL fragment because a fragment write never reaches the server, so opening a
 * sheet cannot trigger a server render. The fragment is not ours, though — `#section-3` deep links
 * and `scrollIntoView` anchors are ordinary site behaviour — so this owns exactly one
 * `&`-separated `ax=` segment and passes every other one through untouched, in its original order.
 */
export { useOverlayRoute } from './use-overlay-route';

export {
  readOverlayFragment,
  writeOverlayFragment,
  closeUnrestoredOverlay,
  settleOverlayFragment,
  resetOverlaySettle,
} from './fragment';

export {
  claimOverlay,
  releaseOverlay,
  isOverlayClaimed,
  overlayClaims,
  resetOverlayClaims,
} from './claims';

export {
  OVERLAY_FRAGMENT_KEY,
  parseFragment,
  buildFragment,
  setInFragment,
} from './fragment-codec';
export type { ParsedFragment } from './fragment-codec';

export { setHistoryWriter, hasExternalHistoryWriter } from './writer';
export type { OverlayHistoryWrite, OverlayHistoryWriter } from './writer';
