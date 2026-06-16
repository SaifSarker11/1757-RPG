import { Server } from "socket.io";
import { db, PlayerRole, PlayerTeam, RoomStatus } from "@repo/db";
import type { GamePhase, GameEndPayload, RoleName } from "@repo/types";
import redis from "../lib/redis";
import { allKeys, approvalVotesKey, gameStateKey, missionVotesKey, selectedTeamKey, playersKey, deBussyUsedKey, jeanLawTargetKey } from "./redisKeys";
import { ROUND_TEAM_SIZES } from "./roundConfig";

export const SHUFFLE_DISCUSSION_DURATION_MS = 120000;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function getRedisState(roomId: string): Promise<Record<string, string | undefined>> {
  return redis.hgetall(gameStateKey(roomId));
}

async function setRedisState(roomId: string, data: Record<string, string>): Promise<void> {
  await redis.hmset(gameStateKey(roomId), data);
  await redis.expire(gameStateKey(roomId), 7200);
}

async function getPhase(roomId: string): Promise<GamePhase> {
  const state = await getRedisState(roomId);
  return (state.phase as GamePhase) ?? "DISCUSSION";
}

async function setPhase(roomId: string, phase: GamePhase): Promise<void> {
  await setRedisState(roomId, { phase });
}

async function emitToRoom(io: Server, roomId: string, event: string, data: unknown): Promise<void> {
  io.to(roomId).emit(event, data);
}

async function emitPrivate(io: Server, socketId: string, event: string, data: unknown): Promise<void> {
  const sockets = io.sockets.sockets;
  const socket = sockets.get(socketId);
  if (socket) {
    socket.emit(event, data);
  }
}

async function findSocketForUser(io: Server, userId: string): Promise<{ id: string; emit: (event: string, data: unknown) => void } | null> {
  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    if ("data" in socket && typeof socket.data === "object" && (socket.data as { userId?: string }).userId === userId) {
      return socket as unknown as { id: string; emit: (event: string, data: unknown) => void };
    }
  }
  return null;
}

export async function initGameState(roomId: string, playerIds: string[], firstSelectorId: string): Promise<void> {
  const ttlSeconds = 7200;
  await redis.hmset(gameStateKey(roomId), {
    phase: "DISCUSSION",
    round: "1",
    selectorId: firstSelectorId,
    rejectionCount: "0",
  });
  await redis.expire(gameStateKey(roomId), ttlSeconds);
  if (playerIds.length > 0) {
    await redis.sadd(playersKey(roomId), playerIds);
    await redis.expire(playersKey(roomId), ttlSeconds);
  }
  await redis.set(deBussyUsedKey(roomId), "0");
  await redis.expire(deBussyUsedKey(roomId), ttlSeconds);
  await redis.set(jeanLawTargetKey(roomId), "");
  await redis.expire(jeanLawTargetKey(roomId), ttlSeconds);
}

export async function clearGameState(roomId: string): Promise<void> {
  const keys = allKeys(roomId);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function startDiscussionPhase(roomId: string, io: Server): Promise<void> {
  await setPhase(roomId, "DISCUSSION");
  const state = await getRedisState(roomId);
  const round = parseInt(state.round ?? "1", 10);
  const selectorId = state.selectorId ?? "";

  await emitToRoom(io, roomId, "round:phase", {
    phase: "DISCUSSION",
    round,
    duration: 120,
  });

  if (round === 1) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { include: { user: true } } },
    });
    const mirMadanPlayer = room?.players.find(
      (p: { role: PlayerRole | null }) => p.role === PlayerRole.MIR_MADAN
    );
    if (mirMadanPlayer) {
      const allAssignments = await db.roomPlayer.findMany({
        where: { roomId },
        include: { user: { select: { id: true, name: true } } },
      });

      const visiblePlayers = allAssignments
        .filter(
          (p: { role: PlayerRole | null; team: PlayerTeam | null }) =>
            p.team === PlayerTeam.RED && p.role !== PlayerRole.RAI_DURLABH
        )
        .map((p: { userId: string; user: { name: string } | null; role: PlayerRole | null }) => ({
          userId: p.userId,
          role: p.role?.toLowerCase() ?? "",
          team: "red" as const,
        }));

      const targetSocket = await findSocketForUser(io, mirMadanPlayer.userId);
      if (targetSocket) {
        targetSocket.emit("round:mirMadanVision", { visiblePlayers });
      }
    }
  }
}

export async function handleTeamProposal(roomId: string, selectorId: string, proposedTeam: string[], io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  const phase = state.phase;

  if (phase === "ENDGAME") {
    return;
  }

  if (state.selectorId !== selectorId) {
    await emitToRoom(io, roomId, "room:error", { message: "You are not the current selector" });
    return;
  }

  const currentRound = parseInt(state.round ?? "1", 10);
  const expectedSize = ROUND_TEAM_SIZES[currentRound] ?? 4;
  if (proposedTeam.length !== expectedSize) {
    await emitToRoom(io, roomId, "room:error", { message: `Team must have exactly ${expectedSize} players for round ${currentRound}` });
    return;
  }

  await redis.sadd(selectedTeamKey(roomId), proposedTeam);
  await redis.expire(selectedTeamKey(roomId), 7200);
  await setPhase(roomId, "TEAM_APPROVAL");
  await redis.hmset(approvalVotesKey(roomId), {});
  await redis.expire(approvalVotesKey(roomId), 7200);

  await emitToRoom(io, roomId, "round:teamProposed", { playerIds: proposedTeam });
}

export async function handleApprovalVote(roomId: string, userId: string, vote: "approve" | "reject", io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "TEAM_APPROVAL") {
    return;
  }

  const captain = await db.roomPlayer.findFirst({
    where: { roomId, userId, role: { in: [PlayerRole.SAINT_FRASY, PlayerRole.YAR_LUTUF] } },
  });

  const weight = captain?.role === PlayerRole.SAINT_FRASY ? 2 : 1;

  await redis.hset(approvalVotesKey(roomId), userId, vote);
  await redis.hincrby(approvalVotesKey(roomId), `weight:${userId}`, weight);

  const allVotes = await redis.hgetall(approvalVotesKey(roomId));
  const votes: Record<string, { vote: string; weight: number }> = {};
  for (const [key, value] of Object.entries(allVotes)) {
    if (key.startsWith("weight:")) {
      const uid = key.replace("weight:", "");
      votes[uid] = { ...(votes[uid] ?? { vote: "", weight: 1 }), weight: parseInt(value, 10) };
    } else {
      if (!key.startsWith("$")) {
        votes[key] = { ...(votes[key] ?? { vote: "", weight: 1 }), vote: value };
      }
    }
  }

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { players: true, rounds: { orderBy: { roundNumber: "desc" }, take: 1 } },
  });
  if (!room) return;
  const totalPlayers = room.players.length;

  let approvedWeight = 0;
  let rejectedWeight = 0;
  for (const v of Object.values(votes)) {
    if (v.vote === "approve") approvedWeight += v.weight;
    else rejectedWeight += v.weight;
  }

  const totalWeight = approvedWeight + rejectedWeight;
  const totalVoters = Object.keys(votes).length;
  const majority = Math.ceil(totalPlayers / 2);

  const isApproved = approvedWeight > rejectedWeight;
  const earlyDecide = approvedWeight >= majority || rejectedWeight >= majority;

  if (earlyDecide || totalVoters >= totalPlayers) {
    const nextPhase = isApproved ? "MISSION_VOTE" : "DISCUSSION";
    let newRejectionCount = 0;
    if (!isApproved) {
      newRejectionCount = (parseInt(state.rejectionCount ?? "0", 10) + 1);
    }
    await setRedisState(roomId, { ...state, phase: nextPhase, rejectionCount: String(newRejectionCount) });

    if (!isApproved) {
      await db.room.update({
        where: { id: roomId },
        data: { roundRejections: { increment: 1 } },
      });
    }

    await emitToRoom(io, roomId, "round:approvalResult", { approved: isApproved });

    if (newRejectionCount >= 3) {
      await db.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.FINISHED },
      });
      await endGame(roomId, "RED", "MAX_REJECTIONS", io);
      return;
    }

    if (isApproved) {
      await redis.sadd(selectedTeamKey(roomId), []);
      const lastRound = room.rounds[0];
      if (lastRound) {
        await db.roundRecord.update({
          where: { id: lastRound.id },
          data: { selectedTeam: [], phase: "MISSION_VOTE" },
        });
      }
    } else {
      await startDiscussionPhase(roomId, io);
    }
  } else {
    await redis.hmset(approvalVotesKey(roomId), allVotes);
  }
}

export async function handleMissionVote(roomId: string, userId: string, vote: "green" | "red", io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "MISSION_VOTE") {
    return;
  }

  const currentVotes = (await redis.hgetall(missionVotesKey(roomId))) as Record<string, string>;
  if (Object.keys(currentVotes).length > 0 && currentVotes[userId]) {
    return;
  }

  await redis.hset(missionVotesKey(roomId), userId, vote);
  await redis.expire(missionVotesKey(roomId), 7200);

  const teamData: Array<{ userId: string; role: PlayerRole | null; team: PlayerTeam | null }> = [];
  const selectedMembers = await redis.smembers(selectedTeamKey(roomId));
  if (selectedMembers.length > 0) {
    for (const userId of selectedMembers) {
      const player = await db.roomPlayer.findFirst({ where: { roomId, userId } });
      if (player) {
        teamData.push(player);
      }
    }
  }

  const allVotesObj = await redis.hgetall(missionVotesKey(roomId));
  const votes: Record<string, string> = {};
  for (const [key, value] of Object.entries(allVotesObj)) {
    if (!key.startsWith("$")) {
      votes[key] = value;
    }
  }

  const roundNum = parseInt(state.round ?? "1", 10);
  let greenWeight = 0;
  let redWeight = 0;

  for (const [voterId, v] of Object.entries(votes)) {
    const player = teamData.find((p) => p.userId === voterId);
    if (!player) continue;
    const role = player.role;
    const weight = role === PlayerRole.SAINT_FRASY || role === PlayerRole.YAR_LUTUF ? 2 : 1;
    if (v === "green") greenWeight += weight;
    else if (v === "red") redWeight += weight;
  }

  const selectedTeam = selectedMembers.filter(Boolean);
  const votesReceived = Object.keys(votes).filter((voterId) => selectedTeam.includes(voterId)).length;

  if (votesReceived >= selectedTeam.length) {
    let winner: "GREEN" | "RED" = "GREEN";
    const redTeamOnMission = teamData.filter((p) => p.team === PlayerTeam.RED).length;

    if (roundNum === 4 && redTeamOnMission < 2) {
      winner = "GREEN";
    } else if (redWeight > greenWeight) {
      winner = "RED";
    } else {
      winner = "GREEN";
    }

    if (winner === "GREEN") {
      await db.room.update({
        where: { id: roomId },
        data: { greenWins: { increment: 1 } },
      });
    } else if (winner === "RED") {
      await db.room.update({
        where: { id: roomId },
        data: { redWins: { increment: 1 } },
      });
    }

    const updatedRoom = await db.room.findUnique({ where: { id: roomId } });
    if (updatedRoom && updatedRoom.greenWins >= 3) {
      await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
      await endGame(roomId, "GREEN", "GREEN_WIN_BY_ROUNDS", io);
      return;
    }
    if (updatedRoom && updatedRoom.redWins >= 3) {
      await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
      await endGame(roomId, "RED", "RED_WIN_BY_ROUNDS", io);
      return;
    }

    await handleTransition(roomId, io);
  }
}

export async function handleTransition(roomId: string, io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  const currentRound = parseInt(state.round ?? "1", 10);

  if (currentRound >= 5) {
    await triggerEndgame(roomId, io);
    return;
  }

  const nextRound = currentRound + 1;
  const allPlayerIds = await redis.smembers(playersKey(roomId));
  const selectorId = allPlayerIds[Math.floor(Math.random() * allPlayerIds.length)] ?? "";

  await setRedisState(roomId, {
    ...state,
    phase: "ENDGAME",
    round: String(nextRound),
    selectorId,
    rejectionCount: "0",
  });

  await emitToRoom(io, roomId, "round:transition", {
    round: nextRound,
    selectorId,
  });

  await startDiscussionPhase(roomId, io);
}

export async function triggerEndgame(roomId: string, io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) return;

  let winner: "GREEN" | "RED" = "GREEN" as const;
  if (room.greenWins > room.redWins) winner = "GREEN";
  else if (room.redWins > room.greenWins) winner = "RED";
  else winner = "GREEN";

  await setRedisState(roomId, { ...state, phase: "ENDGAME" });
}

export async function handleEndgameGuess(roomId: string, userId: string, targetUserId: string, guessType: "team" | "role", io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "ENDGAME") {
    return;
  }

  const assignments = await db.roomPlayer.findMany({ where: { roomId } });
  const guesser = assignments.find((p) => p.userId === userId);
  const target = assignments.find((p) => p.userId === targetUserId);

  if (!guesser || !target) {
    return;
  }

  const guesserRole = guesser.role?.toLowerCase() as RoleName | undefined;
  let guessCorrect = false;
  if (guesserRole === "mir_jafar") {
    if (guessType === "team") {
      guessCorrect = target.team === PlayerTeam.RED;
    } else {
      guessCorrect = target.role === PlayerRole.MIR_JAFAR; // mir_jafar cannot guess role correctly
    }
  } else if (guesserRole === "jagat_seth") {
    if (guessType === "team") {
      guessCorrect = target.team === PlayerTeam.GREEN;
    } else {
      guessCorrect = target.role === PlayerRole.JAGAT_SETH;
    }
  }

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) return;

  if (guesserRole === "mir_jafar") {
    if (guessCorrect) {
      await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
      await endGame(roomId, "GREEN", "MIR_JAFAR_GUESS_CORRECT", io, { jeanLawTarget: targetUserId });
    } else {
      const hasJagatSeth = assignments.some((p) => p.role === PlayerRole.JAGAT_SETH);
      if (hasJagatSeth && targetUserId !== userId) {
        await emitToRoom(io, roomId, "room:error", { message: "Jagat Seth may now guess" });
      } else {
        await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
        await endGame(roomId, "GREEN", "MIR_JAFAR_GUESS_WRONG_JEAN_LAW_ABSENT", io, { jeanLawTarget: targetUserId });
      }
    }
  } else if (guesserRole === "jagat_seth") {
    await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
    await endGame(roomId, guessCorrect ? "JAGAT_SETH" : "GREEN", guessCorrect ? "JAGAT_SETH_GUESS_CORRECT" : "JAGAT_SETH_GUESS_WRONG", io, { jeanLawTarget: targetUserId });
  }
}

export async function endGame(roomId: string, winner: "GREEN" | "RED" | "JAGAT_SETH", reason: string, io: Server, extra?: { jeanLawTarget?: string }): Promise<void> {
  const assignments = await db.roomPlayer.findMany({
    where: { roomId },
    include: { user: { select: { id: true } } },
  });

  const roleReveal = assignments.map((p) => {
    const role = p.role?.toLowerCase() ?? "";
    const team =
      p.team === PlayerTeam.GREEN
        ? "green"
        : p.team === PlayerTeam.RED
          ? "red"
          : p.team === PlayerTeam.GOLD
            ? "gold"
            : "";
    return { userId: p.userId, role, team };
  });

  const excludedWinCredit: string[] = [];
  if (extra?.jeanLawTarget) {
    excludedWinCredit.push(extra.jeanLawTarget);
    const idx = roleReveal.findIndex((r) => r.userId === extra.jeanLawTarget);
    if (idx !== -1) {
      roleReveal[idx] = { ...roleReveal[idx], team: "excluded" };
    }
  }

  const payload: GameEndPayload = {
    roomId,
    winner,
    roleReveal,
    excludedWinCredit,
  };

  await db.room.update({
    where: { id: roomId },
    data: { status: RoomStatus.FINISHED },
  });

  await emitToRoom(io, roomId, "game:end", payload);
  await clearGameState(roomId);
}

export async function handleDebussyLockOn(roomId: string, userId: string, targetUserId: string, io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "DISCUSSION") {
    await emitToRoom(io, roomId, "room:error", { message: "Debussy lock only allowed during discussion phase" });
    return;
  }

  const deBussyUsed = await redis.get(deBussyUsedKey(roomId));
  if (deBussyUsed === "1") {
    await emitToRoom(io, roomId, "room:error", { message: "De Bussy power already used this game" });
    return;
  }

  const player = await db.roomPlayer.findFirst({
    where: { roomId, userId },
    include: { user: { select: { id: true } } },
  });
  if (!player || player.role !== PlayerRole.DE_BUSSY) {
    await emitToRoom(io, roomId, "room:error", { message: "Only De Bussy can use this power" });
    return;
  }

  const target = await db.roomPlayer.findFirst({
    where: { roomId, userId: targetUserId },
    include: { user: { select: { id: true } } },
  });
  if (!target) {
    await emitToRoom(io, roomId, "room:error", { message: "Target player not found" });
    return;
  }

  let revealedRole: string | null = null;
  if (target.role !== PlayerRole.RAI_DURLABH) {
    revealedRole = target.role?.toLowerCase() ?? null;
  }

  await redis.set(deBussyUsedKey(roomId), "1");
  await redis.expire(deBussyUsedKey(roomId), 7200);

  const targetSocket = await findSocketForUser(io, userId);
  if (targetSocket) {
    targetSocket.emit("debussy:reveal", { targetUserId, revealedRole });
  }
}

export async function handleJeanLawLock(roomId: string, userId: string, targetUserId: string, io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  if (!state || Object.keys(state).length === 0) {
    return;
  }

  const existingTarget = await redis.get(jeanLawTargetKey(roomId));
  if (existingTarget) {
    await emitToRoom(io, roomId, "room:error", { message: "Jean Law lock already used this round" });
    return;
  }

  const player = await db.roomPlayer.findFirst({
    where: { roomId, userId },
  });
  if (!player || player.role !== PlayerRole.JEAN_LAW) {
    await emitToRoom(io, roomId, "room:error", { message: "Only Jean Law can use this power" });
    return;
  }

  const target = await db.roomPlayer.findFirst({
    where: { roomId, userId: targetUserId },
  });
  if (!target) {
    await emitToRoom(io, roomId, "room:error", { message: "Target player not found" });
    return;
  }

  if (target.team !== PlayerTeam.RED) {
    await emitToRoom(io, roomId, "room:error", { message: "Jean Law can only lock onto RED team members" });
    return;
  }

  await redis.set(jeanLawTargetKey(roomId), targetUserId);
  await redis.expire(jeanLawTargetKey(roomId), 7200);

  await emitToRoom(io, roomId, "jeanlaw:lockConfirmed", { targetUserId });
}
