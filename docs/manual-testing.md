# Manual Testing Guide — 1757 RPG Game

This document outlines the step-by-step instructions to run, coordinate, and manually test the **1757 RPG** game locally on a single machine or network devices.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
*   **Node.js** >= 18
*   **pnpm** (installed globally: `npm i -g pnpm`)
*   **Redis Server** (running locally on port 6379, or access to a hosted instance)
*   **PostgreSQL database** (or Neon PostgreSQL instance URL)

---

## 2. Environment Configuration

1. Copy `.env.example` at the root folder to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values:
   *   `DATABASE_URL`: Your PostgreSQL database connection string.
   *   `BETTER_AUTH_SECRET`: Generate a safe random string (e.g. run `npx @better-auth/cli secret`).
   *   `REDIS_HOST` (optional): If your Redis isn't running on `localhost`.
   *   `REDIS_PORT` (optional): If your Redis isn't running on `6379`.

---

## 3. Database Initialization

Run the Prisma push commands to synchronize the database schema and generate the Prisma Client:
```bash
pnpm db:generate
pnpm db:push
```

---

## 4. Launching the Services

Run the Turbo dev environment from the workspace root directory:
```bash
pnpm dev
```
This launches all applications concurrently:
*   **Web Client:** `http://localhost:3000`
*   **API Server (Fastify):** `http://localhost:3001`
*   **Admin Panel:** `http://localhost:3002`

---

## 5. Simulating Multiplayer Game Loops (Local Testing)

Since the game requires **6 to 15 players** to start, follow these steps to simulate 6 players on a single machine:

### Step 1: Open 6 Isolated Browser Sessions
To log in with 6 separate accounts, open distinct session containers or profiles:
1.  **Browser 1 (Host):** Standard Google Chrome (`http://localhost:3000`)
2.  **Browser 2:** Incognito Google Chrome window
3.  **Browser 3:** Firefox window
4.  **Browser 4:** Private Firefox window
5.  **Browser 5:** Microsoft Edge window
6.  **Browser 6:** Private Microsoft Edge window (or use Chrome profiles/another browser like Brave or Safari)

### Step 2: Login as Guests
1. On each of the 6 windows, navigate to `http://localhost:3000/login`.
2. Click the **"Continue as guest"** button. This automatically logs in an anonymous user with a unique session ID.

### Step 3: Create & Join a Room
1. On **Browser 1 (Host)**: 
   * Navigate to the room creation page or make a POST request to `/rooms` with body `{"hostUserId": "YOUR_USER_ID", "maxPlayers": 15}`.
   * *(Note: In the next visual phase, the Lobby screen will support creating rooms directly. For now, you can join using the socket room ID).*
2. Join all 6 browser sessions to the same `roomId` using the lobby join controls.
3. Verify that all 6 players are listed on the Lobby panel on all screens.

### Step 4: Run the Game Cycle
1.  **Start:** The host player (Browser 1) clicks **"Start Social Deduction"**.
2.  **Roles Vision:**
    *   Verify role assignments. (Check if Nawab Siraj sees the real Lutfunnesa + Tara Bai if present, Ghasheti Begum spy mask to Mohon Lal, etc.).
3.  **Discussion:**
    *   Observe the countdown timer ticking down from 120s.
    *   If you are **De Bussy**, click **"Scan Player"** next to a target to mutually reveal roles.
    *   If you are **Jean Law**, click **"Curse Player"** to curse a Green player.
4.  **Board Proposal:**
    *   The leader is highlighted. On their screen, they select the required number of players (e.g. 2 players in Round 1) and click **"Propose Minister Board"**.
5.  **Board Approval:**
    *   *Round 1 Exception:* Verify that Round 1 proposed board bypasses voting and immediately shows "APPROVED".
    *   *Round 2-5:* On all screens, vote **Approve** or **Reject**. Confirm that Yar Lutuf / Saint Frais votes count as double.
6.  **Secret Resolution:**
    *   Only ministers on the approved board get buttons to vote **GREEN** or **RED**.
    *   Cast votes. Check if a single RED vote (or 2 fails in Round 4 for 7+ players) correctly triggers a RED win.
7.  **Endgame Guessing:**
    *   If rounds complete with GREEN winning, verify that Mir Jafar gets a guess prompt on Mir Madan.
    *   Verify Jagat Seth guess logic (finding Rai Durlabh or Mir Jafar based on winner).
    *   Verify endgame final role reveals and Jean Law target humiliation badges.
