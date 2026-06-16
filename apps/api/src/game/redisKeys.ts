export const GAME_STATE_TTL_SECONDS = 7200;

export function gameStateKey(roomId: string): string {
  return `game:${roomId}:state`;
}

export function approvalVotesKey(roomId: string): string {
  return `game:${roomId}:approvalVotes`;
}

export function missionVotesKey(roomId: string): string {
  return `game:${roomId}:missionVotes`;
}

export function playersKey(roomId: string): string {
  return `game:${roomId}:players`;
}

export function selectedTeamKey(roomId: string): string {
  return `game:${roomId}:selectedTeam`;
}

export function deBussyUsedKey(roomId: string): string {
  return `game:${roomId}:deBussyUsed`;
}

export function jeanLawTargetKey(roomId: string): string {
  return `game:${roomId}:jeanLawTarget`;
}

export function allKeys(roomId: string): string[] {
  return [
    gameStateKey(roomId),
    approvalVotesKey(roomId),
    missionVotesKey(roomId),
    playersKey(roomId),
    selectedTeamKey(roomId),
    deBussyUsedKey(roomId),
    jeanLawTargetKey(roomId),
  ];
}
