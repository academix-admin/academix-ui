/**
 * THE ONLY PLACE THIS LIBRARY TOUCHES `window.history`.
 *
 * Every pop asks the entry log "which entry do I want", because `history.go(-n)` counts positions
 * in the browser's single global list and entries from different stacks interleave — counting your
 * own is a category error. The log can only answer if it knows about every entry, which makes
 * "declare your write" an invariant of the whole mechanism.
 *
 * It was an invariant with nothing enforcing it. Three writers existed; one declared itself and two
 * did not, and the failure is silent, delayed and self-erasing: an undeclared write does not break
 * its own navigation, it renames the entry the log thought it was standing on, so EVERY LATER POP
 * quietly drops to counting — and the next write, unable to find its predecessor, throws the log
 * away and takes the evidence with it. It shipped, and what the shop saw was pressing Back on one
 * tab and arriving on another.
 *
 * So the rule is now structural rather than remembered: `pushState` and `replaceState` appear in
 * this file and nowhere else, and `test/one-writer.test.ts` fails the build if that stops being
 * true. A new writer cannot forget to declare itself, because there is no longer a way to write
 * without going through here.
 */
import {
  currentEpoch,
  currentSerial,
  nextSerial,
  recordWrittenEntry,
} from './persistence';

export type HistoryWriteMode = 'push' | 'replace';

export interface HistoryWrite {
  mode: HistoryWriteMode;
  /** Absolute href to write. Nothing is inferred: the caller has already built the URL it means. */
  href: string;
  /**
   * The nav param this entry represents, for the log's depth lookups. Pass what `?nav=` says at
   * this position — including when the write does not change it (an overlay opening, a tab switch),
   * because the entry still STANDS somewhere and a lookup has to be able to step over it.
   */
  navParam: string | null;
  /**
   * Extra state for the entry. Serial, epoch and `navStack` are added here and must not be passed
   * in — `navStack` comes from `navParam`, so an entry can never disagree with what it was logged
   * as standing on.
   *
   * On a REPLACE this is merged over the existing state, because that is the same entry and
   * another consumer's marker on it is still theirs. On a PUSH it is used as-is: the browser gives
   * a real navigation a fresh null state, and copying the previous entry's forward made every other
   * consumer's marker look as though it belonged here too — a sheet that had written its own id
   * before a page was pushed saw that id on the pushed entry, concluded the entry was its own, and
   * called `history.back()` as it closed, silently discarding the page.
   */
  state?: Record<string, unknown>;
}

/**
 * Write one history entry and tell the log about it.
 *
 * Returns the serial written, or null when nothing was written (no window, or the href is already
 * the current one — a write that changes nothing must not consume a position or a serial).
 */
export function writeHistoryEntry({ mode, href, navParam, state }: HistoryWrite): number | null {
  if (typeof window === 'undefined') return null;
  if (window.location.href === href) return null;

  // Captured BEFORE the write: afterwards `history.state` describes the entry just written, so
  // asking then finds the new serial, which is never in the log yet. Every lookup missed, every
  // write took the "unknown entry" branch, and the log truncated itself to a single record — a log
  // that resets on every write is indistinguishable from no log at all, which is how it behaved.
  const prevSerial = currentSerial();
  const prevNavParam = new URL(window.location.href).searchParams.get('nav');
  const serial = nextSerial();

  /*
   * `navStack` is written from `navParam`, always, and not left to the caller.
   *
   * An entry's own record of where every stack stood is what makes state survive a URL that some
   * other writer rewrites, and what `readAxState` requires before it will call an entry ours. The
   * first version of this funnel let callers pass it in `state`, and the overlay writer — which
   * genuinely does not change any stack — simply did not, so its entries came back unreadable and
   * the log lost its place at every sheet. The caller already tells us the nav param for the log's
   * sake; there is no case where the entry should disagree with it.
   */
  const ax = { navStack: navParam, axSerial: serial, axEpoch: currentEpoch() };

  if (mode === 'push') {
    window.history.pushState({ ...(state ?? {}), ...ax }, '', href);
  } else {
    window.history.replaceState(
      { ...(window.history.state ?? {}), ...(state ?? {}), ...ax },
      '',
      href,
    );
  }

  recordWrittenEntry(prevSerial, serial, navParam, mode, prevNavParam);
  return serial;
}
