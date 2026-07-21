import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function preserveUseClient(dir = 'dist') {
  const files = await readdir(dir);
  await Promise.all(
    files.filter((f) => /\.(js|cjs)$/.test(f)).map(async (f) => {
      const p = join(dir, f);
      const code = await readFile(p, 'utf8');
      if (/^\s*['"]use client['"]/.test(code)) return;
      await writeFile(p, `"use client";\n${code}`);
    })
  );
}

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  outExtension({ format }) { return { js: format === 'cjs' ? '.cjs' : '.js' }; },
  dts: true, sourcemap: true, clean: true, treeshake: true, splitting: false,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'motion', 'motion/react', '@academix-admin/modal-sheet'],
  onSuccess: () => preserveUseClient('dist'),
});
