import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    reporters: process.env.CI ? ["default", "junit", "json"] : ["default"],
    outputFile: { junit: "test-results/junit.xml", json: "test-results/results.json" },
    // Cold Fastify/Prisma imports can be slow on a loaded machine.
    testTimeout: 20_000,
  },
});
