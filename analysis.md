# Codebase Analysis & Troubleshooting Report

This document outlines the architecture of the **1757 RPG** monorepo and provides a detailed analysis of the two issues encountered when running the `api` and `web` services.

---

## 1. Project & Codebase Overview

The project is structured as a **pnpm monorepo** managed with **Turbo**:

### Applications (`apps/`)
- **`apps/api`**: A Fastify server utilizing Socket.io for multiplayer game state synchronization, routing, and real-time room communication.
- **`apps/web`**: A Next.js web application implementing the game's frontend UI, including client-side Google Authentication and Guest session generation.
- **`apps/admin`**: A administration dashboard.
- **`apps/mobile`**: An Expo mobile application.

### Packages (`packages/`)
- **`packages/db`**: Prisma client setup shared across apps.
- **`packages/auth`**: Better Auth configurations and shared authentication helper utilities.
- **`packages/config`**: Monorepo-wide configuration loading scripts (including `load-env.mjs` which reads the root `.env` file).
- **`packages/types`**: Shared TypeScript definitions and type declarations.
- **`packages/ui`**: Shared UI component library.

---

## 2. Issue Analysis

### Issue A: `[ioredis] Unhandled error event: AggregateError [ECONNREFUSED]`

#### Why it is happening:
1. In `apps/api/src/lib/redis.ts`, the `ioredis` client is initialized using:
   ```typescript
   const redis = new Redis({
     host: process.env.REDIS_HOST ?? "localhost",
     port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
   });
   ```
2. The root `.env` file does not define `REDIS_HOST` or `REDIS_PORT`. Consequently, `ioredis` falls back to connecting to `localhost:6379`.
3. There is no active Redis server running on `localhost:6379` because the Docker container (defined in `docker-compose.yml`) is stopped/not running, or a local Redis instance has not been started.
4. Because the connection attempts fail, `ioredis` throws `ECONNREFUSED` errors repeatedly.

#### How to Resolve:
- **Option 1 (Docker)**: Spin up the Redis container defined in your root `docker-compose.yml` by running the predefined script in the root directory:
  ```bash
  pnpm docker:up
  ```
- **Option 2 (Local Redis)**: Ensure a local Redis server is running on port `6379`.
- **Option 3 (Mock / Graceful Fallback)**: If Redis is not critical for local development, you could wrap the Redis connection logic or configure `ioredis` with options like `lazyConnect: true` or custom connection retry strategies to prevent unhandled crashing, though starting the container is the standard workflow.

---

### Issue B: `[browser] [GSI_LOGGER]: Missing required parameter: client_id`

#### Why it is happening:
1. In `apps/web/app/login/google-auth.ts` (and `google-auth.tsx`), the Google Sign-In SDK is initialized via the client-side function:
   ```typescript
   window.google.accounts.id.initialize({
     client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
     ...
   });
   ```
2. In Next.js, environment variables must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.
3. In your root `.env` file, the Google OAuth credentials are defined as:
   ```env
   GOOGLE_CLIENT_ID="5353009953-t1kcpq2jfhsrn9eqijfnmjadaau8rrrf.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="..."
   ```
   Because `GOOGLE_CLIENT_ID` lacks the `NEXT_PUBLIC_` prefix, `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` evaluates to `undefined` in the browser, triggering the Google Identity Services logger warning.
4. Additionally, since Next.js runs in `apps/web`, it loads `.env.local` inside `apps/web`, which currently only contains `VERCEL_OIDC_TOKEN`. It does not automatically load environment variables from the parent root `.env` file unless explicitly run via Turbo with configuration or configured in `next.config.ts`.

#### How to Resolve:
1. **Expose the variable**: In the root `.env` file (or your local environment configuration), duplicate `GOOGLE_CLIENT_ID` with the public prefix:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="5353009953-t1kcpq2jfhsrn9eqijfnmjadaau8rrrf.apps.googleusercontent.com"
   ```
2. **Add to Web App Environment**: Add the public environment variable to your Next.js configuration or the web app's local environment file (`apps/web/.env.local` or a new `apps/web/.env`):
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="5353009953-t1kcpq2jfhsrn9eqijfnmjadaau8rrrf.apps.googleusercontent.com"
   ```
   Or ensure that the root `.env` file variables are correctly passed to the Next.js runtime (e.g. by running through `turbo dev` which handles standard workspace dependencies and global environments if configured).
