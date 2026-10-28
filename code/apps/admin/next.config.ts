import path from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error - Next.js does not export type definitions for @next/env under bundler resolution
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const monorepoRoot = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.."
);
loadEnvConfig(monorepoRoot);

const apiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
