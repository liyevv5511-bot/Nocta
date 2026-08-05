import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${String(PORT)}`;

/**
 * End-to-end configuration.
 *
 * Runs against the *production build*, not the dev server. A smoke suite that
 * only ever exercises Vite's dev pipeline cannot catch a broken code-split, a
 * missing chunk or a route that 404s under the SPA fallback — which are
 * exactly the failures worth catching before a deploy.
 *
 * Two servers, because the app is two processes: the static host and the
 * planner. Playwright starts both and waits for each to answer.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Two projects, not three: the reduced-motion suite declares its own
  // `test.use({ reducedMotion: 'reduce' })`, so it runs under *both* form
  // factors rather than only on a desktop Chrome that duplicates one of them.
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:8787/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // `scripts/serve.ts`, not `vite preview`: the latter does not resolve
      // `/destination/lisbon` to that directory's `index.html`, so every
      // prerendered page fell through to the SPA fallback and the suite tested
      // the landing page over and over while reporting green.
      command: `npm run serve`,
      url: BASE_URL,
      env: { PORT: String(PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
