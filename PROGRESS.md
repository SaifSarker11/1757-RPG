# PROGRESS

## 2026-10-26 — `feat/m1-game-engine`
- **Changed:** new `packages/game-engine` (pure TS, Vitest). Includes `gameConfig.ts` (the §4.3 composition table, timers and timeout defaults), a seeded RNG, a role catalog with §4.2 dependencies, and `assignRoles` (unique roles, Siraj always, Jagat Seth placed first, fillers, Gold → Loyalist fallback). Also `createGame` and a pure `reduce` covering ROLE_REVEAL → DISCUSSION → SELECTION → BALLOT → RESOLUTION → ROUND_RESULT → POST_GAME, with server-owned `endsAt`, TICK timeouts, the fail track (5 → round to Red), and leader rotation on every nomination.
- **Tests:** 104 passing (`pnpm --filter @repo/game-engine test`), including a property test over 6–15 players × 300 seeds and full matches at every player count.
- **New [DEFAULT]s:** ROUND_RESULT lasts 8 s; an unplaced Gold slot becomes a Green Loyalist.
- **Next:** M2 roles & visions (`viewFor`), M3 voting weights and card rules, then M4 endgame guesses. The engine is not wired into the API yet (M6).
