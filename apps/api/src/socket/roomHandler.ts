import { Server, Socket } from "socket.io";
import { db, PlayerTeam, RoomStatus } from "@repo/db";
import redis from "../lib/redis";

async function hasActiveRedisGame(roomId: string): Promise<boolean> {
  const exists = await redis.exists(`game:${roomId}:state`);
  return exists === 1;
}

const ROUND_TEAM_SIZES: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 4,
};

const DISCUSSION_DURATION_MS = 120000;

async function broadcastOnlineUsers(io: Server) {
  try {
    const onlineUsersMap = new Map<string, { userId: string; username: string; socketId: string }>();
    for (const [id, s] of io.sockets.sockets) {
      const userId = s.data.userId;
      const username = s.data.username || "Guest";
      if (userId) {
        onlineUsersMap.set(userId, { userId, username, socketId: id });
      }
    }

    const onlineUsers = Array.from(onlineUsersMap.values());
    const userIds = onlineUsers.map((u) => u.userId);

    const activePlayers = await db.roomPlayer.findMany({
      where: { userId: { in: userIds } },
      include: { room: true },
    });

    const activeUserRoomMap = new Map<string, string>();
    for (const player of activePlayers) {
      if (player.room && player.room.status !== "FINISHED") {
        activeUserRoomMap.set(player.userId, player.roomId);
      }
    }

    const usersList = onlineUsers.map((u) => ({
      userId: u.userId,
      username: u.username,
      roomId: activeUserRoomMap.get(u.userId) || null,
    }));

    io.emit("online-users:update", usersList);
  } catch (error) {
    console.error("Error broadcasting online users:", error);
  }
}

export function registerRoomHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const socketRooms = new Set<string>();

    socket.on("user:identify", async ({ userId, username }: { userId: string; username: string }) => {
      if (!userId || typeof userId !== "string") return;
      socket.data.userId = userId;
      socket.data.username = username || "Anonymous";
      
      const privateRoom = `user:${userId}`;
      socket.join(privateRoom);
      socketRooms.add(privateRoom);

      await broadcastOnlineUsers(io);
    });

    socket.on("room:invite", ({ targetUserId, roomId, roomCode, hostName }: { targetUserId: string; roomId: string; roomCode: string; hostName: string }) => {
      if (!targetUserId || !roomId || !roomCode || !hostName) return;
      io.to(`user:${targetUserId}`).emit("room:invited", { roomId, roomCode, hostName });
    });

    socket.on("room:send-message", ({ roomId, username, text }: { roomId: string; username: string; text: string }) => {
      if (!roomId || !username || !text) return;
      const message = {
        id: Math.random().toString(36).substring(2, 11),
        username,
        text,
        timestamp: new Date().toISOString(),
      };
      io.to(roomId).emit("room:message", message);
    });

    socket.on("room:join", ({ roomId, userId }: { roomId: string; userId: string; socketId?: string }) => {
      if (!roomId || typeof roomId !== "string" || !userId || typeof userId !== "string") {
        socket.emit("room:error", { message: "roomId and userId required" });
        return;
      }

      socket.join(roomId);
      socketRooms.add(roomId);

      io.to(roomId).emit("game:join", { roomId, userId });
      broadcastOnlineUsers(io); // Update lobby statuses to in-room
    });

    socket.on("room:leave", ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || typeof roomId !== "string" || !userId || typeof userId !== "string") {
        return;
      }

      socket.leave(roomId);
      socketRooms.delete(roomId);

      io.to(roomId).emit("game:leave", { roomId, userId });
      broadcastOnlineUsers(io); // Update lobby statuses to idle
    });

    socket.on("round:propose-team", async ({ roomId, playerIds }: { roomId: string; playerIds: string[] }) => {
      const hasRedisGame = await hasActiveRedisGame(roomId);
      if (hasRedisGame) {
        return;
      }

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
        data: { selectedTeam: playerIds, phase: "TEAM_APPROVAL" },
      });

      io.to(roomId).emit("round:team-proposed", { playerIds, roundId: round.id });
    });

    socket.on("round:vote-team", async ({ roundId, playerId, vote }: { roundId: string; playerId: string; vote: "approve" | "reject" }) => {
      const round = await db.roundRecord.findUnique({
        where: { id: roundId },
      });

      if (!round) return;
      const hasRedisGame = await hasActiveRedisGame(round.roomId);
      if (hasRedisGame) return;

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
      const hasRedisGame = await hasActiveRedisGame(round.roomId);
      if (hasRedisGame) return;

      const currentVotes = (round.missionVotes as Record<string, string>) || {};
      currentVotes[playerId] = vote;

      const greenVotes = Object.values(currentVotes).filter((v: string) => v === "green").length;
      const redVotes = Object.values(currentVotes).filter((v: string) => v === "red").length;

      // Check if all proposed team members have voted
      const selectedTeam = Array.isArray(round.selectedTeam) ? round.selectedTeam : JSON.parse(round.selectedTeam as string);
      const votesReceived = Object.keys(currentVotes).filter((pId: string) => selectedTeam.includes(pId)).length;

      if (votesReceived >= selectedTeam.length) {
        let winner: PlayerTeam | null = null;
        const roundNum = round.roundNumber;

        if (roundNum === 4) {
          // Special Round 4 rule: Red needs at least 2 Red team members on team AND they vote red
          const teamMembers = await db.roomPlayer.findMany({
            where: { id: { in: selectedTeam } },
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
            data: { missionVotes: currentVotes, winner, greenVotes, redVotes, phase: "TRANSITION" },
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
              data: { status: RoomStatus.FINISHED },
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

    socket.on("disconnect", async () => {
      // Clean up socket room tracking
      socketRooms.clear();
      await broadcastOnlineUsers(io);
    });
  });
}


