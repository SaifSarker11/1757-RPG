import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Cold Fastify/Prisma imports can be slow on a loaded machine.
    testTimeout: 20_000,
  },
});
