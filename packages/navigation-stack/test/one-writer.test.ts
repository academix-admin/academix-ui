/**
 * There is exactly one place this library writes history.
 *
 * Not a style rule. The entry log can only answer "which entry do I want" if it knows about every
 * entry, and a write that does not declare itself does not break its own navigation — it renames
 * the entry the log believed it was standing on, so every LATER pop silently drops to counting,
 * and the next write then throws the log away and takes the evidence with it. That is how two
 * undeclared writers shipped, and what the shop saw was pressing Back on one tab and arriving on
 * another.
 *
 * A comment asking future writers to remember is worth nothing against a failure that quiet. This
 * fails the build instead.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = join(__dirname, '..', 'src');

/** The one module allowed to call them, plus the legacy tree, which is dead and not built. */
const ALLOWED = ['core/history-writer.ts'];
const IGNORED_DIRS = ['_legacy'];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (IGNORED_DIRS.includes(name)) continue;
      walk(full, out);
    } else if (/\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe('one history writer', () => {
  it('nothing outside core/history-writer.ts calls pushState or replaceState', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
      const rel = relative(SRC, file).split(sep).join('/');
      if (ALLOWED.includes(rel)) continue;

      const source = readFileSync(file, 'utf8');
      source.split('\n').forEach((line, i) => {
        // Comments explaining the rule are fine; calls are not.
        const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
        if (/history\s*\.\s*(pushState|replaceState)\s*\(/.test(code)) {
          offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
        }
      });
    }

    expect(
      offenders,
      [
        'These write history without declaring the entry to the log.',
        'Route them through writeHistoryEntry() in core/history-writer.ts —',
        'an undeclared write disables the log for every pop that follows it.',
        '',
        ...offenders,
      ].join('\n'),
    ).toEqual([]);
  });

  it('and the writer itself still declares what it writes', () => {
    const writer = readFileSync(join(SRC, 'core', 'history-writer.ts'), 'utf8');
    expect(
      /recordWrittenEntry\(/.test(writer),
      'the one writer must record every entry it writes, or the log knows nothing at all',
    ).toBe(true);
  });
});
