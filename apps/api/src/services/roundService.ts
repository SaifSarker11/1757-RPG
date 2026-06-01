import { db, PlayerTeam } from "@repo/db";

const ROUND_TEAM_SIZES: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 4,
};

const DISCUSSION_DURATION_MS = 120000;

export interface PhaseTransition {
  phase: "DISCUSSION" | "TEAM_PROPOSAL" | "TEAM_APPROVAL" | "MISSION_VOTE" | "TRANSITION";
  roundId: string;
}

export async function advancePhase(
  roomId: string,
  phase: string,
): Promise<PhaseTransition | null> {
  const round = await db.roundRecord.findFirst({
    where: { roomId },
    orderBy: { roundNumber: "desc" },
  });

  if (!round) return null;

  const phases: Array<"DISCUSSION" | "TEAM_PROPOSAL" | "TEAM_APPROVAL" | "MISSION_VOTE" | "TRANSITION"> = [
    "DISCUSSION", "TEAM_PROPOSAL", "TEAM_APPROVAL", "MISSION_VOTE", "TRANSITION",
  ];

  const currentIndex = phases.indexOf(phase as typeof phases[number]);
  
  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return null;
  }

  const nextPhase = phases[currentIndex + 1];

  await db.roundRecord.update({
    where: { id: round.id },
    data: { phase: nextPhase },
  });

  return { phase: nextPhase, roundId: round.id };
}

export async function calculateRoundWinner(
  roundId: string,
): Promise<PlayerTeam | null> {
  const round = await db.roundRecord.findUnique({
    where: { id: roundId },
    include: { room: true },
  });

  if (!round || !round.missionVotes) return null;

  const votes = round.missionVotes as Record<string, string>;
  const greenVotes = Object.values(votes).filter((v: string) => v === "green").length;
  const redVotes = Object.values(votes).filter((v: string) => v === "red").length;

  if (round.roundNumber === 4) {
    const proposedTeam = round.proposedTeam;
    const teamMembers = await db.roomPlayer.findMany({
      where: { id: { in: proposedTeam } },
    });
    const redTeamOnMission = teamMembers.filter((m: { team: PlayerTeam | null }) => m.team === PlayerTeam.RED).length;
    
    if (redTeamOnMission >= 2 && redVotes >= redTeamOnMission) {
      return PlayerTeam.RED;
    }
    return PlayerTeam.GREEN;
  }

  return redVotes > 0 ? PlayerTeam.RED : PlayerTeam.GREEN;
}

export async function getNextSelector(roomId: string, currentSelectorId: string | null): Promise<string | null> {
  const players = await db.roomPlayer.findMany({
    where: { roomId },
  });

  const eligible = currentSelectorId 
    ? players.filter((p: { id: string }) => p.id !== currentSelectorId)
    : players;

  if (eligible.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex].id;
}

export function getTeamSizeForRound(roundNumber: number): number {
  return ROUND_TEAM_SIZES[roundNumber] ?? 2;
}

export { DISCUSSION_DURATION_MS };