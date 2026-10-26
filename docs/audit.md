# Phase 0 — Repo audit

Audited on 2026-10-26 against `origin/dev` @ `4f3062a` ("updated decisions"), on branch `chore/phase0-audit`.

## ⚠ Flags (read first)

1. **Raja Ramnarain: the role exists in the repo, and its definition matches the plan.** He is Green and sees Nawab Siraj all game. He is in the Prisma enum, `RoleName`, `roles.ts` and the web role list. The plan needs no changes. He is not affected by Tara Bai in the repo, and the plan doesn't say otherwise. See "Ramnarain changes" below.
2. **Auth differs from the §1 assumption.** BetterAuth is on the Fastify API with email/password, `anonymous()` (guests) and `bearer()`. **Google OAuth is not configured.** There is no `username` field and no password-strength rules.
3. **Sockets are not authenticated.** Every socket handler and every `/rooms` REST route trusts a `userId` sent by the client, in the payload, the query or the body. Anyone can act as any player. This breaks plan rule 4 and §5, and it is the top fix.
4. **The game rules in code differ from §4 in many places.** See "Game code vs §4" below. The current engine is not a reducer: it is async handlers that read and write Redis **and** Postgres on every action.
5. **The branches named in the plan don't exist.** After `git fetch --prune`, the remote has only `main`, `dev` and `feat/dockerize`. Neither `loginui mvp` nor `login-page-design-fix` is on origin. Local `feat/room` is already fully contained in `dev`.
6. **`pnpm typecheck` passes** (8/8 tasks). **`pnpm lint` fails:** `apps/admin` has a `lint` script but no `eslint.config.*`. `pnpm build` and `db:push` are still unverified.
7. **`requirements.md` doesn't exist** anywhere in the repo. I wrote a new one at `.claude/requirements.md` (see the end of this file). Note that `.claude/` is **gitignored**, so `plan.md`, `rules.md` and `requirements.md` are not shared through git.

---

## 1. Apps and packages

| Path | What it is | Scripts |
|---|---|---|
| `apps/api` | Fastify (latest) + Socket.IO (latest) + BetterAuth handler + ioredis. ESM, built with tsup `--target es2022` | `dev` (tsx watch), `build`, `start`, `typecheck`. **No `lint`.** |
| `apps/web` | Next.js 16.2.6, React 19.2, Tailwind 4 + DaisyUI 5, socket.io-client, better-auth client | `dev` :3000, `build`, `start`, `lint`, `typecheck` |
| `apps/admin` | Next.js 16.2.6: login/signup/home only | `dev` :3002, `build`, `start`, `lint`, `typecheck` |
| `apps/mobile` | Expo 54 / RN 0.81 / expo-router: login, signup, home with global chat | `dev`, `android`, `ios`, `web`, `typecheck` |
| `packages/auth` | `betterAuth({...})` with the Prisma adapter. Exports `auth`, `Auth`, `Session` | `typecheck` |
| `packages/db` | Prisma (latest) + `@prisma/adapter-neon`. Client generated into `src/generated` | `db:generate`, `db:push`, `db:studio`, `typecheck` |
| `packages/types` | Shared TS types (socket events, room, roles) | none (has a stray committed `index.d.ts`/`.js`/`.map`) |
| `packages/config` | `tsconfig.base.json`, `load-env.mjs` (dotenv from the root `.env`) | none |
| `packages/ui` | Turborepo starter stubs (button, card, code) | `lint`, `typecheck` |
| `packages/eslint-config`, `packages/typescript-config` | Shared configs | — |

Root: pnpm 9 + Turborepo 2.9. `turbo.json` `globalEnv` lacks `REDIS_URL`. `docker-compose.yml` has only `redis:7-alpine`. `README.md` is still the Turborepo starter text.

## 2. Platform

- **Web** (`apps/web`) is the main client. It has login, signup, home (create/join room, rename, theme picker) and `room/[id]` (lobby, phases, voting, guesses, chat, role list).
- **Admin** is just an auth shell. It's post-mid (item 40).
- **Mobile** (Expo) has auth plus global chat only, with no game screens. Deferred as planned.
- **Does the web build?** Typecheck passes. `pnpm build` wasn't run locally; CI runs it on main.
- **The §1 working assumption holds:** web first, mobile later.

## 3. Auth

- `packages/auth/src/index.ts`: email/password enabled, plugins `anonymous()` and `bearer()`, optional `crossSubDomainCookies` via `COOKIE_DOMAIN`. No social providers.
- `apps/api/src/auth-routes.ts`: `/api/auth/*` is proxied to `auth.handler`. `GET /api/me` returns the session.
- Clients use `createAuthClient` + `anonymousClient()` (web, admin, mobile). Mobile uses `expo-secure-store`.
- **Guests:** `authClient.signIn.anonymous()` creates a `User` row with `isAnonymous=true` and a unique id. The cookie session keeps it stable per browser. That covers doc item 6, pending a quick manual check.
- **US_14 rules are missing:** no `username` column, no 3–15 alphanumeric check, no password ≥ 8 with a number and a special character. The unique email comes only from the `@@unique([email])` constraint.
- **US_15:** session cookie / bearer token, not "JWT in localStorage". Appendix B can be applied as written.
- **Socket auth: none.** `io` is created with no middleware. Identity comes from `socket.on("user:identify", {userId})`, `room:join {userId}` and `handshake.query.userId`. Handlers use `socket.data.userId ?? data.userId`.
- **REST auth: none** on `/rooms*` and `/users/update-profile`, which trust `body.userId`, so anyone can rename any user. `/rooms/dev/create-user` creates users without auth unless `NODE_ENV=production`.

## 4. Game code

Files: `apps/api/src/game/{engine,roles,roundConfig,redisKeys}.ts`, `apps/api/src/socket/index.ts`, `apps/api/src/routes/rooms.ts`, `apps/api/src/lib/redis.ts`.

**Where state lives:** rooms, players, roles, round records and win counts are in **Postgres**, written on nearly every action. Live phase, selector, votes, team, the de Bussy flag and the Jean Law target are in **Redis** hashes/sets (`game:<roomId>:*`, TTL 7200 s). Chat history is held **in process memory** (a global array plus a per-room map). This conflicts with §5 ("in-memory authoritative, snapshot to Redis") and §6 ("live play doesn't touch Postgres").

**What exists:**
- Room create/join/leave/get/start over REST. The code is 6 characters but drawn from hex only (0-9, A-F). Host migration on leave goes to the earliest-joined player.
- Socket events: `room:join`, `room:leave`, `game:start`, `round:proposeTeam`, `round:approvalVote`, `round:missionVote`, `endgame:guess`, `debussy:lockOn`, `jeanlaw:lock`, `chat:send-message`, `user:identify`.
- Role assignment with a balance table and private `role:assigned` info per socket.
- Round flow DISCUSSION → TEAM_APPROVAL → MISSION_VOTE → transition, plus ENDGAME guesses for Mir Jafar and Jagat Seth.

### Game code vs §4 (what must change)

| Area | Repo today | Plan |
|---|---|---|
| Composition | `ROLE_BALANCE` differs (e.g. 7 → 4G/2R + Jagat Seth; 10 → 6G/4R). Jagat Seth only at odd counts | §4.3 table |
| Duplicate roles | Picks `pool[i % len]`, so **14–15 players get a duplicate Green role** (7 Green slots vs a pool of 6) | Unique roles; fillers (Loyalist / EIC Spy) beyond the named cast |
| Dependencies / Siraj | No dependency enforcement. Siraj not guaranteed. Tara Bai can appear without Siraj/Lutfunnesa | §4.2 dependencies, Siraj always present |
| Fillers / host toggles | No Loyalist / EIC Spy. No advanced-role toggles | §4.1, US_2 |
| Team sizes | 11–15 players differ (e.g. 15 → 5-6-7-7-8) | §4.3 |
| Round 1 | **Nomination is auto-approved** (no ballot) | Normal ballot |
| Rejections | `MAX_REJECTIONS = 3` **ends the whole game** as a Red win | 5 rejections → that *round* goes to Red, track resets |
| Leader rotation | Leader rotates only between rounds, **not after a rejection** | Rotates on every nomination |
| Phases | No ROLE_REVEAL, SELECTION, RESOLUTION or ROUND_RESULT. Client-side 120 s countdown only | §4.4 FSM, server-owned `endsAt` |
| Timers | **None on the server.** No ballot/card/guess timeout defaults | §4.5 |
| Ballot | Weight 2 for Saint Frais / Yar Lutuf ✓, tie → reject ✓. Result emits only `{approved}` | Plus a per-player vote + headcount results card, 30 s default Approve |
| Mission cards | **Saint Frais / Yar Lutuf cards also weigh 2** | Cards count normally |
| Card rules | Server doesn't stop Greens from playing "red" | Greens can only play Success |
| Sabotage threshold | R4 with ≥ 7 players needs 2 ✓ | Matches §4.3 |
| Mission result | **Never emitted.** Client listens for `round:mission-vote-complete`; types declare `round:missionResult` | Shuffled card counts |
| Red recognition | **Not implemented**; Reds see nobody | §4.2 Red mutual recognition |
| Mir Madan | Vision emitted at every Round 1 DISCUSSION start (repeats after rejections). Never revoked | Round 1 Discussion only, removed server-side |
| Mohon Lal | Suspects carry `team: "green"` / `team: "red"`, which **leaks which is Mir Madan** | Two unlabelled suspects |
| Siraj / Lutfunnesa | Real partner always listed **first**, so array order leaks the real one | Shuffled, indistinguishable |
| de Bussy | Mutual reveal ✓. Rai Durlabh not masked. Phase must be DISCUSSION ✓ | Rai Durlabh shows as "Loyalist" |
| Jean Law | `jeanlaw:lockConfirmed {targetUserId}` is **broadcast to the whole room** (a leak). Gold targets are stored as "locked" | Target not notified; Red/Gold → nothing happens |
| Endgame | Mir Jafar then Jagat Seth sequencing broadly ✓, but Jagat Seth can guess at any time during ENDGAME. No timeout | §4.6 with a 60 s timeout |
| Jean Law win credit | Locked Green is excluded if Green wins; **not credited** when Red wins | Wins only if W = Red |
| Errors | `room:error` is **broadcast to the whole room**; generic `error` events with no codes | `game:error` with a code, to the sender only |
| Persistence | `Room` / `RoomPlayer` / `RoundRecord` updated live. No `Match` / `MatchPlayer` / `BallotVote` | §6, a single transaction at match end |
| Duplicate start | Both `POST /rooms/:id/start` and socket `game:start` assign roles; REST start never initialises Redis | One start path |

**Client/server event mismatches:** the client listens for `room:chat-history` (the server sends `chat:history`), `room:update` (never emitted) and `round:mission-vote-complete` (never emitted).

## 5. Prisma schema

Models: `User` (BetterAuth fields + `isAnonymous`), `Session`, `Account`, `Verification`, `Room`, `RoomPlayer`, `RoundRecord`. Enums: `RoomStatus`, `PlayerTeam` (GREEN/RED/GOLD), `PlayerRole` (15 roles, spelled `SAINT_FRASY`).
- Missing from §6: `User.username/avatarId/xp/level`, `Match`, `MatchPlayer`, `Round`, `BallotVote`.
- `RoomPlayer.user` is optional, but `userId` is required and not nullable, so guests rely on anonymous `User` rows (fine).
- `pnpm db:push` was **not run**: it would write to the shared Neon DB. Run it against a local or branch DB first.

## 6. Branches and merge order

| Branch | State |
|---|---|
| `origin/dev` | Latest. Contains the room, roles and rounds work (former `feat/room`), plus the DaisyUI themes, profiles and leave-room commits |
| `origin/feat/dockerize` | 1 commit (`0022e03` "Init containerization", safwan), **11 commits behind `dev`**. 23 files, +4982/−13: `Dockerfile.dev` for api/web/mobile, `docker-compose.yml` (+117), `.env.docker`, `scripts/docker-start.{sh,ps1,bat}`, **13 markdown docs** under `docs/dockerize/` (~4.5k lines; suggest trimming to one), a `packages/db/src/index.ts` change (+33/−13; review carefully) and a `tsbuildinfo` change |
| `loginui mvp`, `login-page-design-fix` | **Not on origin.** Ask satil whether they were merged, deleted or never pushed |
| local `feat/room` | Fully merged into `dev`; safe to delete |

Suggested order: (1) confirm the two login branches are gone or merged; (2) this audit branch (docs only, no conflicts); (3) rebase `feat/dockerize` on `dev`, drop the `tsbuildinfo` change, review the `packages/db` change, then merge. **Nothing gets merged without human approval.**

## 7. CI

`.github/workflows/ci.yml`: runs on **push/PR to `main` only**: install → `db:generate` → `typecheck` → `build`, then the Render and Vercel deploys on main. **No `lint`, no `test`, no runs on `dev`.** It needs triggers for `dev` and PRs to `dev`, plus `lint` and `test` steps (item 2).

## 8. Secrets

- **Working tree:** no `npg_`, `GOCSPX-`, real `BETTER_AUTH_SECRET=` or Upstash tokens found outside `node_modules`.
- `.env` is in `.gitignore` ✓ (listed twice).
- `.env.example` held placeholder values only (no real secrets). It's now replaced with names only, per the plan.
- **Git history scan (`git log --all -p`):** no `npg_`, `GOCSPX-` or Upstash token values in any commit. The only `BETTER_AUTH_SECRET=` values are the placeholder `dev-secret-change-in-production`, in commit `0022e03` on `feat/dockerize` (`.env.docker`, the docker-start scripts, the docs). That isn't a real secret, but `.env.docker` should become `.env.docker.example` before merging.
- **Human action, regardless of the result:** rotate the secrets that were pasted into the SPL2 Google Doc (Appendix A).

## 9. Status of the §7 items (the repo wins)

| Doc # | Item | Doc status | **Real status** | Gap |
|---|---|---|---|---|
| 1 | Setup | done | **done** | README still the starter text |
| 2 | CI/CD | done | **partial** | main only; no lint/test; no dev triggers |
| 3 | Automated testing | todo | **todo** | no test runner, zero tests |
| 4 | Colour palette | todo | **partial** | DaisyUI themes exist; no faction tokens |
| 5 | Login/signup/guest | done | **partial** | no Google OAuth, no username, no password rules |
| 6 | Unique guest IDs | todo | **mostly done** | anonymous plugin gives a unique id; verify stability |
| 7 | Logged-in chat | done | **partial** | sender spoofable; no auth check; no profanity filter |
| 8 | Join room by ID | done | **partial** | hex-only code; spoofable `userId`; no public list or Quick Join |
| 9 | Customisable room | todo | **todo** | only `maxPlayers`; leave-time host migration exists |
| 10 | Real-time chat | done | **partial** | room-scoped ✓; not phase-aware; memory-only history; event-name mismatch |
| 11 | Voting mechanism | done | **partial** | weights/tie ✓; no timeout default, no results card; cards wrongly weighted |
| 12 | Rounds mechanism | doing | **partial** | many §4.4/§4.5 deviations (table above) |
| 13 | Role assignment | done | **partial** | wrong table, duplicates at 14–15, no dependencies/fillers |
| 14 | Role powers | todo | **partial** | some visions exist; three leaks; no Red recognition |
| 15 | Team points / endgame | todo | **partial** | round wins + guesses exist; no persistence; Jean Law credit incomplete |
| 16 | Edge role cases | todo | **todo** | — |
| 17 | Room cleanups | todo | **todo** | only Redis keys deleted at game end |
| 18 | Timeouts & reconnection | todo | **todo** | online/offline badge event only |
| 19 | Rate limiting | todo | **todo** | — |
| 20 | Dockerize | doing | **partial** | compose = Redis only on dev; `feat/dockerize` not reviewed |
| — | Minimum playable UI | — | **partial** | room page covers most screens but relies on missing events |

## 10. Other findings

- `lib/redis.ts` uses `REDIS_HOST` / `REDIS_PORT`, not `REDIS_URL`, and has no TLS for Upstash (§1).
- Rule violations: `console.error` in every socket handler; `any` throughout `apps/web/app/room/[id]/page.tsx`; `useEffect` + `fetch` data loading in the web pages.
- `GET /rooms/code/:code` also matches rooms by **id prefix**, which allows enumeration.
- `packages/types` has a hand-committed `index.d.ts` / `index.js` that has drifted from `index.ts`.
- **Build artefacts are tracked in git:** `apps/api/dev.log`, `apps/{api,admin}/tsconfig.tsbuildinfo`, `packages/types/tsconfig.tsbuildinfo`, `packages/types/src/index.{js,d.ts,d.ts.map}`. Untrack them and add them to `.gitignore`.
- **Lint coverage:** `apps/admin` has no ESLint config (fails); `apps/api`, `packages/auth` and `packages/db` have no `lint` script.

## 11. Ramnarain changes

The role exists in the repo: `PlayerRole.RAJA_RAMNARAIN`, `roles.ts` (`case "raja_ramnarain"` → sees the real Nawab Siraj), and the web text "Governor of Patna. Can see Nawab Siraj throughout the game." He is Green, in the Green pool, and there is no Tara Bai interaction.
**This matches the provisional §4.2 definition, so the plan, the composition table, the win credit and Appendix B need no changes.** There's no conflict with Lutfunnesa (both see Siraj; that's allowed). One open question for the review: should Tara Bai also confuse Ramnarain? The repo says no, and the plan is silent, so it stays no.

## Verification log

- [x] `pnpm typecheck`: passes (8/8)
- [x] `pnpm lint`: **fails** (`admin` has no ESLint config)
- [x] `pnpm --filter web lint`: **fails**, 35 problems (20 errors, 15 warnings): `no-explicit-any`, `react-hooks/set-state-in-effect`, `react/no-unescaped-entities`. `handleMirJafarGuessSubmit`, `handleJagatSethGuessSubmit`, `handleDeBussyLockOn` and `handleJeanLawCurse` are **never used**, so the room UI has no controls for the endgame guesses or the de Bussy / Jean Law abilities
- [x] `git log --all -p` secrets scan: clean apart from dev placeholders (§8)
- [x] `feat/dockerize` diff reviewed at stat level (§6)
- [x] Tracked artefacts listed (§10)
- [ ] `pnpm build`: not run (CI runs it on main)
- [ ] `pnpm db:push` against a non-shared database
