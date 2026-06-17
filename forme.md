# 1757 RPG — Local Developer Command Reference

This file serves as a cheat-sheet for running and managing the 1757 RPG Turborepo monorepo locally.

---

## 🚀 Running the Services

### 1. Run Everything (All Apps + Services)
To start the API backend, next.js client, admin panel, and mobile expo packager concurrently in a single terminal session:
```bash
pnpm dev
```

### 2. Run Specific Projects (Recommended for Focused Terminal Layouts)
If you prefer running apps in individual terminal windows, use the `--filter` flag:
- **Start API Backend only (port 3001)**:
  ```bash
  pnpm --filter api dev
  ```
- **Start Web Client only (port 3000)**:
  ```bash
  pnpm --filter web dev
  ```
- **Start Mobile Expo Client only**:
  ```bash
  pnpm --filter mobile dev
  ```

---

## 🗄️ Database & Schema Management

Whenever you pull changes or modify `schema.prisma`, use these commands:
- **Generate Prisma Client Types (Run this if you see syntax errors like missing imports)**:
  ```bash
  pnpm db:generate
  ```
- **Push Schema changes to PostgreSQL Database (Local dev)**:
  ```bash
  pnpm db:push
  ```

---

## 🚨 Local Redis Requirement (API Backend)
The Fastify game server manages RPG game lobby states in memory using Redis. It connects to:
- **Host**: `localhost`
- **Port**: `6379`

### How to Run Redis locally without Docker:
- **Windows (Native)**: Start the `Redis` / `Memurai` Windows service via the Windows Services panel, or run `redis-server.exe` in cmd.
- **WSL (Ubuntu)**: Run `sudo service redis-server start` in your WSL terminal.
- **macOS (if developing on Mac)**: Run `brew services start redis`.
- *(Optional)* If you decide to use Docker: `pnpm docker:up`.

---

## 🛑 Utilities & Port Cleanup

If a dev server hangs or you get a `Port already in use` error on 3000/3001, run:
```bash
pnpm dev:kill
```
*(Runs the custom `scripts/kill-dev-ports.mjs` script to clear blocked dev ports).*
