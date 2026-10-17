// Build every workspace package in dependency order: a package builds only after the
// @academix-admin packages it imports. `npm run build --workspaces` goes alphabetically, so on a
// clean checkout (every CI run) bottom-viewer's type build ran before overlay-route had a dist/,
// and CI failed on every run since it was added.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const packages = new Map();
for (const dir of readdirSync('packages')) {
  const file = join('packages', dir, 'package.json');
  if (!existsSync(file)) continue;
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  if (pkg.scripts?.build) packages.set(pkg.name, pkg);
}

const internalDeps = (pkg) =>
  Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.devDependencies })
    .filter((name) => packages.has(name));

const order = [];
const state = new Map();
function visit(name, path) {
  if (state.get(name) === 'done') return;
  if (state.get(name) === 'visiting') {
    throw new Error(`dependency cycle: ${[...path, name].join(' -> ')}`);
  }
  state.set(name, 'visiting');
  for (const dep of internalDeps(packages.get(name))) visit(dep, [...path, name]);
  state.set(name, 'done');
  order.push(name);
}
[...packages.keys()].sort().forEach((name) => visit(name, []));

console.log(`build order: ${order.join(', ')}`);
for (const name of order) {
  console.log(`\n> ${name}`);
  execSync(`npm run build -w ${name}`, { stdio: 'inherit' });
}
