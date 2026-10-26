# Socket events

One Socket.IO server on the API. The server is authoritative: clients send intents, the engine (`@repo/game-engine`) decides, and each player only ever receives `viewFor(state, theirId)`.

## Connecting

```ts
io(API_URL, { withCredentials: true });          // web: BetterAuth session cookie
io(API_URL, { auth: { token: bearerToken } });   // mobile: BetterAuth bearer token
```

- With a session, the socket is tied to that user and joins the private channel `user:<id>`.
- Without one, the connection is accepted (global chat still works) but every room and game event answers `UNAUTHORIZED`.
- Every socket joins `lobby` on connect.

## Client → server

Every event below takes an optional ack callback: `{ ok: true }` or `{ ok: false, error: { code, message } }`. On failure the same error also arrives as `game:error`, **only on that socket**. The acting player is always the session user; any `playerId` / `userId` in a payload is ignored.

| Event | Payload | Who | Effect |
|---|---|---|---|
| `room:join` | `{ roomId }` | room members | Joins the room channel; sends the room chat history and online list; if a game is running, sends the caller's `game:view` |
| `room:leave` | `{ roomId }` | anyone signed in | Leaves the channel (the REST leave removes the membership) |
| `game:start` | `{ roomId }` | host | Deals roles and starts the match. Room → `IN_PROGRESS` |
| `game:action` | `{ roomId, action }` | seated players | See actions below |
| `game:sync` | `{ roomId }` | seated players | Re-sends the caller's `game:view` (reloads, reconnects) |
| `chat:send-message` | `{ roomId?, userId, username, text }` | anyone | Unchanged from before (owned by the chat module) |

### Actions (`game:action`)

| `action` | When | Who |
|---|---|---|
| `{ type: "NOMINATE", ministerIds: string[] }` | SELECTION | the Leader; exactly `teamSize` ids |
| `{ type: "CAST_VOTE", vote: "APPROVE" \| "REJECT" }` | BALLOT | every player, once |
| `{ type: "PLAY_CARD", card: "SUCCESS" \| "SABOTAGE" }` | RESOLUTION | ministers, once; Greens only `SUCCESS` |
| `{ type: "DEBUSSY_REVEAL", targetId }` | DISCUSSION | de Bussy, once per game |
| `{ type: "JEANLAW_LOCK", targetId }` | DISCUSSION | Jean Law, once per game |
| `{ type: "GUESS", targetId }` | ENDGAME | Mir Jafar, then Jagat Seth |

Use `view.pending` to decide which controls to show; it already accounts for phase, role and what the player has done.

## Server → client

| Event | Channel | Payload |
|---|---|---|
| `game:view` | `user:<id>` | `{ roomId, view: PlayerView }`. Sent to every player after every change. Render from this alone |
| `game:event` | the room | `{ roomId, events: PublicGameEvent[] }`, for animations and logs (see below) |
| `game:started` | the room | `{ roomId }` |
| `game:error` | the sender only | `{ code, message }` |
| `chat:history`, `chat:message` | lobby / room | unchanged |
| `game:join`, `game:leave`, `player:status`, `room:online-list` | the room | presence, unchanged |
| `lobby:list`, `room:update`, `room:settings`, `room:kicked`, `room:player-kicked` | see `docs/rooms-api.md` | lobby updates |

`PlayerView` (from `@repo/game-engine`): `{ me, vision, reveals, jeanLawTargetId, myVote, myVoteWeight, myCard, pending, game }`, where `game` is the `PublicView`: phase, round, `endsAt`, Leader, fail track, team size, players (roles only in POST_GAME), ministers, who voted or played, nominations, `lastBallot`, round results, endgame progress, outcome and results.

**Timers:** render a countdown from `view.game.endsAt` (epoch ms). The server runs the clock; the client never advances phases.

### Public events

`PHASE_CHANGED`, `NOMINATION_MADE`, `NOMINATION_TIMED_OUT`, `VOTE_CAST` (who, not how), `BALLOT_RESOLVED` (every vote + raw headcount), `CARD_PLAYED` (who, not which), `MISSION_RESOLVED` (shuffled cards + counts), `ROUND_DEADLOCKED`, `GUESS_REQUESTED`, `GUESS_RESOLVED`, `GAME_ENDED`. Private engine events never leave the server.

### Error codes

Transport: `UNAUTHORIZED`, `INVALID_PAYLOAD`, `RATE_LIMITED`, `ROOM_NOT_FOUND`, `NOT_IN_ROOM`, `NOT_HOST`, `GAME_ALREADY_STARTED`, `INVALID_PLAYER_COUNT`, `NO_GAME`, `INTERNAL`.
Engine (see `@repo/game-engine` `ErrorCode`): `WRONG_PHASE`, `NOT_LEADER`, `INVALID_TEAM_SIZE`, `UNKNOWN_PLAYER`, `DUPLICATE_PLAYER`, `ALREADY_VOTED`, `NOT_A_MINISTER`, `ALREADY_PLAYED`, `CARD_NOT_ALLOWED`, `NOT_YOUR_ABILITY`, `ABILITY_ALREADY_USED`, `INVALID_TARGET`, `NOT_YOUR_GUESS`, `NOT_IN_GAME`.

## Limits

- Per socket: chat 5 messages / 5 s; room and game events 10 / s. Over the limit → `RATE_LIMITED`.
- HTTP: 100 requests / minute / IP (`@fastify/rate-limit`).

## Server-side lifecycle

- Live state is held in memory and snapshotted to Redis (`game:<roomId>`, TTL 2 h) after every transition. On boot the API restores every snapshot and re-arms its timers. Without Redis it falls back to memory and logs a warning.
- At POST_GAME the match is written to Postgres once (`Match` …), the room becomes `FINISHED`, and the live state is dropped 30 min later.
- A lobby with no connected sockets is deleted after 10 min (cancelled if someone rejoins).

## Reconnect & disconnect (M7)

### Client reconnect flow

When a player's network drops and they reconnect:

1. Re-connect the socket (Socket.IO auto-reconnects by default).
2. Emit `room:join` with `{ roomId }`. The server cancels the grace-period timer and immediately re-sends `game:view` for that player.
3. Alternatively, emit `game:sync` — the server re-sends the view and also cancels the grace timer.

### Server grace-period auto-action

If a player is disconnected when they have a **mandatory** pending action, the server waits **30 seconds** and then acts on their behalf:

| Pending action | Auto-action |
|---|---|
| `vote` (BALLOT phase) | `CAST_VOTE { vote: "REJECT" }` |
| `playCard` (RESOLUTION phase) | `PLAY_CARD { card: allowedCards[0] }` (Greens → SUCCESS only) |
| `nominate` (SELECTION phase) | No auto-action — the phase timer handles nomination timeout |
| `guess` (ENDGAME phase) | No auto-action — the phase timer handles guess timeout |

The 30-second window is intentionally shorter than any phase timer so a player's inaction doesn't stall the game indefinitely.

### Presence events

`player:status` `{ userId, online: boolean }` is emitted to the room channel on every connect/disconnect. Clients should use this to show an offline indicator, **not** to gate game actions (the server enforces that).

## Removed

The old `round:proposeTeam`, `round:approvalVote`, `round:missionVote`, `endgame:guess`, `debussy:lockOn`, `jeanlaw:lock`, `user:identify` and the server events `role:assigned`, `round:*`, `guess:*`, `debussy:reveal`, `jeanlaw:lockConfirmed`, `game:end`. Everything they carried is in `game:view` / `game:event`.
