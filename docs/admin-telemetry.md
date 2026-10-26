# Admin Dashboard & Game Telemetry (M10)

This document describes the administrative reporting, match analytics, and user moderation architecture for 1757 RPG.

---

## 1. Authentication & Security

All admin endpoints require an authenticated BetterAuth session using `requireUser`:
- Requests lacking a valid session cookie or bearer token receive `401 Unauthorized`.
- Credentials must be sent with `credentials: "include"`.

---

## 2. API Endpoints

### `GET /api/admin/overview`
Returns global server telemetry:
```json
{
  "data": {
    "totalUsers": 48,
    "registeredUsers": 35,
    "anonymousUsers": 13,
    "totalRooms": 22,
    "activeRooms": 3,
    "finishedMatches": 18,
    "greenWins": 11,
    "redWins": 6,
    "goldWins": 1,
    "winRateGreen": 61,
    "winRateRed": 33,
    "averagePlayerCount": 8.4
  },
  "success": true
}
```

### `GET /api/admin/matches`
Returns paginated list of completed matches.
- **Query Parameters:**
  - `limit`: default `20`, max `100`.
  - `offset`: default `0`.
  - `search`: optional room code query.

### `GET /api/admin/users`
Returns user directory with account statuses.
- **Query Parameters:**
  - `limit`: default `20`, max `100`.
  - `offset`: default `0`.
  - `search`: search by name, username, or email.

### `GET /api/admin/rooms/active`
Returns live lobbies (`WAITING`) and matches in progress (`IN_PROGRESS`) with connected player counts.

### `PATCH /api/admin/users/:userId`
Moderates a user's account details (e.g., updating inappropriate display names):
- **Body:** `{ "name": "Renamed Conspirator" }`
- **Response:** Updated user record.

---

## 3. Web Admin Dashboard (`apps/admin`)

The Next.js admin app (`apps/admin/app/home/page.tsx`) provides a control console:
- **Telemetry Grid:** High-level metrics for user registrations, match completions, average room player counts, and faction win rate balances.
- **Match Logs:** Tabular audit log displaying final scores, win reasons, and room codes.
- **User Directory:** Paginated user list with moderation action hooks (such as name renaming).
