import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: ["./tests/globalSetup.js"],
    setupFiles: ["./tests/setup.js"],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 600000,
  },
});
