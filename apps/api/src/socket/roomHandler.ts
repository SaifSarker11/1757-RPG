import { Server, Socket } from "socket.io";
import { db, PlayerTeam, RoomStatus } from "@repo/db";

const ROUND_TEAM_SIZES: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 4,
};

const DISCUSSION_DURATION_MS = 120000;

export function registerRoomHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const socketRooms = new Set<string>();

    socket.on("room:join", ({ roomId, userId }: { roomId: string; userId: string; socketId?: string }) => {
      if (!roomId || typeof roomId !== "string" || !userId || typeof userId !== "string") {
        socket.emit("room:error", { message: "roomId and userId required" });
        return;
      }

      socket.join(roomId);
      socketRooms.add(roomId);

      io.to(roomId).emit("game:join", { roomId, userId });
    });

    socket.on("room:leave", ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || typeof roomId !== "string" || !userId || typeof userId !== "string") {
        return;
      }

      socket.leave(roomId);
      socketRooms.delete(roomId);

      io.to(roomId).emit("game:leave", { roomId, userId });
    });

    socket.on("round:propose-team", async ({ roomId, playerIds }: { roomId: string; playerIds: string[] }) => {
      const room = await db.room.findUnique({
        where: { id: roomId },
        include: { rounds: { orderBy: { roundNumber: "desc" }, take: 1 } },
      });

      if (!room) return;
      const round = room.rounds[0];
      if (!round) return;

      const teamSize = ROUND_TEAM_SIZES[round.roundNumber] ?? 2;
      if (playerIds.length !== teamSize) {
        socket.emit("error", { message: `Team must have exactly ${teamSize} players` });
        return;
      }

      await db.roundRecord.update({
        where: { id: round.id },
        data: { proposedTeam: playerIds, phase: "TEAM_APPROVAL" },
      });

      io.to(roomId).emit("round:team-proposed", { playerIds, roundId: round.id });
    });

    socket.on("round:vote-team", async ({ roundId, playerId, vote }: { roundId: string; playerId: string; vote: "approve" | "reject" }) => {
      const round = await db.roundRecord.findUnique({
        where: { id: roundId },
      });

      if (!round) return;

      if (round.phase !== "TEAM_APPROVAL") return;

      const currentVotes = (round.teamVotes as Record<string, string>) || {};
      currentVotes[playerId] = vote;

      const approves = Object.values(currentVotes).filter((v: string) => v === "approve").length;
      const totalVotes = Object.keys(currentVotes).length;
      const totalPlayers = await db.roomPlayer.count({ where: { roomId: round.roomId } });

      const isApproved = approves > totalPlayers / 2;
      const rejects = totalVotes - approves;
      const majority = Math.floor(totalPlayers / 2) + 1;
      const earlyDecide = approves >= majority || rejects >= majority;

      if (earlyDecide || totalVotes >= totalPlayers) {
        const phase = isApproved ? "MISSION_VOTE" : "DISCUSSION";
        
        const updatedRound = await db.roundRecord.update({
          where: { id: roundId },
          data: { teamVotes: currentVotes, phase },
        });

        io.to(updatedRound.roomId).emit("round:team-vote-complete", { approved: isApproved, votes: currentVotes });
      } else {
        await db.roundRecord.update({
          where: { id: roundId },
          data: { teamVotes: currentVotes },
        });
      }
    });

    socket.on("round:vote-mission", async ({ roundId, playerId, vote }: { roundId: string; playerId: string; vote: "green" | "red" }) => {
      const round = await db.roundRecord.findUnique({
        where: { id: roundId },
        include: { room: true },
      });

      if (!round) return;

      const currentVotes = (round.missionVotes as Record<string, string>) || {};
      currentVotes[playerId] = vote;

      const greenVotes = Object.values(currentVotes).filter((v: string) => v === "green").length;
      const redVotes = Object.values(currentVotes).filter((v: string) => v === "red").length;

      // Check if all proposed team members have voted
      const proposedTeam = Array.isArray(round.proposedTeam) ? round.proposedTeam : JSON.parse(round.proposedTeam as string);
      const votesReceived = Object.keys(currentVotes).filter((pId: string) => proposedTeam.includes(pId)).length;

      if (votesReceived >= proposedTeam.length) {
        let winner: PlayerTeam | null = null;
        const roundNum = round.roundNumber;

        if (roundNum === 4) {
          // Special Round 4 rule: Red needs at least 2 Red team members on team AND they vote red
          const teamMembers = await db.roomPlayer.findMany({
            where: { id: { in: proposedTeam } },
          });
          const redTeamOnMission = teamMembers.filter((m: { team: PlayerTeam | null }) => m.team === PlayerTeam.RED).length;
          
          if (redTeamOnMission >= 2 && redVotes >= redTeamOnMission) {
            winner = PlayerTeam.RED;
          } else {
            winner = PlayerTeam.GREEN;
          }
        } else {
          winner = redVotes > 0 ? PlayerTeam.RED : PlayerTeam.GREEN;
        }

        await db.$transaction(async (tx) => {
          await tx.roundRecord.update({
            where: { id: roundId },
            data: { missionVotes: currentVotes, winner, greenVoteCount: greenVotes, redVoteCount: redVotes, phase: "TRANSITION" },
          });

          if (winner === PlayerTeam.GREEN) {
            await tx.room.update({
              where: { id: round.roomId },
              data: { greenWins: { increment: 1 } },
            });
          } else if (winner === PlayerTeam.RED) {
            await tx.room.update({
              where: { id: round.roomId },
              data: { redWins: { increment: 1 } },
            });
          }

          const updatedRoom = await tx.room.findUnique({
            where: { id: round.roomId },
          });

          if (updatedRoom && (updatedRoom.greenWins >= 3 || updatedRoom.redWins >= 3)) {
            await tx.room.update({
              where: { id: round.roomId },
              data: { status: winner === PlayerTeam.GREEN ? RoomStatus.GREEN_WIN : RoomStatus.RED_WIN },
            });
          }
        });

        io.to(round.roomId).emit("round:mission-vote-complete", { winner, greenVotes, redVotes });
      } else {
        await db.roundRecord.update({
          where: { id: roundId },
          data: { missionVotes: currentVotes },
        });
      }
    });

    socket.on("disconnect", () => {
      // Clean up socket room tracking
      socketRooms.clear();
    });
  });
}


