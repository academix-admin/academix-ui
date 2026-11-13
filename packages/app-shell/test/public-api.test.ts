/**
 * THE PUBLIC SURFACE, locked. Adding an export is a decision (a consumer, a README entry, a changeset);
 * removing one breaks somebody. Either way this test has to be changed on purpose.
 */
import { describe, it, expect } from 'vitest';
import * as api from '../src';

const PUBLIC_EXPORTS = ['AppShell', 'useAppShell', 'useAppShellBar'];

describe('public API', () => {
  it('exports exactly what the README documents', () => {
    expect(Object.keys(api).sort()).toEqual([...PUBLIC_EXPORTS].sort());
  });
});
