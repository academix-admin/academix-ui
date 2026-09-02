/**
 * Which overlays say they are actually on screen.
 *
 * The URL fragment records that a sheet was open; it cannot record whether one IS. Those come
 * apart on a reload — the fragment survives, the sheet does not, unless something puts it back —
 * and the gap is expensive: the app stands on the sheet's own history entry with the URL claiming
 * it is open, so the next Back spends itself closing something that is not there and leaving one
 * page takes two presses. That is the difference between a web app and a real one.
 *
 * The library cannot work this out alone. It has no way to tell an overlay that nothing will
 * restore from one whose consumer is a render away from restoring it, and a guess either strands
 * the URL or snatches a sheet away as it appears. So overlays SAY: anything on screen claims its
 * name, and {@link settleOverlayFragment} closes whatever is left unclaimed once the app has had
 * its first frames.
 */

const _claims = typeof window !== 'undefined' ? new Set<string>() : null;

/** Say this overlay is on screen. Safe to call repeatedly. */
export function claimOverlay(name: string): void {
  _claims?.add(name);
}

/** Say it is gone. */
export function releaseOverlay(name: string): void {
  _claims?.delete(name);
}

export function isOverlayClaimed(name: string): boolean {
  return Boolean(_claims?.has(name));
}

/** Everything currently claiming to be on screen. Exposed for devtools and tests. */
export function overlayClaims(): string[] {
  return _claims ? Array.from(_claims) : [];
}

export function resetOverlayClaims(): void {
  _claims?.clear();
}
