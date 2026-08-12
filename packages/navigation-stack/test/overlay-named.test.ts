/**
 * Step 4 — named overlays.
 *
 * parseOverlays consumes the URL bar, i.e. untrusted, hand-editable, truncatable input. Most of
 * these cases are about it refusing to throw or to smuggle unexpected shapes into props.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerOverlayFactory,
  getOverlayFactory,
  clearOverlayFactories,
  serializeOverlays,
  parseOverlays,
  descriptorId,
} from '../src/overlay/named';

describe('factory registry', () => {
  beforeEach(() => clearOverlayFactories());

  it('registers and resolves a factory', () => {
    registerOverlayFactory('sheet', () => () => null);
    expect(getOverlayFactory('sheet')).toBeTypeOf('function');
    expect(getOverlayFactory('missing')).toBeUndefined();
  });

  it('unregisters via the returned disposer', () => {
    const off = registerOverlayFactory('sheet', () => () => null);
    off();
    expect(getOverlayFactory('sheet')).toBeUndefined();
  });
});

describe('serialize / parse round-trip', () => {
  it('round-trips without params', () => {
    const d = [{ scope: 'g1', key: 'sheet' }];
    expect(parseOverlays(serializeOverlays(d))).toEqual(d);
  });

  it('round-trips with params', () => {
    const d = [{ scope: 'g1', key: 'sheet', params: { id: 5, open: true, name: 'x' } }];
    expect(parseOverlays(serializeOverlays(d))).toEqual(d);
  });

  it('round-trips several overlays in order', () => {
    const d = [
      { scope: 'g1', key: 'a' },
      { scope: 'stack2', key: 'b', params: { n: 1 } },
    ];
    expect(parseOverlays(serializeOverlays(d))).toEqual(d);
  });

  it('serializes empty to an empty string, not "[]"', () => {
    expect(serializeOverlays([])).toBe('');
    expect(parseOverlays('')).toEqual([]);
  });
});

describe('parseOverlays is hostile-input safe', () => {
  it('returns [] for junk rather than throwing', () => {
    expect(() => parseOverlays('not json')).not.toThrow();
    expect(parseOverlays('not json')).toEqual([]);
    expect(parseOverlays(null)).toEqual([]);
    expect(parseOverlays(undefined)).toEqual([]);
  });

  it('returns [] when the payload is truncated mid-JSON', () => {
    const full = serializeOverlays([{ scope: 'g1', key: 'sheet', params: { id: 1 } }]);
    expect(parseOverlays(full.slice(0, full.length - 4))).toEqual([]);
  });

  it('ignores a non-array payload', () => {
    expect(parseOverlays('{"scope":"g1"}')).toEqual([]);
    expect(parseOverlays('"a string"')).toEqual([]);
    expect(parseOverlays('42')).toEqual([]);
  });

  it('drops malformed entries but keeps the valid ones', () => {
    const raw = JSON.stringify([
      ['g1', 'good'],
      ['g1'],                 // too short
      [123, 'bad-scope'],     // non-string scope
      ['g2', ''],             // empty key
      ['g3', 'alsogood', { a: 1 }],
    ]);
    expect(parseOverlays(raw)).toEqual([
      { scope: 'g1', key: 'good' },
      { scope: 'g3', key: 'alsogood', params: { a: 1 } },
    ]);
  });

  it('strips non-primitive params so a crafted URL cannot smuggle shapes into props', () => {
    const raw = JSON.stringify([['g1', 'sheet', { ok: 1, nested: { evil: true }, arr: [1, 2], fn: null }]]);
    expect(parseOverlays(raw)).toEqual([{ scope: 'g1', key: 'sheet', params: { ok: 1 } }]);
  });

  it('drops a params object that leaves nothing usable', () => {
    const raw = JSON.stringify([['g1', 'sheet', { nested: { a: 1 } }]]);
    expect(parseOverlays(raw)).toEqual([{ scope: 'g1', key: 'sheet' }]);
  });
});

describe('descriptorId', () => {
  it('is stable for the same key, so reopening does not stack duplicates', () => {
    expect(descriptorId({ scope: 'g1', key: 'sheet' }))
      .toBe(descriptorId({ scope: 'g1', key: 'sheet', params: { a: 1 } }));
  });
});
