import { defineConfig, devices } from '@playwright/test';

/**
 * REAL ENGINES, PHONE-SHAPED (13 Nov). jsdom passed the keyboard flag three releases running while
 * iPhones disagreed. These run the example apps in WebKit as an iPhone and Chromium as an Android
 * phone — touch, pointer types, real CSS, real history — plus a wide desktop for the sidebar.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://localhost:4180', trace: 'retain-on-failure' },
  webServer: {
    command:
      'npx vite build --config examples/app-shell/vite.config.ts && npx vite preview --config examples/app-shell/vite.config.ts',
    url: 'http://localhost:4180',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
  ],
});
