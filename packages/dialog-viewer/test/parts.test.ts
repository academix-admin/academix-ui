/**
 * THE PARTS ARE PUBLIC. Apps style these class names (README, "Styling the parts"), so renaming or
 * dropping one breaks them silently — no type error, just an unstyled screen. This fails first.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PARTS = ['dialog-overlay', 'dialog-container', 'dialog-header', 'dialog-title', 'dialog-content', 'dialog-message', 'dialog-actions', 'dialog-button'];

function source(dir: string): string {
  return readdirSync(dir)
    .map((f) => join(dir, f))
    .map((p) => (statSync(p).isDirectory() ? source(p) : /\.(tsx?|css)$/.test(p) ? readFileSync(p, 'utf8') : ''))
    .join('\n');
}

describe('styling the parts', () => {
  const src = source(join(__dirname, '..', 'src'));
  it.each(PARTS)('still draws .%s', (part) => {
    expect(src).toMatch(new RegExp(`["'\`\\s.]${part}(?![\\w-])`));
  });
});
