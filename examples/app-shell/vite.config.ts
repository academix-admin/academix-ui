import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Built from the packages' SOURCE, not from npm: this example is what the real-browser tests (e2e/)
 * run against, so it must be the code in this checkout — a change is tested before it is published.
 */
const pkg = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@academix-admin/app-shell': pkg('app-shell'),
      '@academix-admin/navigation-stack': pkg('navigation-stack'),
      '@academix-admin/navigation-bar': pkg('navigation-bar'),
      '@academix-admin/sidebar': pkg('sidebar'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: { outDir: 'dist', emptyOutDir: true },
  preview: { port: 4180, strictPort: true },
});
