# 1757-RPG

A real-time multiplayer hidden-role deduction game set in 1757 Bengal, built as a monorepo with Turborepo.

## Architecture

| App / Package | Stack | Purpose |
|---|---|---|
| `apps/api` | Fastify + Socket.io + Prisma | Game server, REST API, real-time engine |
| `apps/web` | Next.js 16 | Player-facing web client |
| `apps/admin` | Next.js 16 | Administrative dashboard & telemetry |
| `apps/mobile` | Expo (React Native) | Mobile client |
| `packages/game-engine` | Pure TypeScript | Deterministic FSM, role assignment, views |
| `packages/db` | Prisma | Schema, migrations, generated client |
| `packages/auth` | BetterAuth | Auth config shared across apps |
| `packages/config` | dotenv | Centralised env loader |

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9 (`corepack enable && corepack prepare pnpm@9.0.0 --activate`)
- **Docker** (optional, for containerised local dev)

## Quick Start (local)

```bash
# 1. Clone and install
git clone https://github.com/SaifSarker11/1757-RPG.git
cd 1757-RPG/code   # the monorepo lives in /code
pnpm install

# 2. Configure environment
cp .env.example .env
# → Edit .env with your Neon Postgres URLs and a BetterAuth secret

# 3. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 4. Start all apps in development mode
pnpm dev
```

| Service | URL |
|---|---|
| API | http://localhost:3001 |
| Web | http://localhost:3000 |
| Admin | http://localhost:3002 |

## Quick Start (Docker)

```bash
# Copy the Docker-specific env template
cp .env.docker .env

# Start Postgres + Redis + API
docker compose up -d

# Run the web/admin apps on the host
pnpm dev --filter=web --filter=admin
```

The API health endpoint is available at `http://localhost:3001/health`.

## Environment Variables

All apps load variables from a single root `.env` file (see [`.env.example`](.env.example) for the full list).

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Postgres connection (Neon `*-pooler.*`) |
| `DIRECT_URL` | ✅ | Direct Postgres connection (Prisma CLI) |
| `BETTER_AUTH_SECRET` | ✅ | Session signing secret |
| `BETTER_AUTH_URL` | ✅ | API base URL for auth callbacks |
| `WEB_URL` | ✅ | Web client origin (CORS) |
| `ADMIN_URL` | ✅ | Admin console origin (CORS) |
| `REDIS_URL` | — | Redis for game snapshots (falls back to memory) |
| `PORT` | — | API listen port (default `3001`) |
| `COOKIE_DOMAIN` | — | Cross-subdomain cookie scope |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm test` | Run all workspace tests (Vitest) |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:push` | Push schema changes to the database |
| `pnpm docker:up` | Start Docker Compose stack |
| `pnpm docker:down` | Stop Docker Compose stack |
| `pnpm dev:kill` | Kill processes on dev ports |

## Deployment

### Render (API)

The API deploys to [Render](https://render.com) as a Docker web service.

1. Connect the repo on the Render dashboard.
2. Render auto-detects `render.yaml` and creates the service.
3. Set `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `WEB_URL`, `ADMIN_URL`, and `BETTER_AUTH_URL` in the Render environment.
4. Pushes to `main` trigger automatic deploys via CI.

> **Cold-start note:** On the Render free/starter plan, the API service spins down after inactivity. The first request after a cold start may take 15-30 seconds. The web client shows a "Waking server…" indicator during this time.

### Vercel (Web & Admin)

The Next.js apps deploy to [Vercel](https://vercel.com) through Vercel's Git integration whenever `main` changes. The Vercel project is on the Hobby plan, which only deploys commits authored by the project owner, so changes reach `main` through pull requests that the owner merges. Don't push directly to `main`: Vercel blocks those deploys.

## CI/CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push to `main` and every PR:

1. **Install** → `pnpm install --frozen-lockfile`
2. **Generate** → `pnpm db:generate`
3. **Type-check** → `pnpm typecheck`
4. **Test** → `pnpm test`
5. **Build** → `pnpm build`
6. **Deploy API** → Render webhook (main only)
7. **Deploy Web** → Vercel Git integration (when the owner merges a PR into main)

## Documentation

- [`docs/events.md`](docs/events.md) — Socket.io event protocol
- [`docs/rooms-api.md`](docs/rooms-api.md) — Room REST endpoints
- [`docs/users-api.md`](docs/users-api.md) — User profile & stats API
- [`docs/admin-telemetry.md`](docs/admin-telemetry.md) — Admin dashboard & telemetry
- [`docs/web-game-ui.md`](docs/web-game-ui.md) — Web game interface
- [`docs/deployment.md`](docs/deployment.md) — Deployment guide & hardening checklist

## License

Private — all rights reserved.
