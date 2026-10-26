# @repo/game-engine

Pure TypeScript rules engine for 1757. No I/O: the API owns sockets, timers and storage, and calls into this package.

## API

```ts
import { createGame, reduce, createRng } from "@repo/game-engine";

const rng = createRng(seed);
let { state, events } = createGame({ playerIds, settings, now: Date.now(), rng });

// Player actions
({ state, events } = reduce(state, { type: "NOMINATE", playerId, ministerIds }, Date.now(), rng));
({ state, events } = reduce(state, { type: "CAST_VOTE", playerId, vote: "APPROVE" }, Date.now(), rng));
({ state, events } = reduce(state, { type: "PLAY_CARD", playerId, card: "SUCCESS" }, Date.now(), rng));

// Schedule a TICK at state.endsAt; it applies that phase's timeout.
({ state, events } = reduce(state, { type: "TICK" }, Date.now(), rng));
```

- `reduce` never mutates its input. An invalid action returns the **same** state plus one `ACTION_REJECTED { playerId, code }` event.
- `GameState` holds every player's role. **Never send it to clients**; project it per player (see the roles & visions module).
- Each TICK applies at most one timeout. Schedule the next one from the new `endsAt`.

## Phases

```
ROLE_REVEAL → DISCUSSION → SELECTION → BALLOT ─approved→ RESOLUTION → ROUND_RESULT → … → POST_GAME
                  ↑                         └─rejected / selection timeout → fail track +1, next Leader
                  └──────────────────────────────────┘    (5 on the track → round goes to Red)
```

| Phase | Timer | On timeout |
|---|---|---|
| ROLE_REVEAL | 15 s | → DISCUSSION |
| DISCUSSION | host setting (30–300 s) | → SELECTION |
| SELECTION | 60 s | rejected nomination |
| BALLOT | 30 s | missing votes = Approve |
| RESOLUTION | 30 s | missing cards = Success |
| ROUND_RESULT | 8 s | next round, or POST_GAME at 3 wins |

Every tunable value lives in `src/config/gameConfig.ts`.

## Not here yet

- Vote weights, the results card, Greens-can't-sabotage (voting & missions module)
- Visions, `viewFor`, de Bussy / Jean Law (roles & visions module)
- Mir Jafar / Jagat Seth guesses and win credit (endgame module). For now the round winner is final.
- Disconnect defaults (reconnection module)

## Scripts

```sh
pnpm --filter @repo/game-engine test
pnpm --filter @repo/game-engine typecheck
```
