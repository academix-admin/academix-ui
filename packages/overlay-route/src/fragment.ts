import { parseFragment, setInFragment } from './fragment-codec';
import { isOverlayClaimed } from './claims';
import { writeOverlayHistory } from './writer';

/** The overlay named in the URL right now, or null. */
export function readOverlayFragment(): string | null {
  if (typeof window === 'undefined') return null;
  return parseFragment(window.location.hash).ours;
}

/**
 * Write our fragment segment.
 *
 * `push` creates a history entry, which is what makes the platform's back gesture close the
 * overlay. `replace` is for corrections that should not be independently reversible — syncing after
 * the overlay was closed by other means.
 *
 * Uses the history writer rather than assigning `location.hash`, because assigning always pushes:
 * there would be no way to express a replace, and it would fire `hashchange` as well.
 */
export function writeOverlayFragment(ours: string | null, mode: 'push' | 'replace' = 'push'): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.hash = setInFragment(url.hash, ours); // URL drops the '#' by itself when this is ''
    const href = url.toString();
    if (href === window.location.href) return;

    writeOverlayHistory({ mode, href, state: { axOverlay: ours } });
  } catch {
    /* URL parsing/history can throw in exotic embedders; overlay state is not worth crashing for */
  }
}

/**
 * Close an overlay the URL still names but nothing put back.
 *
 * A fragment survives a reload — that is most of the point of keeping overlay state there — so an
 * app comes back up with `#ax=…` naming a sheet, standing on that sheet's own history entry. If
 * nothing restores the sheet, the URL claims something the screen is not showing, and the next Back
 * spends itself closing it: leaving one page takes two presses, which is exactly how a web app
 * stops feeling like a real one.
 *
 * Nothing to configure — {@link settleOverlayFragment} runs this automatically once the app has had
 * its first frames, and anything actually on screen has claimed its name by then and is left alone.
 * Exported for the app that wants to say "now", and for tests.
 *
 * Two shapes, because there are two ways a fragment gets onto an entry:
 *  - the overlay PUSHED its own entry (`axOverlay` on it) — step off it, which is exactly what
 *    closing that overlay would have done, so Back means "leave the page" again;
 *  - the fragment was merely REPLACED onto a page's entry — there is nothing to step off, so clear
 *    our segment and leave the entry where it is.
 */
export function closeUnrestoredOverlay(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const named = parseFragment(window.location.hash).ours;
    if (named === null) return false;
    if (isOverlayClaimed(named)) return false; // somebody is showing it; leave it alone

    const state = window.history.state as { axOverlay?: string | null } | null;
    const isOverlaysOwnEntry = Boolean(state && 'axOverlay' in state && state.axOverlay);

    if (isOverlaysOwnEntry && window.history.length > 1) {
      window.history.back();
      return true;
    }

    writeOverlayFragment(null, 'replace');
    return true;
  } catch {
    return false;
  }
}

/**
 * Settle the fragment once, after the app's first frames.
 *
 * `useOverlayRoute` schedules this on mount, so an app gets the right behaviour without knowing
 * this exists — which is the point. An overlay that restores itself claims its name during mount
 * and survives; one that nothing restores is closed.
 *
 * TWO ANIMATION FRAMES AND A TIMER, and the honesty about why: there is no signal meaning "the app
 * has finished deciding which overlays are open". A consumer restoring through React state needs at
 * least a commit, and a child mounting after its parent needs another. Two frames covers both and
 * still lands well inside the time a hand takes to reach the Back button. The timer is the fallback
 * for a document that is not painting at all — a background tab, a reduced-motion embedder — where
 * `requestAnimationFrame` may never fire.
 *
 * Idempotent: the first call wins, so a dozen sheets mounting do not queue a dozen settles.
 */
let _settleScheduled = false;

export function settleOverlayFragment(): void {
  if (typeof window === 'undefined' || _settleScheduled) return;
  if (parseFragment(window.location.hash).ours === null) return; // nothing named; nothing to do
  _settleScheduled = true;

  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    closeUnrestoredOverlay();
  };

  const raf =
    typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (fn: FrameRequestCallback) => window.setTimeout(() => fn(0), 16);

  raf(() => raf(() => run()));
  window.setTimeout(run, 250);
}

/** Let a new document (or a test) schedule a settle again. */
export function resetOverlaySettle(): void {
  _settleScheduled = false;
}
