# 1757

**A real-time multiplayer social-deduction game set at the Battle of Plassey.**

[![CI/CD](https://github.com/SaifSarker11/1757-RPG/actions/workflows/ci.yml/badge.svg)](https://github.com/SaifSarker11/1757-RPG/actions/workflows/ci.yml)


![1757 home page](doc/screenshots/current/home.jpg)

<table>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/login.jpg" alt="Sign in"><br><sub><b>Sign in</b>: choose a game display name, or sign in with email.</sub></td>
    <td><img src="doc/screenshots/current/signup.jpg" alt="Sign up"><br><sub><b>Sign up</b>: keep your level, XP and win rate.</sub></td>
  </tr>
  <tr>
    <td><img src="doc/screenshots/current/characters-grid.jpg" alt="Characters"><br><sub><b>Characters</b>: all 20 roles, including Robert Clive.</sub></td>
    <td><img src="doc/screenshots/current/rules.jpg" alt="Rules"><br><sub><b>Rulebook</b>.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/dashboard.jpg" alt="<b>Dashboard</b> after sign-in: create a room or join by code."><br><sub><b>Dashboard</b> after sign-in: create a room or join by code.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/create-room.jpg" alt="<b>Room creation</b>: Standard Council or Royal Decree."><br><sub><b>Room creation</b>: Standard Council or Royal Decree.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/decree-settings.jpg" alt="<b>Royal Decree</b>: the host picks seats and roles."><br><sub><b>Royal Decree</b>: the host picks seats and roles.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/lobby-host.jpg" alt="<b>Room creator</b> view: room code, players, Start Match."><br><sub><b>Room creator</b> view: room code, players, Start Match.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/lobby-joiner.jpg" alt="<b>Joining player</b> view of the same room."><br><sub><b>Joining player</b> view of the same room.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/role-reveal.jpg" alt="<b>Character reveal</b>: portrait, name and side (Nawab's Loyalists)."><br><sub><b>Character reveal</b>: portrait, name and side (Nawab's Loyalists).</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/role-reveal-eic.jpg" alt="<b>Character reveal</b> for the East India Company."><br><sub><b>Character reveal</b> for the East India Company.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/host-controls.jpg" alt="<b>Discussion</b> with host controls."><br><sub><b>Discussion</b> with host controls.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/nominate.jpg" alt="<b>Leader</b> nominates ministers."><br><sub><b>Leader</b> nominates ministers.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/ballot.jpg" alt="<b>Voting</b>: approve or reject the ministers."><br><sub><b>Voting</b>: approve or reject the ministers.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/mission.jpg" alt="<b>Mission</b>: play a loyal or traitor card."><br><sub><b>Mission</b>: play a loyal or traitor card.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/mir-madan-guess.jpg" alt="<b>Identifying Mir Madan</b>: Mir Jafar's endgame guess."><br><sub><b>Identifying Mir Madan</b>: Mir Jafar's endgame guess.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="doc/screenshots/current/red-loss.jpg" alt="<b>East India Company loses</b>: the Loyalists held the field."><br><sub><b>East India Company loses</b>: the Loyalists held the field.</sub></td>
    <td width="50%"><img src="doc/screenshots/current/green-win.jpg" alt="<b>Nawab's Loyalists win</b> (the Company loses)."><br><sub><b>Nawab's Loyalists win</b> (the Company loses).</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="doc/screenshots/current/battle-recap.jpg" alt="Full battle recap with round scores, ministers, ballots, mission cards, the Mir Madan reveal, and every player's result."><br><sub><b>Battle recap</b>: the complete match story — rounds, ministers, every ballot, mission cards, the Mir Madan reveal, final identities, and each player's win or loss.</sub></td>
  </tr>
</table>


---

## What is 1757?

Bengal, June 1757. The Nawab's court is full of traitors, and nobody knows who they are.

- **The Nawab's Loyalists (Green)** form the majority, but they don't know who the traitors are.
- **The East India Company's conspirators (Red)** hide inside the court, mostly know each other, and sabotage missions.
- **Jagat Seth** is the one neutral exception, not a third faction. The banker is only dealt in games of 9 or more players and wins **alone** with a correct guess in the endgame.

Each game has **6–15 players** and **5 rounds**. The first side to win **3 rounds** moves on to the endgame. Every player gets a secret historical role (Nawab Siraj ud-Daulah, Mir Jafar, Lutfunnesa, Jean Law, …), and most roles come with their own power or hidden knowledge.

## How a round works

```
Role reveal → Discussion → Leader picks ministers → Everyone votes → Ministers play cards → Result
```

1. **Role reveal:** you see your role and anything your role lets you know about others.
2. **Discussion:** talk, accuse and bluff. The host sets the timer (30–300 s, default 120 s).
3. **Selection:** the **Leader** picks ministers for the mission. Team size depends on player count and round (e.g. 2-3-4-3-4 at 6 players).
4. **Ballot:** everyone votes Approve or Reject. **A tie means rejected.** Leadership passes to the next seat after every vote. **Five rejections in one round give that round to Red.**
5. **Mission:** each minister secretly plays **Success** or **Sabotage**. One Sabotage fails the round, except Round 4 with 7+ players, which needs two.
6. **Result:** the cards are revealed (shuffled, so nobody can tell who played what) and the round is scored.

**Endgame (after a side wins 3 rounds):**

- **Mir Jafar's steal:** if Green won on rounds, Mir Jafar gets one guess. Naming **Mir Madan** correctly steals the win for Red.
- **Jagat Seth's gamble:** if Jagat Seth is in the game, he then names one player: **Mir Jafar** if Green is winning, **Rai Durlabh** if Red is winning. A correct guess wins the whole game for Jagat Seth alone.

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
- **Artwork:** a panoramic Plassey battlefield with troops, artillery and elephants beneath the **1757** title. The commanders’ duel appears only in the transition gallery.
- **Transitions:** fifteen distinct historical illustrations, randomly shuffled without repeats until every scene has appeared. Consecutive repeats across cycles are prevented; the cycle survives page reloads within the tab. Images are preloaded, failed images never leave a blank overlay, and reduced-motion preferences are respected.

### Personal themes and music

**Royal Plassey** is the default. The **Theme** picker is available beside Music from the first screen; the selected palette continues through login, dashboard and room.

Royal Plassey remains first and unchanged. The alternatives use all twelve combinations currently published in [Brandlic's luxury palette guide](https://brandlic.studio/9-luxury-color-palettes-that-define-high-end-design-in-2025/), including its three 2026–2027 additions.

| Theme | Reference colours |
|---|---|
| Royal Plassey (default) | `#111111` / `#55362a` / `#4f0505` / `#f9d4af` / `#e01e1e` |
| Midnight Opulence | `#1a1a2e` / `#16213e` / `#0f3460` / `#efc07b` |
| Golden Hour Elite | `#FEF4D5` / `#F1E49A` / `#E6D17B` / `#2c1810` |
| Emerald Sophistication | `#0d4c3c` / `#2d5a4a` / `#7ba05b` / `#f4f1eb` |
| Platinum Prestige | `#2c3e50` / `#34495e` / `#bdc3c7` / `#ecf0f1` |
| Royal Burgundy | `#722f37` / `#8b1538` / `#a0522d` / `#f5f5dc` |
| Sapphire Dreams | `#0f1419` / `#1e3a5f` / `#4a90a4` |
| Rose Gold Romance | `#b76e79` / `#e8b4b8` / `#f7e7ce` / `#ffffff` |
| Obsidian Elegance | `#0c0c0c` / `#2c2c2c` / `#4a4a4a` / `#bea98e` |
| Arctic Luxury | `#f8f8ff` / `#e6e6fa` / `#b0c4de` / `#2f4f4f` |
| Quiet Luxury | `#EDE6DA` / `#D6CBB8` / `#A8998A` / `#4F473F` |
| Luminous Blue Luxe | `#0B1A33` / `#1D3B6A` / `#2E6FD8` / `#EDE7DC` |
| Olive & Deep Wine | `#2F3A22` / `#6E7445` / `#5B1A2A` / `#EFE6D6` |

Nawab/Loyalists remain emerald green (`#2f9e5b`), EIC remains red (`#e01e1e`), and Jagat Seth remains neutral light gray (`#D3D3D3`) in every theme. Surface gradients blend each palette's swatches; Rose Gold derives a deeper rose ink for readable text. Preferences are saved on the current browser and origin; Vercel and Render copies have independent preferences.

**Music** appears in the dashboard and room header after guest or account sign-in. Open it to select **Court of Murshidabad**, **Council in Session**, **Eve of Plassey**, or **Off**, and adjust the volume. It is also available before sign-in. Browsers may require a first click to start playback; returning players' Off choice is respected. Music loops across page changes and pauses temporarily for voice chat.

Buttons stay silent and there is no vibration: the music alone carries the atmosphere.

### Updated settings screenshots

| Settings | Preview |
|---|---|
| Music selection after login | ![Signed-in music selection](doc/screenshots/current/music-signed-in.jpg) |
| Royal first, with all luxury alternatives | ![Luxury theme picker](doc/screenshots/current/theme-picker-plassey.jpg) |
| Green Nawab, red EIC, neutral Jagat Seth | ![Faction colours](doc/screenshots/preferences/faction-colours.jpg) |

## Features

- **Play as a guest or with an account:** email/password or named anonymous guest, via Better Auth.
- **Public and private rooms** with a 6-character join code, quick-join and kick.
- **Royal Decree custom mode:** per-round discussion timers, a choice of which characters are allowed, host-assigned roles, and host pause/skip.
- **Text chat and peer-to-peer voice chat** (WebRTC) inside every room.
- **30-second reconnect grace:** drop out and rejoin without losing your seat.
- **15 named roles plus 2 fillers** (Loyalist and EIC Spy), with role dependencies such as Mir Jafar ⇄ Mir Madan.
- **Progression:** XP, levels, match history and win rate on your profile.
- **Full battle recap:** winner and reason, round scores, ministers, every ballot and vote, mission cards, Mir Madan's reveal, Jagat Seth's gamble, and every player's final identity and win/loss result.
- **Admin telemetry dashboard:** match analytics, player stats and user moderation.

## Tech stack

| Layer | Technology |
|---|---|
| Web & admin clients | Next.js 16, React 19, Tailwind CSS 4, DaisyUI 5 |
| Mobile client | Expo 54 (React Native 0.81) |
| API & real-time | Fastify 5, Socket.IO 4, WebRTC (voice) |
| Game engine | Pure TypeScript, no I/O |
| Auth | Better Auth (email/password, anonymous guests) |
| Data | PostgreSQL (Neon) via Prisma 7, Redis via ioredis |
| Tooling | pnpm 9 workspaces, Turborepo, Vitest, GitHub Actions, Docker |

## Architecture

```mermaid
flowchart LR
  subgraph Clients
    W["Web · Next.js"]
    A["Admin · Next.js"]
    M["Mobile · Expo"]
  end
  W & A & M -- HTTP + Socket.IO --> API["API · Fastify + Socket.IO"]
  API --> E["game-engine<br/>reduce(state, action)"]
  API <--> R[("Redis<br/>live game snapshots")]
  API <--> P[("PostgreSQL via Prisma<br/>users · rooms · match history")]
```

The game engine (`packages/game-engine`) is a pure function, `reduce(state, action, now, rng) → { state, events }`, with no network, database or clock of its own. That makes every rule deterministic and unit-testable. The API runs the engine, stores the state in Redis so live games survive a restart, and sends **each player their own `game:view`**, filtered so nobody receives secrets their role shouldn't see.

## Repository layout

```
/code/                        all source code (Turborepo + pnpm monorepo)
/doc/                         SRS, design, presentation, final report, screenshots
README.md                     this file
render.yaml                   Render Blueprint: the API and the game site
.github/workflows/ci.yml      CI: install, typecheck, test, build
```

```
code/
├── apps/
│   ├── api/              Fastify + Socket.IO server: REST, auth, lobby, real-time game
│   ├── web/              Next.js player client
│   ├── admin/            Next.js admin and telemetry dashboard
│   └── mobile/           Expo React Native client
├── packages/
│   ├── game-engine/      deterministic game rules (FSM, roles, voting, endgame)
│   ├── db/               Prisma schema and generated client
│   ├── auth/             shared Better Auth configuration
│   ├── config/           loads the single code/.env for every app
│   ├── types/            shared TypeScript types
│   ├── ui/               shared React components
│   ├── eslint-config/    shared lint rules
│   └── typescript-config/ shared tsconfig presets
├── docs/                 developer docs (REST API, socket events, deployment)
├── Dockerfile            production image for the API
└── docker-compose.yml    local Postgres, Redis and API containers
```

## Getting started

### Prerequisites

- **Node.js 20** (CI and the Docker image use Node 20; Next.js 16 needs at least 20.9)
- **pnpm 9.0.0:** `corepack enable && corepack prepare pnpm@9.0.0 --activate`
- **Docker** (optional, for a local Redis)
- A free **[Neon](https://neon.tech) Postgres** database. The database client uses Neon's serverless driver, so a plain local Postgres won't work.

### Run it locally

```bash
git clone https://github.com/SaifSarker11/1757-RPG.git
cd 1757-RPG/code

# 1. Install dependencies
pnpm install

# 2. Create your environment file and fill it in
cp .env.example .env
```

Every app reads the one `code/.env` file. The variables are:

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection (host contains `-pooler`) |
| `DIRECT_URL` | Neon **direct** connection, used by the Prisma CLI |
| `BETTER_AUTH_SECRET` | session signing (`npx @better-auth/cli secret`) |
| `BETTER_AUTH_URL`, `WEB_URL`, `ADMIN_URL`, `API_URL` | app origins (production uses `https://one757-rpg.onrender.com` and `https://1757-web-rpg.vercel.app`) |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `EXPO_PUBLIC_API_URL` | where clients find the API |
| `REDIS_URL` | optional: without it, live games are kept in memory |
| `PORT`, `NODE_ENV`, `COOKIE_DOMAIN` | optional runtime settings |

```bash
# 3. (Optional) start Redis in Docker
docker compose up -d redis
#    then set REDIS_URL in .env

# 4. Generate the Prisma client and push the schema to your database
pnpm db:generate
pnpm db:push

# 5. Start everything
pnpm dev
```

| App | Live address |
|---|---|
| Web (the game) | https://1757-web-rpg.vercel.app |
| Web (the game), served from Render | https://one757-web.onrender.com |
| API | https://one757-rpg.onrender.com (health: [`/health`](https://one757-rpg.onrender.com/health)) |
| Admin dashboard | https://1757-admin-rpg.vercel.app |

To run only the game, use `pnpm dev --filter=web --filter=api`. If a port is stuck on Windows, run `pnpm dev:kill`.

## Testing

```bash
cd code
pnpm test                               # every suite, through Turborepo
pnpm --filter @repo/game-engine test    # just the game engine
pnpm typecheck                          # TypeScript across all packages
```

Tests use **Vitest**:

- **`packages/game-engine`** (23 files): role dealing and dependencies, every phase transition, ballot and tie rules, mission scoring, the fail track, timeouts, abilities, endgame guesses and per-player vision.
- **`apps/api`** (19 files): room REST routes, lobby rules, room codes, socket handlers and real-time broadcasting, reconnect grace, match persistence, user stats and admin queries.

Manual test scripts are in [`code/docs/manual-testing.md`](code/docs/manual-testing.md).

## Building and deployment

| Part | Where | How |
|---|---|---|
| API | **Render** | Docker image from `code/Dockerfile`, declared in [`render.yaml`](render.yaml) |
| Web (the game) | **Vercel** | Git integration or CI, one project per app (Root Directory `code/apps/web` / `code/apps/admin`) |
| Web (the game), second copy | **Render** | Docker image from `code/Dockerfile.web`, declared in [`render.yaml`](render.yaml) |
| CI | **GitHub Actions** | [`ci.yml`](.github/workflows/ci.yml): install, Prisma generate, typecheck, test, build; pushes to `main` also trigger the Render and Vercel deploys |

### Running the game on Render

[`render.yaml`](render.yaml) is a Render Blueprint: it declares both services,
so one apply creates them.

1. In the [Render dashboard](https://dashboard.render.com), choose **New →
   Blueprint** and pick this repository. Render reads `render.yaml` and creates
   **1757-api** and **1757-web**.
2. On **1757-api**, fill in the values marked `sync: false`: `DATABASE_URL`,
   `DIRECT_URL`, `REDIS_URL`, `WEB_URL`, `ADMIN_URL`, `BETTER_AUTH_URL`,
   `ADMIN_USER_IDS`.
3. **1757-web** needs nothing. The game-server address, the live-connection
   address and the site's own URL are compiled into the image from the `ARG`
   defaults at the top of [`code/Dockerfile.web`](code/Dockerfile.web), because
   the packaged server reads its route table from the build output.
4. Both redeploy automatically when `main` changes.

The Render site is a second, independent copy of the same game: it talks to the
same API and the same database, so a room created on either address shows up on
both. Sign-in works there because `https://one757-web.onrender.com` is on the
server's trusted-origin list
([`code/apps/api/src/lib/origins.ts`](code/apps/api/src/lib/origins.ts));
renaming the service means adding the new address there, or to the API's
`EXTRA_ALLOWED_ORIGINS`.

```bash
cd code
pnpm build                                   # build every app
docker build -t 1757-api -f Dockerfile .     # build the API image
docker build -t 1757-web -f Dockerfile.web . # build the game site image
```

See [`code/docs/deployment.md`](code/docs/deployment.md) for environment variables per platform.

## Documents

| Document | File |
|---|---|
| Software Requirements Specification | [`doc/srs.pdf`](doc/srs.pdf) |
| Design document | [`doc/design.pdf`](doc/design.pdf) |
| Final presentation | [`doc/final-presentation.pdf`](doc/final-presentation.pdf) |
| Final report | [`doc/final-report.pdf`](doc/final-report.pdf) |

## Team

| Member | Student ID | Responsibilities |
|---|---|---|
| Wasi Omar Syed | 230042143 | Game engine (FSM, voting, missions, roles, vision, endgame), rooms and Royal Decree mode, rate limiting, voice chat, background music |
| Md. Saif-Al Sarker | 230042106 | Monorepo scaffold and CI/CD, reconnection handling, web room page integration, users module, admin dashboard |
| M Safwan Hasan Khan | 230042117 | Authentication and guest play, real-time chat, first room flow, UI themes and profiles, sound effects, Docker |

**Course:** SWE 4404 Software Project Lab II, Islamic University of Technology

**Supervisor:** Samia Nawsheen, Junior Lecturer, Department of CSE, IUT

**Course teacher:** Farzana Tabassum, Lecturer, Department of CSE, IUT

## Automated test evidence

The project uses **Vitest** (not “Vtest”). Tests are in `code/packages/game-engine/test/` and colocated `code/apps/api/src/**/*.test.ts`. GitHub CI runs them before build/deploy, publishes counts in its summary, and uploads JUnit/JSON reports as **vitest-results**. See [testing instructions and reviewer evidence](TESTING.md). TODO cases are listed separately, not treated as passes.

## Signed-in council design

The dashboard and room use an Avalon-inspired tabletop layout, adapted to 1757: a circular court table, secret identity medallions, the rotating leader’s crown, minister markers, five battle-round tokens and rejection track. Portraits only reveal your own role or genuine private reveals; faction identity and rules are unchanged. The first-screen settings, battlefield artwork, visible game display-name field and signed-in council screenshots reflect the current interface.

## Transition gallery and current screenshots

![Historical transition scene](doc/screenshots/current/transition-render.jpg)

![Current named-player dashboard](doc/screenshots/current/dashboard.jpg)

The new paintings are generated historical illustrations, visually reviewed for obvious anatomy, equipment and perspective defects; they are not archival images or a guarantee of historical accuracy. The screenshots were captured from real public pages and a completed six-player match.
