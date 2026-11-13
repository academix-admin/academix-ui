/**
 * THE PUBLIC SURFACE, LOCKED. Apps outside this repo import these names, so removing or renaming one
 * breaks them whether anybody meant it to or not, and no other test here would notice. Adding one is a
 * decision too: a consumer, a README entry, a changeset. Either way this list changes on purpose.
 */
import { describe, it, expect } from 'vitest';
import * as api from '../src/index';

const PUBLIC_EXPORTS = [
  'Keypad',
  'PinInput',
];

describe('public API', () => {
  it('exports exactly these names', () => {
    expect(Object.keys(api).filter((k) => k !== 'default').sort()).toEqual([...PUBLIC_EXPORTS].sort());
  });
});
