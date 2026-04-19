import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "**/storybook-tailwind-animations.spec.ts",
    "**/tailwind-runtime-parity.spec.ts",
    "**/storybook-zod-forms-smoke.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:6006",
    trace: "on-first-retry",
    headless: true,
    launchOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        },
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --port 3000",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: "npm run build && npm run start -- --port 3001",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
    {
      command: "npm run storybook -- --ci --port 6006",
      url: "http://localhost:6006",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
