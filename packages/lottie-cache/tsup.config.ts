import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  outExtension({ format }) { return { js: format === 'cjs' ? '.cjs' : '.js' }; },
  dts: true, sourcemap: true, clean: true, treeshake: true, splitting: false,
});
