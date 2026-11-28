import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    reporters: process.env.CI ? ["default", "junit", "json"] : ["default"],
    outputFile: { junit: "test-results/junit.xml", json: "test-results/results.json" },
  },
});
