// Writes test/public-api.test.ts for every package that has none, from what its built entry exports
// today. Run once (13 Nov); after that a lock is changed by hand, on purpose, with a changeset.
//
//   npm run build && node scripts/write-api-locks.mjs
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../packages/', import.meta.url));

for (const dir of readdirSync(root).sort()) {
  const base = `${root}${dir}/`;
  if (!existsSync(`${base}package.json`) || existsSync(`${base}test/public-api.test.ts`)) continue;
  const dist = `${base}dist/index.js`;
  if (!existsSync(dist)) {
    console.log(`${dir}: not built, skipped`);
    continue;
  }
  const mod = await import(pathToFileURL(dist).href);
  const names = Object.keys(mod).filter((k) => k !== 'default').sort();
  const hasDefault = 'default' in mod;

  // A package with no test setup gets the shared one (vitest + jsdom + jest-dom).
  const pkgPath = `${base}package.json`;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts?.test) {
    pkg.scripts = { ...pkg.scripts, test: 'vitest run', 'test:watch': 'vitest' };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
  mkdirSync(`${base}test`, { recursive: true });
  if (!existsSync(`${base}vitest.config.ts`)) copyFileSync(`${root}sidebar/vitest.config.ts`, `${base}vitest.config.ts`);
  if (!existsSync(`${base}test/setup.ts`)) copyFileSync(`${root}sidebar/test/setup.ts`, `${base}test/setup.ts`);

  const list = names.map((n) => `  '${n}',`).join('\n');
  writeFileSync(
    `${base}test/public-api.test.ts`,
    `/**
 * THE PUBLIC SURFACE, LOCKED. Apps outside this repo import these names, so removing or renaming one
 * breaks them whether anybody meant it to or not, and no other test here would notice. Adding one is a
 * decision too: a consumer, a README entry, a changeset. Either way this list changes on purpose.
 */
import { describe, it, expect } from 'vitest';
import * as api from '../src/index';

const PUBLIC_EXPORTS = [
${list}
];

describe('public API', () => {
  it('exports exactly these names', () => {
    expect(Object.keys(api).filter((k) => k !== 'default').sort()).toEqual([...PUBLIC_EXPORTS].sort());
  });
${hasDefault ? `
  it('keeps its default export', () => {
    expect((api as { default?: unknown }).default).toBeDefined();
  });
` : ''}});
`,
  );
  console.log(`${dir}: locked ${names.length} name(s)${hasDefault ? ' + default' : ''}`);
}
