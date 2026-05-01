import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:9000',
    trace: 'on-first-retry',
    browserName: 'chromium',
    channel: 'msedge',
    headless: true,
    viewport: {
      width: 1440,
      height: 900,
    },
  },
  webServer: {
    command: 'npm run dev:frontend',
    url: 'http://127.0.0.1:9000',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
