// Single-source codegen: contracts/contracts.schema.json → TypeScript (web/lambda/desktop) + Dart
// (Flutter). Deterministic (pinned quicktype) so `npm run verify` (regen + git diff) catches drift.
//
// TS  → src/generated/contracts.ts        (committed in academix-ui)
// Dart→ $DART_OUT/academix_contracts.dart  (default: sibling academix-app/lib/domain; CI sets DART_OUT)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..');
// RELATIVE schema path (cwd=PKG). quicktype parses the schema path as a URI; an absolute Windows path
// ("C:\...") makes the drive letter look like a URI scheme and breaks $ref resolution.
const SCHEMA = 'contracts/contracts.schema.json';
const ROOT = 'AcademixContracts';

// Run the pinned, locally-installed quicktype CLI directly with node (no shell) — deterministic and
// cross-platform (avoids the Windows cmd-vs-sh quoting issues of npx/shell:true).
const QT_CLI = createRequire(import.meta.url).resolve('quicktype/dist/index.js');
function quicktype(args) {
  execFileSync(process.execPath, [QT_CLI, '-s', 'schema', SCHEMA, '-t', ROOT, ...args], {
    stdio: 'inherit', cwd: PKG,
  });
}

// ── TypeScript ───────────────────────────────────────────────────────────────
// TS keeps the raw (snake_case) JSON keys — the RPC/Lambda wire is snake_case and TS interfaces are
// structural (no fromJson), so field names must equal the JSON keys. (Dart below camelCases + maps.)
const tsOut = path.join(PKG, 'src', 'generated');
mkdirSync(tsOut, { recursive: true });
quicktype(['-o', path.join(tsOut, 'contracts.ts'), '--just-types']);
console.log('✓ TS  → src/generated/contracts.ts');

// ── Dart (Flutter) ───────────────────────────────────────────────────────────
const dartOut = process.env.DART_OUT || path.resolve(PKG, '..', '..', '..', 'academix-app', 'lib', 'domain');
if (process.env.DART_OUT || existsSync(path.dirname(dartOut))) {
  mkdirSync(dartOut, { recursive: true });
  quicktype(['-l', 'dart', '-o', path.join(dartOut, 'academix_contracts.dart')]);
  console.log(`✓ Dart → ${path.relative(process.cwd(), dartOut)}/academix_contracts.dart`);
} else {
  console.log('· Dart skipped (academix-app not found beside academix-ui; set DART_OUT to generate)');
}
