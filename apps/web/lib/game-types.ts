/**
 * Types representing the authoritative server view sent as `game:view` to each player.
 * Re-exported from the engine so the client can never drift from what the server sends.
 */

export type {
  PlayerView,
  PublicView,
  PublicPlayer,
  PendingActions,
  VisionEntry,
  VisionLabel,
  RevealEntry,
  NominationRecord as PublicNomination,
  RoleId,
  Team,
} from "@repo/game-engine";
