import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const monorepoRoot = resolve(__dirname, "../..");
export const envPath = resolve(monorepoRoot, ".env");

if (existsSync(envPath)) {
  config({ path: envPath });
}
