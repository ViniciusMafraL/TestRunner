import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev -- --port 5183',
    url: 'http://localhost:5183',
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_MODE: 'mock' },
  },
  use: {
    baseURL: 'http://localhost:5183',
  },
});
