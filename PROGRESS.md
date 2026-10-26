# PROGRESS

## 2026-10-26 — `feat/m8-users-profiles` (stacked on `feat/m7-reconnect-timeouts`)
- **Changed:** User profile and career statistics architecture. All profile updates and stats retrieval routes enforce authentication via BetterAuth sessions (`requireUser`), rejecting body-supplied identities.
- **Routes:** Added `GET /api/users/me` (full profile with dynamically verified level), `PATCH /api/users/me` (handles username and name updates with validation for 3-15 alphanumeric/underscore handle uniqueness and length limits), `GET /api/users/me/stats` (career matches played, won, win rate, forfeits, and Jean Law locks), `GET /api/users/me/history` (paginated match records), and `GET /api/users/:userId/stats` (public stats lookup).
- **Progression & XP:** Implemented XP rules in `apps/api/src/users/xp.ts` (50 XP match completion, 100 XP victory, 25 XP Jean Law lock, 0 XP for forfeits) with linear level-up curves. Wired atomic XP awarding into `saveMatch` at game conclusion (`POST_GAME`).
- **Web UI:** Upgraded `/home` dashboard with a live career statistics panel (Level, Total XP, Matches, Win Rate) and a username/handle input synced with `PATCH /api/users/me`.
- **Docs:** Full documentation in `docs/users-api.md`.
- **Tests:** Unit tests for XP calculation rules and route integration tests covering authentication, username conflict guards, profile updates, and career stat aggregations.
- **Next:** M9 web client game interface modernization.

## 2026-10-26 — `feat/m7-reconnect-timeouts` (stacked on `feat/m6-realtime`)
- **Changed:** Resilient reconnection and disconnect tracking via `DisconnectTracker` with 30-second grace periods per player. Socket handlers dispatch `playerDisconnected` on socket disconnect and `playerReconnected` on `room:join` / `game:sync`. In-memory and Redis-backed state synchronization delivers current game views to rejoining users without round disruption.
- **Grace-period Auto-Actions:** Automatic fallback when grace timer expires during an active turn or vote: automatically casts `REJECT` on pending ballot votes, auto-plays the first legal card on mission ballots, and auto-acts safely so room progress is never deadlocked by dropped players.
- **Presence & State:** Added `player:status` presence events (`online`/`offline`) with room-wide broadcast, and added `offlineUsers()` query in `GameService`.
- **Docs:** Documented complete client reconnection flow, presence updates, and timeout behavior in `docs/events.md`.
- **Tests:** Unit tests for `DisconnectTracker` and `GameService` disconnect/autoAct handlers, plus end-to-end integration tests over the socket transport layer.
- **Next:** M8 user authentication & profiles.

## 2026-10-26 — `feat/m6-realtime` (stacked on `feat/m5-rooms-lobby`)
- **Changed:** sockets are authenticated from the BetterAuth session (cookie or `auth.token`) and join `user:<id>`; anonymous sockets can still chat but every room/game event refuses them. New zod-validated protocol: `room:join`, `room:leave`, `game:start`, `game:action`, `game:sync` with acks; `game:view` per player, `game:event` (public engine events) per room, and `game:error` to the sender only. `GameService` runs every match on the engine: serialized per room, Redis snapshot (`game:<roomId>`, 2 h TTL) after every transition, seeded RNG per step, timers at `endsAt`, restore on boot, the match saved to Postgres at POST_GAME and dropped 30 min later. Empty lobbies are deleted after 10 min. Rate limits: HTTP 100/min/IP; per socket, chat 5/5 s and actions 10/s. Redis comes from `REDIS_URL`, with a memory fallback plus warning when unreachable. The legacy `apps/api/src/game/*` engine is removed. Docs: `docs/events.md`.
- **Fixes vs the old code:** client-supplied identity on every socket event; errors broadcast to the whole room; no server timers; heavy Postgres writes during play; `console.error` in handlers.
- **Tests:** API 119 passing, including real Socket.IO client/server tests; engine 237 passing.
- **Heads-up for M9:** the web room page still uses the old event names, so in-game UI won't work until it moves to `game:view` / `game:action` (see `docs/events.md`). Lobby, chat and presence events are unchanged.
- **Action needed:** add `REDIS_URL` to `turbo.json` `globalEnv` and the Render env (M11); `pnpm db:push` on a dev DB.
- **Next:** M7 reconnection & timeouts (teammate).

## 2026-10-26 — `feat/m5-rooms-lobby` (stacked on `feat/m4-endgame-persistence`)
- **Changed:** every room write now takes the caller from the BetterAuth session (`requireUser` in `apps/api/src/lib/session.ts`; M8 can extend it), and body user ids are ignored. Room codes are 6 characters from A–Z0–9, and the code lookup matches the exact code only. New: host settings (max players, discussion time, role toggles, public/private) with live `room:settings`; a public lobby list and Quick Join pushed as `lobby:list`; host kick with a lobby ban; host migration to the longest-present player; `inviteUrl`, `code` and `playerCount` in room responses. The old REST start route was removed (start belongs to M6), and leaving mid-game is refused (disconnects are M7). Docs: `docs/rooms-api.md`.
- **Fixes vs the old code:** a spoofable `userId` on every route; hex-only codes; the id-prefix room lookup; the room response leaking each player's team; `rolesInPlay` listed in player order, which mapped roles to players; the web client listening for a `room:update` that was never sent.
- **DB (additive):** `Room.isPublic`, `discussionSeconds`, `enabledRoles`, `bannedUserIds`.
- **Web:** room create/join/leave fetches now send `credentials: "include"`. Nothing else in the web app changed.
- **Tests:** API 68 passing (`pnpm --filter api test`, no DB needed). New dependency: `zod` 4.4.3 (named in plan §5).
- **Action needed:** `pnpm db:push` on a dev/branch DB (not run here).
- **Next:** M6 realtime layer.

## 2026-10-26 — `feat/m4-endgame-persistence` (stacked on `feat/m3-voting-missions`)
- **Engine:** ENDGAME now runs Mir Jafar's guess (Green round win) and then Jagat Seth's (target set by W), each with a 60 s timeout. `outcome` records the reason and both guesses. `playerResults` gives win credit, including Jean Law's flipped Green target and the humiliation flag. `matchSummary` is a server-only report. Views show `pending.guess`, the endgame progress (guesser ids hidden until POST_GAME) and the per-player results in POST_GAME.
- **DB (additive only):** `Match`, `MatchPlayer`, `MatchRound`, `BallotVote`; enums `MatchEndReason`, `RoundEndReason`, `BallotChoice`; `PlayerRole` + `LOYALIST`, `EIC_SPY`; `User.username?` (unique), `avatarId?`, `xp`, `level`. The plan's `Round` is named `MatchRound` to avoid confusion with the existing `RoundRecord`.
- **API:** `apps/api/src/persistence/` has `buildMatchCreateInput` (pure) and `saveMatch` (one nested create, atomic). Not called yet; M6 calls it at POST_GAME.
- **Tests:** engine 237 passing + 3 todo; API 8 passing (`pnpm --filter api test`, no DB needed).
- **Action needed:** run `pnpm db:push` against a dev/branch database. Not run here, to avoid touching the shared Neon DB.
- **Next:** M5 rooms & lobby.

## 2026-10-26 — `feat/m3-voting-missions` (stacked on `feat/m2-roles-visions`)
- **Changed:** Saint Frais and Yar Lutuf weigh 2 on the ballot only (`BALLOT_WEIGHTS`). `BALLOT_RESOLVED` now carries the raw `headcount`, never the weighted totals. Added results cards (`ballotResultsCard`, `publicView().lastBallot`) with seat-ordered votes. Greens can only play Success (`CARD_NOT_ALLOWED`); Red, Gold and fillers may play either (`ALLOWED_CARDS`). `viewFor` shows the player's own `myVoteWeight` and `pending.allowedCards`.
- **Fixes vs the old API code:** mission cards are no longer double-weighted; Greens can no longer sabotage.
- **Tests:** 193 passing + 3 todo. Older tests now pick saboteurs and casts explicitly; the leak suites get a 60 s timeout.
- **New [DEFAULT]:** Jagat Seth may play either card.
- **Next:** M4 endgame guesses, win credit and persistence.

## 2026-10-26 — `feat/m2-roles-visions` (stacked on `feat/m1-game-engine`)
- **Changed:** `viewFor(state, playerId)` and `publicView(state)` in `packages/game-engine/src/vision/`. They cover every §4.2 vision (Siraj / Lutfunnesa / Tara Bai confusion, Ramnarain, Mir Madan in Round 1 Discussion only, Mohon Lal suspects, Red recognition with the Umichad and Rai Durlabh exceptions; Jagat Seth unseen). Added the `DEBUSSY_REVEAL` and `JEANLAW_LOCK` actions (once per game, Discussion only), the `PRIVATE_VIEW_CHANGED` event and `isJeanLawFlipped`.
- **Fixes vs the old API code:** Mohon Lal's suspects no longer carry a team; the real partner is no longer always listed first; the Jean Law target is no longer broadcast; Rai Durlabh is masked as a Loyalist for de Bussy.
- **Tests:** 179 passing + 3 todo. Includes a leak test over 6–15 players × 40 seeds × 5 phases, checked against an independent oracle, and the item 16 edge-case matrix. The disconnect cases are deferred to M7.
- **New [DEFAULT]s:** abilities usable in any Discussion phase; Jean Law isn't told whether the lock worked.
- **Next:** M3 voting weights and card rules.

## 2026-10-26 — `feat/m1-game-engine`
- **Changed:** new `packages/game-engine` (pure TS, Vitest). Includes `gameConfig.ts` (the §4.3 composition table, timers and timeout defaults), a seeded RNG, a role catalog with §4.2 dependencies, and `assignRoles` (unique roles, Siraj always, Jagat Seth placed first, fillers, Gold → Loyalist fallback). Also `createGame` and a pure `reduce` covering ROLE_REVEAL → DISCUSSION → SELECTION → BALLOT → RESOLUTION → ROUND_RESULT → POST_GAME, with server-owned `endsAt`, TICK timeouts, the fail track (5 → round to Red), and leader rotation on every nomination.
- **Tests:** 104 passing (`pnpm --filter @repo/game-engine test`), including a property test over 6–15 players × 300 seeds and full matches at every player count.
- **New [DEFAULT]s:** ROUND_RESULT lasts 8 s; an unplaced Gold slot becomes a Green Loyalist.
- **Next:** M2 roles & visions (`viewFor`), M3 voting weights and card rules, then M4 endgame guesses. The engine is not wired into the API yet (M6).
