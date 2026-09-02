/**
 * A serial only means something inside the document that issued it.
 *
 * The counter starts at 0 on every page load, but the browser's history entries survive a reload
 * with the serials they were given. So after a reload, entry 3 from before and entry 3 from after
 * answer to the same name — and the log, which is keyed by serial, cannot tell them apart. Going
 * Back onto an old entry then makes the log believe it is standing somewhere it is not, and hand
 * out a delta with confidence.
 *
 * That is the one outcome this mechanism must never produce. A log that says "I do not know" falls
 * back to counting and is merely sometimes short; a log that is confidently wrong sends the shop to
 * another tab. Entries from a previous load must therefore be unrecognisable, not misrecognised.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetEntryLog,
  recordWrittenEntry,
  currentSerial,
  findBackDeltaForDepth,
  nextSerial,
  readAxState,
  currentEpoch,
} from '../src/core/persistence';

describe('serials do not survive the document that issued them', () => {
  beforeEach(() => {
    resetEntryLog();
    window.history.replaceState({}, '', '/app');
  });

  it('does not mistake a previous load’s entry for one of its own', () => {
    // This document's log: three entries, the oldest with the stack at its root.
    const s1 = nextSerial();
    const s2 = nextSerial();
    const s3 = nextSerial();
    recordWrittenEntry(null, s1, 'stock:1.a1', 'replace');
    recordWrittenEntry(s1, s2, 'stock:1.a1.b1', 'push');
    recordWrittenEntry(s2, s3, 'stock:1.a1.b1.c1', 'push');

    /*
     * Now the browser puts us on an entry from BEFORE the reload. It carries a serial this
     * document has also issued — that is the whole point — but it is not the entry the log means
     * by that number.
     */
    window.history.replaceState({ navStack: 'other:1.a1', axSerial: s2 }, '', '/app');

    expect(
      currentSerial(),
      'an entry from another load must not answer to this load’s numbering',
    ).toBeNull();
    expect(
      findBackDeltaForDepth('stock', 1),
      'and with no idea where it stands, the log must say so rather than guess',
    ).toBeNull();
  });

  it('still reads a previous load’s navStack, which is how state survives a reload', () => {
    /*
     * The other half, and the reason this is not simply "reject foreign entries". An entry written
     * before a reload still carries a truthful record of where every stack stood, and reading it
     * is exactly how Back after a refresh restores the page. Only the log's IDENTITY question
     * changes; the state remains readable.
     */
    const state = { navStack: 'stock:1.a1.b1', axSerial: 7 };
    expect(readAxState(state)?.navStack, 'the paths are still readable').toBe('stock:1.a1.b1');
  });

  it('recognises an entry this document wrote', () => {
    const s = nextSerial();
    recordWrittenEntry(null, s, 'stock:1.a1', 'replace');
    // Written the way the library writes them, epoch included.
    window.history.replaceState(
      { ...(window.history.state ?? {}), navStack: 'stock:1.a1', axSerial: s, axEpoch: currentEpoch() },
      '',
      '/app',
    );
    expect(currentSerial(), 'our own entry must still be found').toBe(s);
  });
});
