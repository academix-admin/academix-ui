/**
 * Step 3 — fragment codec.
 *
 * The risk here is not "does it store a value" but "does it destroy someone else's #anchor".
 * These cases are all the ways that can go wrong.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseFragment,
  buildFragment,
  setInFragment,
  readOverlayFragment,
  writeOverlayFragment,
  OVERLAY_FRAGMENT_KEY,
} from '../src/overlay/hash';

describe('fragment parsing', () => {
  it('handles an empty/absent fragment', () => {
    expect(parseFragment(undefined)).toEqual({ ours: null, foreign: [] });
    expect(parseFragment('')).toEqual({ ours: null, foreign: [] });
    expect(parseFragment('#')).toEqual({ ours: null, foreign: [] });
  });

  it('treats an ordinary anchor as foreign and reports no overlay', () => {
    expect(parseFragment('#section-3')).toEqual({ ours: null, foreign: ['section-3'] });
  });

  it('reads our segment', () => {
    expect(parseFragment('#ax=g1%3Asheet')).toEqual({ ours: 'g1:sheet', foreign: [] });
  });

  it('reads ours while keeping foreign segments, in either order', () => {
    expect(parseFragment('#section-3&ax=sheet')).toEqual({ ours: 'sheet', foreign: ['section-3'] });
    expect(parseFragment('#ax=sheet&section-3')).toEqual({ ours: 'sheet', foreign: ['section-3'] });
  });

  it('survives malformed percent-encoding instead of throwing', () => {
    expect(() => parseFragment('#ax=%E0%A4%A')).not.toThrow();
    expect(parseFragment('#ax=%E0%A4%A').ours).toBe('%E0%A4%A');
  });

  it('round-trips values containing & and =', () => {
    const tricky = 'a=1&b=2';
    const frag = buildFragment(tricky, []);
    expect(parseFragment(frag).ours).toBe(tricky);
  });
});

describe('fragment building', () => {
  it('returns an empty string (not "#") when there is nothing to write', () => {
    expect(buildFragment(null, [])).toBe('');
    expect(buildFragment('', [])).toBe('');
  });

  it('puts foreign segments first so a plain anchor still looks like one', () => {
    expect(buildFragment('sheet', ['section-3'])).toBe(`section-3&${OVERLAY_FRAGMENT_KEY}=sheet`);
  });

  it('preserves the order of multiple foreign segments', () => {
    expect(buildFragment(null, ['a', 'b', 'c'])).toBe('a&b&c');
  });
});

describe('setInFragment — the anchor-safety guarantee', () => {
  it('adds our segment without touching an existing anchor', () => {
    expect(setInFragment('#section-3', 'sheet')).toBe(`section-3&${OVERLAY_FRAGMENT_KEY}=sheet`);
  });

  it('REMOVES only our segment and leaves the anchor intact', () => {
    expect(setInFragment('#section-3&ax=sheet', null)).toBe('section-3');
  });

  it('leaves a foreign-only fragment completely unchanged when clearing', () => {
    expect(setInFragment('#section-3', null)).toBe('section-3');
  });

  it('replaces our value without duplicating the segment', () => {
    const once = setInFragment('#ax=one', 'two');
    expect(once).toBe(`${OVERLAY_FRAGMENT_KEY}=two`);
    expect(once.split('&').filter((s) => s.startsWith('ax=')).length).toBe(1);
  });

  it('clears to empty when only our segment was present', () => {
    expect(setInFragment('#ax=sheet', null)).toBe('');
  });
});

describe('DOM wrappers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/app');
    vi.restoreAllMocks();
  });

  it('writes and reads back through the real URL', () => {
    writeOverlayFragment('sheet');
    expect(window.location.hash).toContain(`${OVERLAY_FRAGMENT_KEY}=sheet`);
    expect(readOverlayFragment()).toBe('sheet');
  });

  it('push creates a history entry; replace does not', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');

    writeOverlayFragment('a', 'push');
    expect(push).toHaveBeenCalledTimes(1);

    writeOverlayFragment('b', 'replace');
    expect(push).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalled();
  });

  it('does not write when nothing would change', () => {
    writeOverlayFragment('same');
    const push = vi.spyOn(window.history, 'pushState');
    writeOverlayFragment('same');
    expect(push).not.toHaveBeenCalled();
  });

  it('preserves a real anchor across open and close', () => {
    window.history.replaceState({}, '', '/app#section-3');
    writeOverlayFragment('sheet');
    expect(window.location.hash).toBe('#section-3&ax=sheet');

    writeOverlayFragment(null);
    expect(window.location.hash).toBe('#section-3');
    expect(readOverlayFragment()).toBeNull();
  });
});
