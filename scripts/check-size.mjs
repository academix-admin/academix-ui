// WHAT EACH PACKAGE COSTS A PHONE (13 Nov). The apps built on these run on phones on weak data, so a
// package that grows is a cost every user pays on first load. Each package's built entry, gzipped,
// against `size-budgets.json`; a package over its budget fails. Raising a budget is a decision, made in
// that file, in the same change that needs it.
//
//   npm run build && node scripts/check-size.mjs            # check
//   node scripts/check-size.mjs --write                       # set budgets to today's size + 10%
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const budgetsFile = `${root}size-budgets.json`;
const write = process.argv.includes('--write');
const budgets = existsSync(budgetsFile) ? JSON.parse(readFileSync(budgetsFile, 'utf8')) : {};
const next = {};
let over = 0;

for (const dir of readdirSync(`${root}packages`).sort()) {
  const dist = `${root}packages/${dir}/dist/index.js`;
  if (!existsSync(`${root}packages/${dir}/package.json`) || !existsSync(dist)) continue;
  const gz = gzipSync(readFileSync(dist)).length;
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const budget = budgets[dir];
  next[dir] = Math.ceil((gz * 1.1) / 512) * 512;
  const status = budget == null ? 'no budget' : gz > budget ? `OVER by ${kb(gz - budget)}` : `${Math.round((gz / budget) * 100)}% of ${kb(budget)}`;
  if (budget != null && gz > budget) over += 1;
  console.log(`${dir.padEnd(20)} ${kb(gz).padStart(9)} gz   ${status}`);
}

if (write) {
  writeFileSync(budgetsFile, JSON.stringify(next, null, 2) + '\n');
  console.log(`\nwrote ${budgetsFile}`);
} else if (over) {
  console.log(`\n${over} package(s) over budget`);
  process.exit(1);
} else {
  console.log('\nEvery package within its budget.');
}
