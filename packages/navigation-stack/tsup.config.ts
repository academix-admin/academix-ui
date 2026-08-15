import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pkg from './package.json';

/**
 * Prepend the "use client" directive to every runtime output file.
 * tsup/esbuild tree-shakes a bare directive string away, so a banner is
 * unreliable — this guarantees the directive survives for RSC consumers.
 */
async function preserveUseClient(dir = 'dist') {
  const files = await readdir(dir);
  await Promise.all(
    files
      // The playwright entry runs in Node (the test runner), not the browser, so the
      // client directive does not belong on it.
      .filter((f) => /\.(js|cjs)$/.test(f) && !f.startsWith('playwright'))
      .map(async (f) => {
        const p = join(dir, f);
        const code = await readFile(p, 'utf8');
        if (/^\s*['"]use client['"]/.test(code)) return;
        await writeFile(p, `"use client";\n${code}`);
      })
  );
}

export default defineConfig({
  entry: { index: 'src/index.ts', playwright: 'src/playwright.ts' },
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // devtools' debug() blob reports the version; injecting it here keeps it from drifting behind
  // the package, which it silently had been.
  define: { __NAVSTACK_VERSION__: JSON.stringify(pkg.version) },
  onSuccess: () => preserveUseClient('dist'),
});
