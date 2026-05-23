import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/spec',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'NODE_ENV=test RATE_LIMIT_BYPASS=true npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});