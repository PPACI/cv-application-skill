import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.js"],
    hookTimeout: 60_000,
    testTimeout: 60_000,
    fileParallelism: false,
    pool: "forks",
    sequence: {
      concurrent: false,
    },
  },
});
