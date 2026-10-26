# PROGRESS

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
