# 1757-RPG

A real-time multiplayer hidden-role deduction game set in 1757 Bengal, built as a monorepo with Turborepo.

## Look and feel

- **Default royal palette (preserved):**
  | Colour | Hex | Used for |
  |---|---|---|
  | Warm Champagne Gold | `#f9d4af` | headings, body text, highlights, active borders |
  | Rich Espresso Bronze | `#55362a` | secondary surfaces, card borders, muted accents |
  | Deep Royal Crimson | `#4f0505` | elevated cards, section gradients, hover states |
  | Obsidian Black | `#111111` | page background, modals |
  | Pure Royal Red | `#e01e1e` | primary buttons, active badges, urgent indicators |
- **Gradients:** surfaces `#111111 → #4f0505`, cards `#4f0505 → #55362a`, primary buttons `#e01e1e → #4f0505` with `#f9d4af` text.
- **Hero:** a gilded duel — Nawab Siraj-ud-Daulah and Robert Clive crossing swords — rising through an edge-to-edge **1757** title.
- **Transitions on every page:** the Nawab-versus-Clive battle scene appears immediately and lifts to reveal the destination, with no blank intermediary screen; reduced-motion preferences are respected.
- **Battle recap:** every match ends with a full-width report covering the winner and reason, round scores, ministers, all ballots and votes, mission cards, Mir Madan's reveal, Jagat Seth's gamble, and every player's final identity and result.

### Personal themes and sound

Public pages keep **Royal Plassey**. After guest or account sign-in, the **Theme** picker in both the dashboard and room offers:

| Theme | Background | Secondary | Text | Accent |
|---|---|---|---|---|
| Royal Plassey | `#111111` | `#55362a` / `#4f0505` | `#f9d4af` | `#e01e1e` |
| Ivory & Sage | `#E4E4DE` | `#C4C5BA` | `#1B1B1B` | `#595F39` |
| Navy & Cream | `#0F1A2B` | `#D8CFC0` | `#F5F0E6` | `#C5A059` |
| Espresso & Champagne | `#241B15` | `#8C7A6B` | `#F4EFEA` | `#DFC498` |
| Burgundy & Rose | `#3B1219` | `#D6B4B8` | `#F7F3F0` | `#B88B4A` |

Loyalists remain emerald green in every theme. Secondary colours are blended into dark surfaces to preserve text contrast. Preferences are saved on the current browser and origin; the Vercel and Render copies have independent preferences.

**Sound** is available before sign-in and throughout the game. Court of Murshidabad starts on entry, with Council in Session and Eve of Plassey also available. If the browser blocks autoplay, the first click or key press starts music; the Sound control also shows **Enable music**. Returning players' Off choice is respected. Music loops across page changes, pauses for voice chat, and has its own volume.

Four original suspense click cues — Court whisper, Bronze seal, Distant war drum, Shadow chime — cover navigation, login, guest play, room creation, role assignment, approvals, ballots, and other controls. Each can be previewed; click sounds have an independent toggle and volume. Soft phase/result cues replace the old 8-bit effects.

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

- **Node.js** ≥ 20.9
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
| Web on Render | https://one757-web.onrender.com |
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
`https://one757-web.onrender.com`, is listed in
`code/apps/api/src/lib/origins.ts` (covered by `origins.test.ts`) and in
`code/packages/auth/src/index.ts`; rename the service and you must add the new
address to both, or to the API's `EXTRA_ALLOWED_ORIGINS`.

> **Cold-start note:** On the Render free/starter plan, the API service spins down after inactivity. The first request after a cold start may take 15-30 seconds. The web client shows a "Waking server…" indicator during this time.

### Vercel (Web & Admin)

GitHub Actions deploys and promotes the web and admin projects on pushes to `main`. Set the Vercel web Root Directory to `code/apps/web`, and the admin Root Directory to `code/apps/admin`. CI needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and the web `VERCEL_PROJECT_ID`. Render auto-deploys the Docker services; the existing bare `/rooms` rewrite must stay intact.

## CI/CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push to `main` and every PR:

1. **Install** → `pnpm install --frozen-lockfile`
2. **Generate** → `pnpm db:generate`
3. **Type-check** → `pnpm typecheck`
4. **Test** → `pnpm test`
5. **Build** → `pnpm build`
6. **Deploy API** → Render webhook (main only)
7. **Deploy Web & Admin** → Vercel CLI deploy and promote (main only)

## Documentation

- [`docs/events.md`](docs/events.md) — Socket.io event protocol
- [`docs/rooms-api.md`](docs/rooms-api.md) — Room REST endpoints
- [`docs/users-api.md`](docs/users-api.md) — User profile & stats API
- [`docs/admin-telemetry.md`](docs/admin-telemetry.md) — Admin dashboard & telemetry
- [`docs/web-game-ui.md`](docs/web-game-ui.md) — Web game interface
- [`docs/deployment.md`](docs/deployment.md) — Deployment guide & hardening checklist

## License

Private — all rights reserved.
