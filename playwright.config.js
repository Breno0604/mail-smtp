import { defineConfig, devices } from '@playwright/test';

const isHeaded = process.argv.includes('--headed');

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    slowMo: isHeaded ? 2000 : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx netlify dev --port 8888',
    url: 'http://localhost:8888',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
