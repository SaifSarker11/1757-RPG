import {
  ALL_NAMED_ROLES,
  DEFAULT_SETTINGS,
  DISCUSSION_SECONDS,
  TOTAL_ROUNDS,
} from "./config/gameConfig.js";
import type { GameSettings, NamedRoleId } from "./types.js";

function checkDiscussionSeconds(value: number, name: string): void {
  if (!Number.isInteger(value) || value < DISCUSSION_SECONDS.min || value > DISCUSSION_SECONDS.max) {
    throw new RangeError(
      `${name} must be an integer between ${DISCUSSION_SECONDS.min} and ${DISCUSSION_SECONDS.max}`
    );
  }
}

/** Fills in defaults and validates host settings. Throws RangeError on bad input. */
export function resolveSettings(partial: Partial<GameSettings> = {}): GameSettings {
  const discussionSeconds = partial.discussionSeconds ?? DEFAULT_SETTINGS.discussionSeconds;
  checkDiscussionSeconds(discussionSeconds, "discussionSeconds");

  const requested = partial.enabledRoles ?? DEFAULT_SETTINGS.enabledRoles;
  for (const role of requested) {
    if (!ALL_NAMED_ROLES.includes(role)) {
      throw new RangeError(`Unknown role: ${String(role)}`);
    }
  }
  const enabledRoles: NamedRoleId[] = [...new Set<NamedRoleId>(["NAWAB_SIRAJ", ...requested])];

  const perRound = partial.roundDiscussionSeconds ?? [];
  if (perRound.length > TOTAL_ROUNDS) {
    throw new RangeError(`roundDiscussionSeconds has at most ${TOTAL_ROUNDS} entries`);
  }
  perRound.forEach((seconds, i) => checkDiscussionSeconds(seconds, `roundDiscussionSeconds[${i}]`));

  return perRound.length > 0
    ? { discussionSeconds, enabledRoles, roundDiscussionSeconds: [...perRound] }
    : { discussionSeconds, enabledRoles };
}
