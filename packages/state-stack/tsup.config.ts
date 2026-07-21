import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Prepend the "use client" directive to every runtime output file.
 * tsup/esbuild tree-shakes a bare directive string away, so a banner is
 * unreliable — this guarantees the directive survives for RSC consumers.
 */
async function preserveUseClient(dir = 'dist') {
  const files = await readdir(dir);
  await Promise.all(
    files
      .filter((f) => /\.(js|cjs)$/.test(f))
      .map(async (f) => {
        const p = join(dir, f);
        const code = await readFile(p, 'utf8');
        if (/^\s*['"]use client['"]/.test(code)) return;
        await writeFile(p, `"use client";\n${code}`);
      })
  );
}

export default defineConfig({
  entry: { index: 'src/index.ts', next: 'src/next.ts' },
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'next',
    'next/navigation',
    // Keep the /next adapter importing the package's public entry at runtime so
    // there is exactly one state-stack core instance (see src/next.ts).
    '@academix-admin/state-stack',
  ],
  onSuccess: () => preserveUseClient('dist'),
});
