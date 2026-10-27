import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The repo root: the nearest folder above this file that holds pnpm-workspace.yaml.
 * Searched rather than fixed, because bundling (apps/api/dist) moves this code. */
function findMonorepoRoot(start) {
  for (let dir = start; ; dir = dirname(dir)) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    if (dirname(dir) === dir) return resolve(start, "../..");
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const monorepoRoot = findMonorepoRoot(__dirname);
export const envPath = resolve(monorepoRoot, ".env");

if (existsSync(envPath)) {
  config({ path: envPath });
}
