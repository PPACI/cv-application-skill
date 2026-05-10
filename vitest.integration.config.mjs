import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.js"],
    hookTimeout: 1_200_000,
    testTimeout: 1_200_000,
    fileParallelism: false,
    pool: "forks",
    sequence: {
      concurrent: false,
    },
  },
});
