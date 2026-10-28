# Rooms & lobby API

All writes need a signed-in BetterAuth session (cookie or bearer token); send fetches with `credentials: "include"`. The caller is always taken from the session. Any `userId` / `hostUserId` in a body is ignored.

Errors look like `{ "error": "<message>", "code": "<CODE>", "success": false }`.

## REST

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/rooms` | — | — | `{ rooms: LobbyListing[] }`: open public lobbies, newest first |
| POST | `/rooms` | ✓ | `{ maxPlayers?, discussionSeconds?, enabledRoles?, isPublic? }` | 201 `{ roomId, code, status, maxPlayers, hostUserId }` |
| POST | `/rooms/quick-join` | ✓ | — | `{ roomId, userId, playerCount }`: the fullest open public room |
| GET | `/rooms/code/:code` | — | — | `{ roomId, code }`; exact 6-character code, case-insensitive |
| GET | `/rooms/:roomId` | — | — | `RoomDetail` |
| POST | `/rooms/:roomId/join` | ✓ | — | `{ roomId, userId, playerCount }` |
| POST | `/rooms/:roomId/leave` | ✓ | — | `{ roomId, userId, newHostUserId }` |
| PATCH | `/rooms/:roomId/settings` | ✓ host | any of the create fields (at least one) | `RoomDetail` |
| POST | `/rooms/:roomId/kick` | ✓ host | `{ userId }` | `{ roomId, userId }`; the user is banned from this room |

Settings bounds come from `@repo/game-engine`: maxPlayers 6–15, discussionSeconds 30–300, enabledRoles any named roles (Nawab Siraj is always in).

`POST /rooms/:roomId/start` was removed: the game starts over the socket (`game:start`).

### Error codes

| Code | Status | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | No session |
| `INVALID_INPUT` | 400 | Body or params failed validation |
| `ROOM_NOT_FOUND` | 404 | |
| `NO_OPEN_ROOM` | 404 | Quick Join found nothing |
| `NOT_IN_ROOM` | 404 | Leave/kick target isn't a member |
| `ALREADY_IN_ROOM` | 409 | Message is exactly "User already in room" |
| `GAME_ALREADY_STARTED` | 409 | Join, kick or settings after the lobby |
| `GAME_IN_PROGRESS` | 409 | Leave while a game runs (that's a disconnect) |
| `ROOM_FULL` | 409 | |
| `MAX_BELOW_PLAYER_COUNT` | 409 | Settings: maxPlayers below the current count |
| `BANNED` | 403 | The host kicked this user |
| `NOT_HOST` | 403 | |
| `CANNOT_KICK_SELF` | 400 | |

### Shapes

```ts
RoomDetail = {
  id, code, hostUserId, status, maxPlayers, playerCount,
  isPublic, discussionSeconds, enabledRoles, inviteUrl,
  currentRound, greenWins, redWins,
  rolesInPlay: string[],                       // sorted; which roles, never who holds them
  players: { userId: string; name: string }[]  // join order; no roles or teams
}
LobbyListing = { id, code, hostName, playerCount, maxPlayers, discussionSeconds }
```

## Host migration

When the host leaves, the player who has been in the room longest becomes host, preferring online players once presence is tracked. The last player leaving deletes the room.

## Socket events (server → client)

| Event | Channel | Payload |
|---|---|---|
| `lobby:list` | `lobby` | `LobbyListing[]` after any lobby change |
| `room:update` | the room id | `RoomDetail` after a join, leave, kick or settings change |
| `room:settings` | the room id | `{ maxPlayers, discussionSeconds, enabledRoles, isPublic }` |
| `room:kicked` | `user:<id>` | `{ roomId }` (needs the realtime layer to join sockets to `user:<id>`) |
| `room:player-kicked` | the room id | `{ userId }` |
