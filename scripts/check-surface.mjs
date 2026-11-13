// THE PUBLIC SURFACE, CHECKED (13 Nov). For every package: what its built entry exports, whether a
// test locks that list (test/public-api.test.ts), and whether its README names each export. A README
// that does not mention an export is a library bug (the Library Charter): nobody can use what is not
// documented, and USAGE_PATTERN.md exists because several READMEs had drifted from the code.
//
//   npm run build && node scripts/check-surface.mjs          # report
//   node scripts/check-surface.mjs --strict                   # exit 1 on any gap (CI)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const strict = process.argv.includes('--strict');
const root = new URL('../packages/', import.meta.url);
let gaps = 0;

for (const dir of readdirSync(root).sort()) {
  const base = new URL(`${dir}/`, root);
  const pkgFile = new URL('package.json', base);
  if (!existsSync(pkgFile)) continue;
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const dist = new URL('dist/index.js', base);
  if (!existsSync(dist)) {
    console.log(`${dir.padEnd(20)} not built`);
    gaps += 1;
    continue;
  }
  const keys = Object.keys(await import(pathToFileURL(new URL(dist).pathname.replace(/^\/([A-Za-z]:)/, '$1')).href)).filter((k) => k !== 'default');
  const readmeFile = new URL('README.md', base);
  const readme = existsSync(readmeFile) ? readFileSync(readmeFile, 'utf8') : '';
  const undocumented = keys.filter((k) => !new RegExp(`\\b${k}\\b`).test(readme));
  const locked = existsSync(new URL('test/public-api.test.ts', base));
  const line = `${dir.padEnd(20)} ${String(pkg.version).padEnd(8)} exports ${String(keys.length).padStart(3)}  locked ${locked ? 'yes' : 'NO '}  undocumented ${undocumented.length}`;
  console.log(undocumented.length ? `${line}  [${undocumented.join(', ')}]` : line);
  if (!locked) gaps += 1;
  gaps += undocumented.length;
}

console.log(gaps ? `\n${gaps} gap(s)` : '\nEvery export is locked by a test and named in its README.');
if (strict && gaps) process.exit(1);
