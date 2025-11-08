import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const allProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 12'] },
  },
]

const selectedProjects = process.env.PLAYWRIGHT_ONLY
  ? allProjects.filter(p => {
      const wanted = process.env.PLAYWRIGHT_ONLY!
        .split(',')
        .map(s => s.trim().replace(/_/g, ' ').toLowerCase())
      return wanted.includes(p.name.toLowerCase())
    })
  : allProjects

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. Allow overriding with PLAYWRIGHT_WORKERS env var. */
  // If PLAYWRIGHT_WORKERS is set, use it. Otherwise on CI default to 2 workers, locally let Playwright decide.
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Math.max(1, Number(process.env.PLAYWRIGHT_WORKERS))
    : process.env.CI
    ? 2
    : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'dot' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: selectedProjects,

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});