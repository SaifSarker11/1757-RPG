import { Server, Socket } from "socket.io";
import { db, PlayerRole, PlayerTeam } from "@repo/db";
import { assignRoles, buildPrivateRoleInfo } from "../game/roles.js";
import { RoleName, TeamName, IRoleAssignment } from "@repo/types";
import {
  initGameState,
  startDiscussionPhase,
  handleTeamProposal,
  handleApprovalVote,
  handleMissionVote,
  handleEndgameGuess,
  handleDebussyLockOn,
  handleJeanLawLock,
} from "../game/engine.js";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

const chatHistory: ChatMessage[] = [];
const roomChatHistories = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 100;

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    // Auto join lobby room for global chat scoping
    socket.join("lobby");

    // Send chat history upon connection
    socket.emit("chat:history", chatHistory);

    // Identify user to link socket connection to a specific user ID
    socket.on("user:identify", (data: { userId: string }) => {
      if (!data || !data.userId) return;
      socket.data.userId = data.userId;
    });

    // Chat events
    socket.on("chat:send-message", (data: { roomId?: string; userId: string; username: string; text: string }) => {
      if (!data || typeof data.text !== "string" || !data.username || !data.userId) {
        return;
      }

      const message: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        userId: data.userId,
        username: data.username,
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      const targetRoom = data.roomId ?? "lobby";

      if (targetRoom === "lobby") {
        chatHistory.push(message);
        if (chatHistory.length > MAX_HISTORY) {
          chatHistory.shift();
        }
      } else {
        if (!roomChatHistories.has(targetRoom)) {
          roomChatHistories.set(targetRoom, []);
        }
        const history = roomChatHistories.get(targetRoom)!;
        history.push(message);
        if (history.length > MAX_HISTORY) {
          history.shift();
        }
      }

      io.to(targetRoom).emit("chat:message", message);
    });

    // Lobby / Room events
    socket.on("room:join", async ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || !userId) {
        socket.emit("room:error", { message: "roomId and userId required" });
        return;
      }
      socket.leave("lobby");
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      // Send the private room's chat history to the joining client
      const history = roomChatHistories.get(roomId) || [];
      socket.emit("chat:history", history);

      io.to(roomId).emit("game:join", { roomId, userId });

      // Notify others this player is online
      io.to(roomId).emit("player:status", { userId, online: true });

      // Retrieve list of all current online player userIds in the room
      const activeSockets = await io.in(roomId).fetchSockets();
      const onlineUserIds = activeSockets.map((s) => s.data.userId).filter(Boolean);
      socket.emit("room:online-list", onlineUserIds);
    });

    socket.on("room:leave", ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || !userId) return;
      socket.leave(roomId);
      socket.join("lobby");
      socket.data.roomId = null;
      io.to(roomId).emit("game:leave", { roomId, userId });
      io.to(roomId).emit("player:status", { userId, online: false });
    });

    // Game starting events
    socket.on("game:start", async (data: { roomId: string; hostUserId: string }) => {
      try {
        if (!data || !data.roomId || !data.hostUserId) {
          socket.emit("error", { message: "Invalid payload" });
          return;
        }

        const room = await db.room.findUnique({
          where: { id: data.roomId },
          include: { players: true },
        });

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.hostUserId !== data.hostUserId) {
          socket.emit("error", { message: "Only the host can start the game" });
          return;
        }
        if (room.status !== "WAITING") {
          socket.emit("error", { message: "Room is not waiting to start" });
          return;
        }

        const playerCount = room.players.length;
        if (playerCount < 6 || playerCount > 15) {
          socket.emit("error", { message: "Player count must be between 6 and 15" });
          return;
        }

        const userIds = room.players.map((p) => p.userId);
        const assignments: IRoleAssignment[] = assignRoles(userIds, playerCount);

        // Update database with role/team assignments
        await db.$transaction(
          assignments.map((assignment) =>
            db.roomPlayer.updateMany({
              where: {
                roomId: room.id,
                userId: assignment.userId,
              },
              data: {
                role: PlayerRole[assignment.role.toUpperCase() as keyof typeof PlayerRole],
                team: PlayerTeam[assignment.team.toUpperCase() as keyof typeof PlayerTeam],
              },
            })
          )
        );

        const updatedRoom = await db.room.findUnique({
          where: { id: room.id },
          include: { players: true },
        });

        if (!updatedRoom) {
          socket.emit("error", { message: "Failed to fetch updated room" });
          return;
        }

        // Send customized role assigned information to each individual player socket
        for (const player of updatedRoom.players) {
          let targetSocket: Socket | null = null;
          for (const [, s] of io.sockets.sockets) {
            if ((s as Socket).data?.userId === player.userId) {
              targetSocket = s;
              break;
            }
          }

          if (targetSocket) {
            const roleKey = Object.keys(PlayerRole).find(
              (k) => PlayerRole[k as keyof typeof PlayerRole] === player.role
            );
            const teamKey = Object.keys(PlayerTeam).find(
              (k) => PlayerTeam[k as keyof typeof PlayerTeam] === player.team
            );
            const roleString = (roleKey?.toLowerCase() ?? "") as RoleName;
            const teamString = (teamKey?.toLowerCase() ?? "") as TeamName;

            const privateInfo = buildPrivateRoleInfo(
              {
                userId: player.userId,
                role: roleString,
                team: teamString,
              },
              assignments
            );

            targetSocket.emit("role:assigned", privateInfo);
          }
        }

        await db.room.update({
          where: { id: room.id },
          data: { status: "IN_PROGRESS" },
        });

        io.to(room.id).emit("game:started");

        // First selector chosen randomly, subsequent leaders will proceed clockwise
        const firstSelectorId = userIds[Math.floor(Math.random() * userIds.length)];
        
        // Update first selector state in database
        await db.roomPlayer.updateMany({
          where: { roomId: room.id, userId: firstSelectorId },
          data: { isSelector: true },
        });

        await initGameState(room.id, userIds, firstSelectorId);
        await startDiscussionPhase(room.id, io);

        socket.emit("game:started");
      } catch (error) {
        console.error("Error in game:start handler:", error);
        socket.emit("error", { message: "Internal server error" });
      }
    });

    // Propose team for current round
    socket.on(
      "round:proposeTeam",
      async (data: { roomId: string; selectorId: string; playerIds: string[] }) => {
        try {
          if (!data || !data.roomId || !data.selectorId || !Array.isArray(data.playerIds)) {
            socket.emit("error", { message: "Invalid team proposal payload" });
            return;
          }
          await handleTeamProposal(data.roomId, data.selectorId, data.playerIds, io);
        } catch (error) {
          console.error("Error in round:proposeTeam handler:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    // Vote on board approval
    socket.on(
      "round:approvalVote",
      async (data: { roomId: string; userId: string; vote: "approve" | "reject" }) => {
        try {
          if (!data || !data.roomId || !data.userId || !data.vote) {
            socket.emit("error", { message: "Invalid approval vote payload" });
            return;
          }
          const userId = socket.data.userId ?? data.userId;
          await handleApprovalVote(data.roomId, userId, data.vote, io);
        } catch (error) {
          console.error("Error in round:approvalVote handler:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    // Vote on secret mission resolution (GREEN or RED)
    socket.on(
      "round:missionVote",
      async (data: { roomId: string; userId: string; vote: "green" | "red" }) => {
        try {
          if (!data || !data.roomId || !data.userId || !data.vote) {
            socket.emit("error", { message: "Invalid mission vote payload" });
            return;
          }
          const userId = socket.data.userId ?? data.userId;
          await handleMissionVote(data.roomId, userId, data.vote, io);
        } catch (error) {
          console.error("Error in round:missionVote handler:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    // Endgame target guesses (Mir Jafar or Jagat Seth guesses)
    socket.on(
      "endgame:guess",
      async (data: {
        roomId: string;
        userId: string;
        targetUserId: string;
        guessType: "team" | "role";
      }) => {
        try {
          if (!data || !data.roomId || !data.userId || !data.targetUserId || !data.guessType) {
            socket.emit("error", { message: "Invalid endgame guess payload" });
            return;
          }
          const userId = socket.data.userId ?? data.userId;
          await handleEndgameGuess(data.roomId, userId, data.targetUserId, data.guessType, io);
        } catch (error) {
          console.error("Error in endgame:guess handler:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    // Special Lock Powers: De Bussy
    socket.on(
      "debussy:lockOn",
      async (data: { roomId: string; userId: string; targetUserId: string }) => {
        try {
          if (!data || !data.roomId || !data.userId || !data.targetUserId) {
            socket.emit("error", { message: "Invalid debussy lock payload" });
            return;
          }
          const userId = socket.data.userId ?? data.userId;
          await handleDebussyLockOn(data.roomId, userId, data.targetUserId, io);
        } catch (error) {
          console.error("Error in debussy:lockOn handler:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    // Special Lock Powers: Jean Law
    socket.on(
      "jeanlaw:lock",
      async (data: { roomId: string; userId: string; targetUserId: string }) => {
        try {
          if (!data || !data.roomId || !data.userId || !data.targetUserId) {
            socket.emit("error", { message: "Invalid jean law lock payload" });
            return;
          }
          const userId = socket.data.userId ?? data.userId;
          await handleJeanLawLock(data.roomId, userId, data.targetUserId, io);
        } catch (error) {
          console.error("Error in jeanlaw:lock handler:", error);
          socket.emit("error", { message: "Internal server error" });
        }
      }
    );

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      const userId = socket.data.userId;
      if (roomId && userId) {
        io.to(roomId).emit("player:status", { userId, online: false });
      }
    });
  });
}
