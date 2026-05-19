# Important Developer Guidelines

Welcome to the **1757**. To keep the workspace clean and buildable, please follow these guidelines:

## 1. Single Lockfile and Workspace Rule

This project is a Turborepo monorepo managed by a single `pnpm-workspace.yaml` and a single `pnpm-lock.yaml` at the root directory.

> [!WARNING]
> Do NOT create local lockfiles (`pnpm-lock.yaml`) or workspace configuration files (`pnpm-workspace.yaml`) inside subdirectories like `apps/web/` or `apps/api/`. Doing so isolates that package from the monorepo and prevents `pnpm` from resolving local package workspace dependencies (e.g., `@repo/types`, `@repo/ui`, `@repo/db`).

Always run commands like `pnpm install` or `pnpm add` from the **workspace root** (or use the `--filter` flag, e.g. `pnpm --filter web add <pkg>`).

---

## 2. Allowed Build Scripts (`onlyBuiltDependencies`)

Certain dependencies like `sharp` (used by Next.js), `unrs-resolver`, and `prisma` require running post-install compile or build scripts. 

These are centrally configured at the root `package.json` under `"pnpm.onlyBuiltDependencies"`:
```json
  "pnpm": {
    "onlyBuiltDependencies": [
      "sharp",
      "unrs-resolver",
      "prisma"
    ]
  }
```
If you add any dependency that requires running an install/postinstall script, please add it to this list at the root `package.json` so that `pnpm` does not abort the install process.

---

## 3. API Build Target (ESM & Top-Level Await)

The API server (`apps/api`) uses native ES modules and top-level `await` for database/Fastify setups. 

- The compilation target in `apps/api/package.json` is set to `--target es2022`.
- Do not target compilation environments older than `es2022` (such as `es2020`), as they do not support top-level `await` and will cause build failures during production bundling.
