# Developer & AI Agent Guidelines — 1757 RPG Game

This file defines the directory structure, style guidelines, core mechanics, and testing workflows for the **1757** project. Follow these guidelines strictly on every task.

---

## 1. Directory Structure

Ensure code is structured modularly. Avoid creating redundant folders (like mixing `services` and `game`).

```
apps/
  ├── api/              # Fastify API Server
  │     └── src/
  │          ├── routes/    # HTTP routes (e.g. rooms, auth)
  │          ├── socket/    # Socket.IO event handlers (chat, gameplay, connection)
  │          ├── game/      # Pure gameplay rules, state machine, and role assignments
  │          ├── lib/       # Shared utility clients (redis, db)
  │          └── index.ts   # Entry point
  ├── web/              # Next.js 16 Client App (Tailwind CSS v4)
  ├── mobile/           # Expo / React Native App
  └── admin/            # Next.js 16 Admin Panel
packages/
  ├── db/               # Prisma database schema and Client provider
  ├── auth/             # Better Auth configuration
  ├── types/            # TypeScript models and WebSocket payload definitions
  └── ui/               # Shared React UI components
```

---

## 2. Character Roles & Secret Powers

The game features 14 historical character roles divided into three factions: Green Team (Nawab Siraj loyalists), Red Team (Conspirators), and Gold Team (Wildcard).

### Green Team (Nawab Loyalists)
1.  **Nawab Siraj**: Can see Lutfunnesa throughout the game. If Tara Bai is in the game, he is flustered and sees both Lutfunnesa and Tara Bai as "Lutfunnesa".
2.  **Lutfunnesa**: Can see Nawab Siraj throughout the game. If Tara Bai is in the game, she is flustered and sees both Nawab Siraj and Tara Bai as "Nawab Siraj".
3.  **Mir Madan**: Sees all Red players (except Rai Durlabh) during the first round discussion phase (only knows they are Red).
4.  **Mohon Lal**: Sees Mir Madan and Ghasheti Begum as generic "spies" (doesn't know who is who).
5.  **Saint Frais**: His votes (board approval and mission resolution) count as double (weight = 2).
6.  **De Bussy**: Can lock onto a player during the discussion phase once per game to mutually reveal their roles. Rai Durlabh is NOT an exception.

### Red Team (East India Conspirators)
7.  **Mir Jafar**: Leader of Red. If Green wins 3 rounds, Mir Jafar gets a guess prompt in the endgame to guess Mir Madan. If correct, Red wins the game.
8.  **Ghasheti Begum**: Acts as a spy to confuse Mohon Lal.
9.  **Jean Law**: Can curse a Green player during the discussion phase once per game. Cursed Green player wins if Red wins, and loses if Green wins. They receive a "Humiliation" badge.
10. **Yar Lutuf**: His votes (board approval and mission resolution) count as double (weight = 2).
11. **Tara Bai**: Confuses Nawab Siraj and Lutfunnesa by appearing as their fake partner.
12. **Umichad**: Has no vision of who the other Red team conspirators are.
13. **Rai Durlabh**: Role is completely invisible to all players' standard vision (except De Bussy lock-on reveal).

### Gold Team (Wildcard)
14. **Jagat Seth**: Chaos banker. Guesses Rai Durlabh (if Red is winning) or Mir Jafar (if Green is winning) in the endgame. If correct, Jagat Seth wins *alone* (everyone else loses).

---

## 3. Game Flow & Rules

1.  **Player Count**: 6 to 15 players.
2.  **Lobby**: Hosts start the game when 6+ players join.
3.  **Round Loop (max 5 rounds)**:
    *   **Discussion phase** (120 seconds): Active timer. Players talk. De Bussy and Jean Law can declare locks.
    *   **Proposal phase**: A leader (first is random, subsequent leaders chosen clockwise based on join date) proposes a minister board of a specific size.
    *   **Voting phase**: Players vote on the proposed minister board.
        *   *Exception:* In **Round 1**, the proposed board is automatically approved (bypasses voting) and proceeds to Resolution.
        *   If rejected, rejection count increments. If rejection count reaches 3, RED wins.
    *   **Resolution phase**: Ministers on the approved board vote RED or GREEN secretly.
        *   If even a single RED vote (or 2 fails in Round 4 for 7+ players) is cast, the Red team wins the round.
        *   Otherwise, the Green team wins the round.
        *   Saint Frais / Yar Lutuf votes count as weight = 2. Yar Lutuf's RED vote counts as 2 fails.
    *   **Transition phase**: A new round starts with a new leader.
4.  **Endgame conditions**: First team to win 3 rounds triggers the endgame guessing phase. Jagat Seth and Mir Jafar execute target guesses to determine the final champion.

---

## 4. Coding Guidelines

*   **No Redundant Logic**: Do not duplicate business logic. Shared types belong in `packages/types`, shared DB code in `packages/db`, and unified API gameplay in `apps/api/src/game/`.
*   **CamelCase WebSocket Signatures**: Always use camelCase naming for Socket.IO actions (e.g., `round:proposeTeam` instead of hyphenated `round:propose-team`).
*   **Prisma + Redis Strategy**: Use Redis for high-frequency gameplay events (discussion timer, voting inputs) and write final round/game outcomes to Prisma PostgreSQL for persistence.
*   **Clickable File References**: When explaining code changes, reference file paths using markdown file scheme links, e.g., `[roles.ts](file:///d:/iut%20student%20life/labtasks/spl2/1757/apps/api/src/game/roles.ts)`.

---

## 5. Verification & Testing Workflows

*   Prior to code checkins, verify TypeScript compilation using `pnpm typecheck` from the root workspace directory.
*   Verify production builds using `pnpm build`.
*   Perform local manual verification of multiplayer game rounds by opening 6 browser sessions (regular, incognito, private, or separate browser containers) and logging in using the guest login feature.
