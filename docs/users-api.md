# User Profiles & Progression API (M8)

This document describes the user profile, statistics, and career progression architecture for 1757 RPG.

---

## 1. Authentication & Identity

Every user route enforces authentication via BetterAuth sessions using `requireUser` (from `apps/api/src/lib/session.ts`). Session cookies (`credentials: "include"`) or bearer tokens are required. Request body `userId` parameters are strictly ignored to prevent identity spoofing.

---

## 2. Profile Endpoints

### `GET /api/users/me`
Fetches the currently authenticated user's complete profile and dynamic level.
- **Headers:** Cookies or `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "data": {
      "id": "u123",
      "name": "Nawab Siraj",
      "email": "siraj@murshidabad.gov",
      "username": "siraj_1757",
      "avatarId": "av-1",
      "xp": 450,
      "level": 2,
      "isAnonymous": false,
      "createdAt": "2026-10-26T12:00:00.000Z"
    },
    "success": true
  }
  ```

### `PATCH /api/users/me`
Updates editable profile fields.
- **Request Body:**
  ```json
  {
    "name": "Siraj-ud-Daulah",
    "username": "nawab_siraj",
    "avatarId": "av-nawab"
  }
  ```
- **Validation Rules:**
  - `name`: 1–50 characters.
  - `username`: 3–15 characters, alphanumeric and underscore (`^[a-zA-Z0-9_]{3,15}$`). Must be unique across all users.
  - `avatarId`: optional string.
- **Errors:**
  - `400 BAD REQUEST`: `INVALID_INPUT` (regex or length violation).
  - `409 CONFLICT`: `USERNAME_TAKEN` if another user has already claimed the username.

### `POST /users/update-profile` (Backward Compatibility)
Legacy endpoint for updating display names. Re-routed through session auth to ensure secure updates.

---

## 3. Career Statistics & Match History

### `GET /api/users/me/stats`
Returns career statistics compiled from finished matches (`MatchPlayer` rows in Postgres).
- **Response `200 OK`:**
  ```json
  {
    "data": {
      "userId": "u123",
      "username": "siraj_1757",
      "name": "Siraj-ud-Daulah",
      "avatarId": "av-nawab",
      "xp": 1250,
      "level": 4,
      "matchesPlayed": 12,
      "matchesWon": 8,
      "matchesLost": 4,
      "winRate": 67,
      "forfeits": 0,
      "humiliations": 1
    },
    "success": true
  }
  ```

### `GET /api/users/:userId/stats`
Public profile stats lookup for viewing other players' records in lobby or post-game screens.

### `GET /api/users/me/history`
Returns paginated match history.
- **Query Parameters:**
  - `limit`: default `10`, max `50`.
  - `offset`: default `0`.
- **Response `200 OK`:**
  ```json
  {
    "data": {
      "matches": [
        {
          "matchId": "m-99",
          "roomCode": "PLASY1",
          "endedAt": "2026-10-26T22:30:00.000Z",
          "role": "NAWAB_SIRAJ",
          "team": "GREEN",
          "won": true,
          "jeanLawLocked": false,
          "disconnectedForfeit": false,
          "playerCount": 10,
          "winner": "GREEN"
        }
      ],
      "total": 12
    },
    "success": true
  }
  ```

---

## 4. XP Progression & Level Calculations

XP is awarded atomically upon match completion when matches transition to `POST_GAME` (`saveMatch` in `apps/api/src/persistence/saveMatch.ts`):
- **Base Participation:** 50 XP
- **Match Victory:** +100 XP
- **Jean Law Lock Target:** +25 XP
- **Forfeit / Incomplete:** 0 XP

Levels scale linearly where level $L$ requires $L \times 200$ XP to advance to level $L+1$.
