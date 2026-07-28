import { defineConfig } from 'tsup';

export default defineConfig({
  // Two entries: the barrel + the generated DB types (exposed at '@academix-admin/domain-types/database').
  entry: { index: 'src/index.ts', 'database.types': 'src/database.types.ts' },
  format: ['esm', 'cjs'],
  outExtension({ format }) { return { js: format === 'cjs' ? '.cjs' : '.js' }; },
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
});
