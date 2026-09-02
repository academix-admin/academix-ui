/**
 * Overlay state lives in the URL fragment, not the query string.
 *
 * WHY THE FRAGMENT
 *  - A fragment write never round-trips to the server, so an overlay opening cannot trigger a
 *    server render the way a query-param change can.
 *  - Page state (`?nav=`) and ephemeral overlay state stay cleanly separated: reading one never
 *    requires parsing the other.
 *  - Each open becomes a real history entry, which is what lets the platform's own back gesture
 *    close an overlay — so our swipe-back only has to cover platforms with no native gesture,
 *    instead of competing with one.
 *
 * WHY IT IS NOT JUST `location.hash = ...`
 * The fragment is not ours. `#section-3` deep links, docs anchors and `scrollIntoView` targets are
 * ordinary site behaviour, and stomping the whole fragment would break them. This codec owns
 * exactly ONE `&`-separated segment (`ax=…`) and passes every other segment through untouched, in
 * its original order and position.
 *
 * The parse/build pair is pure so the awkward cases — foreign-only, ours-only, both in either
 * order, removal, values containing `&`/`=` — are testable without a DOM.
 */

/** The single fragment segment this package owns. */
export const OVERLAY_FRAGMENT_KEY = 'ax';

export type ParsedFragment = {
  /** Decoded value of our segment, or null when absent. */
  ours: string | null;
  /** Every other segment, verbatim and in original order. */
  foreign: string[];
};

export function parseFragment(raw: string | null | undefined): ParsedFragment {
  const s = (raw ?? '').replace(/^#/, '');
  if (!s) return { ours: null, foreign: [] };

  const foreign: string[] = [];
  let ours: string | null = null;

  for (const seg of s.split('&')) {
    if (!seg) continue;
    if (seg === OVERLAY_FRAGMENT_KEY || seg.startsWith(`${OVERLAY_FRAGMENT_KEY}=`)) {
      // Last one wins, matching how query params are normally treated.
      const eq = seg.indexOf('=');
      const rawVal = eq === -1 ? '' : seg.slice(eq + 1);
      try {
        ours = decodeURIComponent(rawVal);
      } catch {
        ours = rawVal; // malformed percent-encoding: take it literally rather than throw
      }
    } else {
      foreign.push(seg);
    }
  }

  return { ours, foreign };
}

/**
 * Rebuild a fragment. Foreign segments keep their order and come first, so a plain `#section`
 * link still looks like `#section` to anything that reads it.
 * Returns '' (not '#') when empty, so the caller can drop the fragment entirely.
 */
export function buildFragment(ours: string | null, foreign: string[]): string {
  const segs = [...foreign];
  if (ours != null && ours !== '') {
    segs.push(`${OVERLAY_FRAGMENT_KEY}=${encodeURIComponent(ours)}`);
  }
  return segs.join('&');
}

/** Replace only our segment in a fragment string, leaving everything else alone. */
export function setInFragment(raw: string | null | undefined, ours: string | null): string {
  const { foreign } = parseFragment(raw);
  return buildFragment(ours, foreign);
}

// ---------------------------------------------------------------------------
// DOM wrappers
