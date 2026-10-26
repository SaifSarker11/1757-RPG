import { ALL_NAMED_ROLES, DEFAULT_SETTINGS, DISCUSSION_SECONDS } from "./config/gameConfig.js";
import type { GameSettings, NamedRoleId } from "./types.js";

/** Fills in defaults and validates host settings. Throws RangeError on bad input. */
export function resolveSettings(partial: Partial<GameSettings> = {}): GameSettings {
  const discussionSeconds = partial.discussionSeconds ?? DEFAULT_SETTINGS.discussionSeconds;
  if (
    !Number.isInteger(discussionSeconds) ||
    discussionSeconds < DISCUSSION_SECONDS.min ||
    discussionSeconds > DISCUSSION_SECONDS.max
  ) {
    throw new RangeError(
      `discussionSeconds must be an integer between ${DISCUSSION_SECONDS.min} and ${DISCUSSION_SECONDS.max}`
    );
  }

  const requested = partial.enabledRoles ?? DEFAULT_SETTINGS.enabledRoles;
  for (const role of requested) {
    if (!ALL_NAMED_ROLES.includes(role)) {
      throw new RangeError(`Unknown role: ${String(role)}`);
    }
  }
  const enabledRoles: NamedRoleId[] = [...new Set<NamedRoleId>(["NAWAB_SIRAJ", ...requested])];

  return { discussionSeconds, enabledRoles };
}
