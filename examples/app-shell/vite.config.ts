import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Inside the academix-ui repo, built from the packages' SOURCE: this example is what the real-browser
 * tests (e2e/) run against, so a change is tested before it is published. Copied out as a starter, the
 * packages folder is not there and the npm packages in package.json are used instead.
 */
const packages = fileURLToPath(new URL('../../packages/', import.meta.url));
const inRepo = existsSync(`${packages}app-shell/src/index.ts`);
const pkg = (name: string) => `${packages}${name}/src/index.ts`;

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: inRepo
      ? {
          '@academix-admin/app-shell': pkg('app-shell'),
          '@academix-admin/navigation-stack': pkg('navigation-stack'),
          '@academix-admin/navigation-bar': pkg('navigation-bar'),
          '@academix-admin/sidebar': pkg('sidebar'),
        }
      : {},
    dedupe: ['react', 'react-dom'],
  },
  build: { outDir: 'dist', emptyOutDir: true },
  preview: { port: 4180, strictPort: true },
});
