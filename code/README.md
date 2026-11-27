# 1757-RPG

A real-time multiplayer hidden-role deduction game set in 1757 Bengal, built as a monorepo with Turborepo.

## Look and feel

- **Palette (strict):** cream `#f9d4af`, walnut `#55362a`, red `#e01e1e`, oxblood `#4f0505`, ink `#111111` — blended with soft gradients on every surface.
- **Hero:** a gilded duel — Nawab Siraj-ud-Daulah and Robert Clive crossing swords — rising through an edge-to-edge **1757** title.
- **Transitions on every page:** public pages open with the battle painting lifting away; in-game screens (lobby → end of match) use a Prägen Hätlen-style veil with a bracketed `[000]→[100]` counter, gradient hairline and blur-in, plus bracketed section labels.
- **Battle recap:** every match ends with a full-width report covering the winner and reason, round scores, ministers, all ballots and votes, mission cards, Mir Madan's reveal, Jagat Seth's gamble, and every player's final identity and result.

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

| Service | Live address |
|---|---|
| API | https://one757-rpg.onrender.com |
| Web | https://1757-web-rpg.vercel.app |
| Admin | https://1757-admin-rpg.vercel.app |

## Quick Start (Docker)

```bash
# Copy the Docker-specific env template
cp .env.docker .env

# Start Postgres + Redis + API
docker compose up -d

# Run the web/admin apps on the host
pnpm dev --filter=web --filter=admin
```

The live API health endpoint is https://one757-rpg.onrender.com/health.

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

### Render (API and the game site)

[`render.yaml`](../render.yaml) is a Render Blueprint declaring two Docker web
services: **1757-api** (the game server, `code/Dockerfile`) and **1757-web**
(the game site itself, `code/Dockerfile.web`).

1. Connect the repo on the Render dashboard (**New → Blueprint**), or re-apply
   the existing blueprint so Render picks up the second service.
2. On **1757-api**, set `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `WEB_URL`,
   `ADMIN_URL`, `BETTER_AUTH_URL` and `ADMIN_USER_IDS` in the environment.
3. **1757-web** needs no environment: the API address, the live-connection
   address and the site URL are baked in from the `ARG` defaults at the top of
   `code/Dockerfile.web` — the standalone server reads its route table from the
   build output, so Render's env vars cannot change them.
4. Pushes to `main` trigger automatic deploys of both services.

The Render site is a second copy of the same game against the same database, so
rooms appear on both addresses. Its origin,
`https://1757-web.onrender.com`, is listed in
`code/apps/api/src/lib/origins.ts` (covered by `origins.test.ts`) and in
`code/packages/auth/src/index.ts`; rename the service and you must add the new
address to both, or to the API's `EXTRA_ALLOWED_ORIGINS`.

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
