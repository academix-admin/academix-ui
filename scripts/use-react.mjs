// Point every workspace package's react / react-dom devDependency at one version, so CI can run
// the whole suite against another React major (the React 19 job in .github/workflows/ci.yml).
// It rewrites package.json files in the CI checkout only; the committed pins stay on React 18.
//
//   node scripts/use-react.mjs 19.3.0 && npm install --no-audit --no-fund
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('usage: node scripts/use-react.mjs <react version>');
  process.exit(1);
}

let changed = 0;
for (const dir of readdirSync('packages')) {
  const file = join('packages', dir, 'package.json');
  if (!existsSync(file)) continue;
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  let touched = false;
  for (const name of ['react', 'react-dom']) {
    if (pkg.devDependencies?.[name]) {
      pkg.devDependencies[name] = version;
      changed += 1;
      touched = true;
    }
  }
  if (touched) writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
}

// One React for the whole tree. Without this, React 18 stays hoisted at the root (motion pulls it
// in as a peer), @testing-library/react renders with that react-dom, and every component test
// fails with "Invalid hook call": two Reacts, not a library bug.
const root = JSON.parse(readFileSync('package.json', 'utf8'));
root.devDependencies = { ...root.devDependencies, react: version, 'react-dom': version };
root.overrides = { ...root.overrides, react: version, 'react-dom': version };
writeFileSync('package.json', JSON.stringify(root, null, 2) + '\n');

console.log(`react/react-dom set to ${version} in ${changed} package devDependency entries, the root, and overrides`);
