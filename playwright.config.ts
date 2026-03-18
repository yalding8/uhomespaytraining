import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  use: {
    browserName: "chromium",
    viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command: "npx serve . -l 3737 --no-clipboard",
    port: 3737,
    reuseExistingServer: true,
  },
});
