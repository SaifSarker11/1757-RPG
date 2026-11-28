import type { PlayerView, RoleId } from './game-types';

/** Only actual private ability reveals are identities; visions can be deliberate decoys. */
export function councilIdentity(view: PlayerView | null, playerId: string): RoleId | null {
  if (!view) return null;
  if (view.me.id === playerId) return view.me.role;
  if (view.game.phase === 'POST_GAME') {
    return view.game.players.find(p => p.id === playerId)?.role ?? null;
  }
  return view.reveals.find(p => p.playerId === playerId)?.role ?? null;
}

export const PHASE_LABELS: Record<string, string> = {
  LOBBY: 'Council convening', ROLE_REVEAL: 'The secret court', DISCUSSION: 'Council in session',
  SELECTION: 'Choose the ministers', RESOLUTION: 'Orders in motion', TEAM_PROPOSAL: 'Choose the ministers', NOMINATION: 'Choose the ministers',
  TEAM_VOTE: 'The council votes', VOTING: 'The council votes', BALLOT: 'The council votes',
  MISSION: 'Orders in motion', ROUND_RESULT: 'The battle turns', ENDGAME: 'The final reckoning',
  POST_GAME: 'The battle is over',
};
