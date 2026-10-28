# Web Game Interface Architecture (M9)

This document describes the modernized, authoritative client gameplay architecture implemented in Next.js web application (`apps/web`).

---

## 1. Authoritative Server View Synchronization

The web client in `/room/[id]` operates strictly on the authoritative `PlayerView` dispatched from the Fastify socket server (`apps/api`):

1. **Connection & Authentication:**
   ```ts
   io(SOCKET_URL, {
     transports: ["websocket"],
     withCredentials: true,
     query: { roomId, userId: session.user.id },
   });
   ```
2. **Channel Subscription:**
   - The client emits `room:join` and `game:sync` on connection.
   - The server acknowledges and streams the caller's unique `game:view` payload.
3. **Reactive Re-renders:**
   - Instead of maintaining disparate client-side state variables (`currentPhase`, `roundNumber`, etc.), UI rendering is derived directly from `playerView` (`PlayerView` from `@repo/game-engine`).

---

## 2. Component Hierarchy

### `CountdownTimer` (`apps/web/components/CountdownTimer.tsx`)
- Reads the server's `view.game.endsAt` timestamp (epoch ms).
- Calculates remaining seconds synchronously with zero phase-advancement on the client: the engine ticks deadlines server-side.
- Displays urgent pulse warnings during final 10 seconds.

### `RoleCard` (`apps/web/components/RoleCard.tsx`)
- Displays the player's secret role, faction color badge, seat number, and ballot weight multiplier.
- Dynamically renders secret visions (`computeVision`) and reveals (`computeReveals`, such as De Bussy scans).

### `RoundTracker` (`apps/web/components/RoundTracker.tsx`)
- Tracks rounds 1 through 5, highlighting current attempt number and round outcomes (Green victory vs Red sabotage).
- Renders the 5-step Fail Track: 5 consecutive rejections trigger an automatic fail round assigned to Red.

### `ActionPanel` (`apps/web/components/ActionPanel.tsx`)
- Intelligently toggles available controls strictly according to `playerView.pending`:
  - `pending.nominate`: Interactive selection of minister seats up to required team size.
  - `pending.vote`: Approval ballot (`APPROVE` / `REJECT`).
  - `pending.playCard`: Mission resolution cards (`SUCCESS` / `SABOTAGE`) filtered by `pending.allowedCards`.
  - `pending.deBussyReveal`: Discussion targeting dialog for De Bussy.
  - `pending.jeanLawLock`: Discussion targeting dialog for Jean Law curse.
  - `pending.guess`: Endgame assassination guess dialog for Mir Jafar or Jagat Seth.

### `NominationHistoryCard` (`apps/web/components/NominationHistoryCard.tsx`)
- Renders detailed vote-by-vote breakdowns (`APPROVE` / `REJECT` and vote weights) for every previous nomination attempt within the Chronicle tab.

### `PostGameSummary` (`apps/web/components/PostGameSummary.tsx`)
- Activates on `POST_GAME` phase transition.
- Displays winning team, end reason, complete roster role unmasking, and individual win/loss credit.

---

## 3. Dispatched Socket Protocol

All player actions flow through `game:action`:
```ts
socket.emit("game:action", { roomId, action: { type, ...payload } }, ackCallback);
```
- Acknowledgment responses catch validation errors (`{ ok: false, error }`) and render toast alerts without desynchronizing state.
- Unsolicited public engine updates flow through `game:event` (`MISSION_RESOLVED`, `GAME_ENDED`) to play audio cues and transitions.
