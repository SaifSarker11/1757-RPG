import { Server } from "socket.io";
import { db, PlayerRole, PlayerTeam, RoomStatus } from "@repo/db";
import type { GamePhase, GameEndPayload, RoleName } from "@repo/types";
import redis from "../lib/redis.js";
import {
  allKeys,
  approvalVotesKey,
  gameStateKey,
  missionVotesKey,
  selectedTeamKey,
  playersKey,
  deBussyUsedKey,
  jeanLawTargetKey,
} from "./redisKeys.js";
import { getTeamSizeForRound, DISCUSSION_DURATION_MS } from "./roundConfig.js";

// Helper to find socket for a user by their custom data properties
async function findSocketForUser(io: Server, userId: string) {
  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    if (
      "data" in socket &&
      typeof socket.data === "object" &&
      (socket.data as { userId?: string }).userId === userId
    ) {
      return socket;
    }
  }
  return null;
}

// Fetch current game state from Redis
async function getRedisState(roomId: string): Promise<Record<string, string | undefined>> {
  return redis.hgetall(gameStateKey(roomId));
}

// Write game state to Redis
async function setRedisState(roomId: string, data: Record<string, string>): Promise<void> {
  await redis.hmset(gameStateKey(roomId), data);
  await redis.expire(gameStateKey(roomId), 7200);
}

// Get the current game phase
async function getPhase(roomId: string): Promise<GamePhase> {
  const state = await getRedisState(roomId);
  return (state.phase as GamePhase) ?? "DISCUSSION";
}

// Set the current game phase
async function setPhase(roomId: string, phase: GamePhase): Promise<void> {
  await setRedisState(roomId, { phase });
}

// Emit message to a Socket.IO room
async function emitToRoom(io: Server, roomId: string, event: string, data: unknown): Promise<void> {
  io.to(roomId).emit(event, data);
}

/**
 * Initializes the game state in Redis and triggers database setup.
 */
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

  // Clear any existing votes or team selection
  await redis.del(approvalVotesKey(roomId));
  await redis.del(missionVotesKey(roomId));
  await redis.del(selectedTeamKey(roomId));

  // Initialize round record in database
  await db.roundRecord.create({
    data: {
      roomId,
      roundNumber: 1,
      phase: "DISCUSSION",
      selectorId: firstSelectorId,
      rejectionCount: 0,
    },
  });
}

/**
 * Clears Redis keys when the game ends.
 */
export async function clearGameState(roomId: string): Promise<void> {
  const keys = allKeys(roomId);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Starts the discussion phase for the current round.
 */
export async function startDiscussionPhase(roomId: string, io: Server): Promise<void> {
  await setPhase(roomId, "DISCUSSION");
  const state = await getRedisState(roomId);
  const round = parseInt(state.round ?? "1", 10);
  const selectorId = state.selectorId ?? "";

  // Broadcast round phase info
  const durationSec = DISCUSSION_DURATION_MS / 1000;
  await emitToRoom(io, roomId, "round:phase", {
    phase: "DISCUSSION",
    round,
    duration: durationSec,
  });

  // Mir Madan gets private vision of red team members in round 1
  if (round === 1) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });
    const mirMadanPlayer = room?.players.find((p) => p.role === PlayerRole.MIR_MADAN);
    if (mirMadanPlayer) {
      const allAssignments = await db.roomPlayer.findMany({
        where: { roomId },
      });

      const visiblePlayers = allAssignments
        .filter((p) => p.team === PlayerTeam.RED && p.role !== PlayerRole.RAI_DURLABH)
        .map((p) => ({
          userId: p.userId,
          role: "red", // Mir Madan only knows that they are Red
          team: "red" as const,
        }));

      const targetSocket = await findSocketForUser(io, mirMadanPlayer.userId);
      if (targetSocket) {
        targetSocket.emit("round:mirMadanVision", { visiblePlayers });
      }
    }
  }
}

/**
 * Handles a leader proposing a team (minister board) for the round.
 */
export async function handleTeamProposal(
  roomId: string,
  selectorId: string,
  proposedTeam: string[],
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  const phase = state.phase;

  if (phase === "ENDGAME") {
    return;
  }

  if (state.selectorId !== selectorId) {
    io.to(roomId).emit("room:error", { message: "You are not the current selector" });
    return;
  }

  const currentRound = parseInt(state.round ?? "1", 10);
  const allPlayerIds = await redis.smembers(playersKey(roomId));
  const expectedSize = getTeamSizeForRound(currentRound, allPlayerIds.length);
  
  if (proposedTeam.length !== expectedSize) {
    io.to(roomId).emit("room:error", {
      message: `Team must have exactly ${expectedSize} players for round ${currentRound}`,
    });
    return;
  }

  // Clear previous selection and save the new proposed team
  await redis.del(selectedTeamKey(roomId));
  await redis.sadd(selectedTeamKey(roomId), proposedTeam);
  await redis.expire(selectedTeamKey(roomId), 7200);

  // Fetch the latest round record
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { rounds: { orderBy: { roundNumber: "desc" }, take: 1 } },
  });
  if (!room || room.rounds.length === 0) return;
  const currentRoundRecord = room.rounds[0];

  if (currentRound === 1) {
    // EXCEPTION: Round 1 proposed team is automatically approved and bypasses the voting phase
    await setPhase(roomId, "MISSION_VOTE");
    await redis.del(missionVotesKey(roomId));

    await db.roundRecord.update({
      where: { id: currentRoundRecord.id },
      data: { selectedTeam: proposedTeam, phase: "MISSION_VOTE" },
    });

    await emitToRoom(io, roomId, "round:teamProposed", { playerIds: proposedTeam });
    await emitToRoom(io, roomId, "round:approvalResult", { approved: true });
  } else {
    // Normal rounds proceed to the voting phase
    await setPhase(roomId, "TEAM_APPROVAL");
    await redis.del(approvalVotesKey(roomId));

    await db.roundRecord.update({
      where: { id: currentRoundRecord.id },
      data: { selectedTeam: proposedTeam, phase: "TEAM_APPROVAL" },
    });

    await emitToRoom(io, roomId, "round:teamProposed", { playerIds: proposedTeam });
  }
}

/**
 * Handles a player's approval/rejection vote for the proposed board.
 */
export async function handleApprovalVote(
  roomId: string,
  userId: string,
  vote: "approve" | "reject",
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "TEAM_APPROVAL") {
    return;
  }

  // Fetch the player to check for special roles with double vote weight (Saint Frais, Yar Lutuf)
  const voter = await db.roomPlayer.findFirst({
    where: {
      roomId,
      userId,
      role: { in: [PlayerRole.SAINT_FRASY, PlayerRole.YAR_LUTUF] },
    },
  });

  const weight = voter?.role === PlayerRole.SAINT_FRASY || voter?.role === PlayerRole.YAR_LUTUF ? 2 : 1;

  // Save vote and vote weight
  await redis.hset(approvalVotesKey(roomId), userId, vote);
  await redis.hset(approvalVotesKey(roomId), `weight:${userId}`, weight);

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
  if (!room || room.rounds.length === 0) return;
  const totalPlayers = room.players.length;

  let approvedWeight = 0;
  let rejectedWeight = 0;
  for (const v of Object.values(votes)) {
    if (v.vote === "approve") approvedWeight += v.weight;
    else rejectedWeight += v.weight;
  }

  const totalVoters = Object.keys(votes).length;

  // We decide once all players have voted
  if (totalVoters >= totalPlayers) {
    const isApproved = approvedWeight > rejectedWeight;
    const nextPhase = isApproved ? "MISSION_VOTE" : "DISCUSSION";
    let newRejectionCount = parseInt(state.rejectionCount ?? "0", 10);

    if (!isApproved) {
      newRejectionCount += 1;
      await db.room.update({
        where: { id: roomId },
        data: { roundRejections: { increment: 1 } },
      });
    }

    await setRedisState(roomId, {
      ...state,
      phase: nextPhase,
      rejectionCount: String(newRejectionCount),
    });

    const currentRoundRecord = room.rounds[0];
    await db.roundRecord.update({
      where: { id: currentRoundRecord.id },
      data: {
        teamVotes: allVotes,
        phase: nextPhase,
        rejectionCount: newRejectionCount,
      },
    });

    await emitToRoom(io, roomId, "round:approvalResult", { approved: isApproved });

    // Endgame Condition: 3 consecutive rejections leads to RED team winning
    if (newRejectionCount >= 3) {
      await db.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.FINISHED },
      });
      await handleInitialGameEnd(roomId, "RED", "MAX_REJECTIONS", io);
      return;
    }

    if (isApproved) {
      await redis.del(missionVotesKey(roomId));
    } else {
      // Transition back to discussion phase with the same round number
      await startDiscussionPhase(roomId, io);
    }
  }
}

/**
 * Handles a minister's resolution vote (secret GREEN or RED).
 */
export async function handleMissionVote(
  roomId: string,
  userId: string,
  vote: "green" | "red",
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "MISSION_VOTE") {
    return;
  }

  const selectedMembers = await redis.smembers(selectedTeamKey(roomId));
  if (!selectedMembers.includes(userId)) {
    return; // User is not on the proposed board
  }

  const currentVotes = (await redis.hgetall(missionVotesKey(roomId))) as Record<string, string>;
  if (currentVotes[userId]) {
    return; // Already voted
  }

  await redis.hset(missionVotesKey(roomId), userId, vote);
  await redis.expire(missionVotesKey(roomId), 7200);

  const updatedVotes = (await redis.hgetall(missionVotesKey(roomId))) as Record<string, string>;
  const votesReceived = Object.keys(updatedVotes).filter((voterId) => selectedMembers.includes(voterId)).length;

  if (votesReceived >= selectedMembers.length) {
    // All board members have voted. Let's calculate the winner of this round.
    const teamData = await db.roomPlayer.findMany({
      where: { roomId, userId: { in: selectedMembers } },
    });

    // Saint Frais and Yar Lutuf votes count as weight = 2 in mission resolution
    let greenVotesWithWeight = 0;
    let redVotesWithWeight = 0;

    for (const [voterId, v] of Object.entries(updatedVotes)) {
      const player = teamData.find((p) => p.userId === voterId);
      if (!player) continue;
      const role = player.role;
      const weight = role === PlayerRole.SAINT_FRASY || role === PlayerRole.YAR_LUTUF ? 2 : 1;
      if (v === "green") {
        greenVotesWithWeight += weight;
      } else {
        redVotesWithWeight += weight;
      }
    }

    const roundNum = parseInt(state.round ?? "1", 10);
    const allPlayerIds = await redis.smembers(playersKey(roomId));
    const playerCount = allPlayerIds.length;

    // Threshold of fails (RED votes) needed to fail the round
    let failsNeeded = 1;
    if (roundNum === 4 && playerCount >= 7) {
      failsNeeded = 2;
    }

    const isRedFail = redVotesWithWeight >= failsNeeded;
    const winner: "GREEN" | "RED" = isRedFail ? "RED" : "GREEN";

    // Save round record outputs
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { rounds: { orderBy: { roundNumber: "desc" }, take: 1 } },
    });
    if (!room || room.rounds.length === 0) return;
    const currentRoundRecord = room.rounds[0];

    await db.$transaction(async (tx) => {
      await tx.roundRecord.update({
        where: { id: currentRoundRecord.id },
        data: {
          missionVotes: updatedVotes,
          winner,
          greenVotes: Object.values(updatedVotes).filter((v) => v === "green").length,
          redVotes: Object.values(updatedVotes).filter((v) => v === "red").length,
          phase: "TRANSITION",
        },
      });

      if (winner === "GREEN") {
        await tx.room.update({
          where: { id: roomId },
          data: { greenWins: { increment: 1 } },
        });
      } else {
        await tx.room.update({
          where: { id: roomId },
          data: { redWins: { increment: 1 } },
        });
      }
    });

    const updatedRoom = await db.room.findUnique({ where: { id: roomId } });
    if (!updatedRoom) return;

    // Check initial game end conditions (first to 3 round wins)
    if (updatedRoom.greenWins >= 3) {
      await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
      await handleInitialGameEnd(roomId, "GREEN", "GREEN_WIN_BY_ROUNDS", io);
      return;
    }
    if (updatedRoom.redWins >= 3) {
      await db.room.update({ where: { id: roomId }, data: { status: RoomStatus.FINISHED } });
      await handleInitialGameEnd(roomId, "RED", "RED_WIN_BY_ROUNDS", io);
      return;
    }

    await handleTransition(roomId, io);
  }
}

/**
 * Transitions to the next round with a new leader selected clockwise.
 */
export async function handleTransition(roomId: string, io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  const currentRound = parseInt(state.round ?? "1", 10);

  if (currentRound >= 5) {
    await triggerEndgame(roomId, io);
    return;
  }

  const nextRound = currentRound + 1;

  // Clockwise selector logic
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { players: { orderBy: { createdAt: "asc" } } },
  });
  if (!room) return;

  const players = room.players;
  const currentSelectorId = state.selectorId;
  const currentIndex = players.findIndex((p) => p.userId === currentSelectorId);
  const nextSelectorIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % players.length;
  const nextSelectorId = players[nextSelectorIndex].userId;

  // Update selector states in DB
  await db.$transaction([
    db.roomPlayer.updateMany({
      where: { roomId, isSelector: true },
      data: { isSelector: false },
    }),
    db.roomPlayer.updateMany({
      where: { roomId, userId: nextSelectorId },
      data: { isSelector: true },
    }),
    db.room.update({
      where: { id: roomId },
      data: { currentRound: nextRound },
    }),
  ]);

  await setRedisState(roomId, {
    ...state,
    phase: "DISCUSSION",
    round: String(nextRound),
    selectorId: nextSelectorId,
    rejectionCount: "0",
  });

  await emitToRoom(io, roomId, "round:transition", {
    round: nextRound,
    selectorId: nextSelectorId,
  });

  await startDiscussionPhase(roomId, io);
}

/**
 * Sets phase to ENDGAME when round 5 finishes without a 3-win decider.
 */
export async function triggerEndgame(roomId: string, io: Server): Promise<void> {
  const state = await getRedisState(roomId);
  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) return;

  const winner: "GREEN" | "RED" = room.greenWins > room.redWins ? "GREEN" : "RED";
  await handleInitialGameEnd(roomId, winner, "ROUNDS_COMPLETED", io);
}

/**
 * Transition flow for endgame guessing phases (Mir Jafar and Jagat Seth guesses).
 */
async function handleInitialGameEnd(
  roomId: string,
  initialWinner: "GREEN" | "RED",
  reason: string,
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  const players = await db.roomPlayer.findMany({ where: { roomId } });

  const hasMirJafar = players.some((p) => p.role === PlayerRole.MIR_JAFAR);
  const hasJagatSeth = players.some((p) => p.role === PlayerRole.JAGAT_SETH);

  await setRedisState(roomId, {
    ...state,
    phase: "ENDGAME",
    currentWinner: initialWinner,
  });

  await emitToRoom(io, roomId, "round:phase", {
    phase: "ENDGAME",
    round: 5,
    duration: 0,
  });

  // Flow:
  // 1. If GREEN won initially, Mir Jafar (Red) guesses Mir Madan to try to steal victory for Red.
  // 2. Once Mir Jafar's guess completes (or if RED won initially, or if Mir Jafar isn't in game):
  //    Jagat Seth (Gold) is prompted to guess (Mir Jafar if Green is winning, Rai Durlabh if Red is winning).
  // 3. Game ends.

  if (initialWinner === "GREEN" && hasMirJafar) {
    // Mir Jafar gets the guess prompt
    await emitToRoom(io, roomId, "guess:mirJafarPrompt", {});
  } else if (hasJagatSeth) {
    // Bypasses Mir Jafar, goes straight to Jagat Seth guess
    await emitToRoom(io, roomId, "guess:jagatSethPrompt", { targetTeam: initialWinner });
  } else {
    // No guessers left, end the game immediately
    await endGame(roomId, initialWinner, reason, io);
  }
}

/**
 * Handles target guessing by players in the endgame phase.
 */
export async function handleEndgameGuess(
  roomId: string,
  userId: string,
  targetUserId: string,
  guessType: "team" | "role",
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "ENDGAME") {
    return;
  }

  const currentWinner = (state.currentWinner as "GREEN" | "RED") ?? "GREEN";
  const assignments = await db.roomPlayer.findMany({ where: { roomId } });
  const guesser = assignments.find((p) => p.userId === userId);
  const target = assignments.find((p) => p.userId === targetUserId);

  if (!guesser || !target) return;

  const guesserRole = guesser.role;

  if (guesserRole === PlayerRole.MIR_JAFAR) {
    // Mir Jafar tries to guess Mir Madan (needs to identify role)
    const isCorrect = target.role === PlayerRole.MIR_MADAN;
    const nextWinner = isCorrect ? "RED" : "GREEN";

    await setRedisState(roomId, {
      ...state,
      currentWinner: nextWinner,
    });

    await emitToRoom(io, roomId, "guess:mirJafarResult", {
      guesserId: userId,
      correct: isCorrect,
      winner: nextWinner,
    });

    const hasJagatSeth = assignments.some((p) => p.role === PlayerRole.JAGAT_SETH);
    if (hasJagatSeth) {
      // Jagat Seth gets prompt based on the new currentWinner
      await emitToRoom(io, roomId, "guess:jagatSethPrompt", { targetTeam: nextWinner });
    } else {
      await endGame(roomId, nextWinner, "MIR_JAFAR_GUESS", io);
    }
  } else if (guesserRole === PlayerRole.JAGAT_SETH) {
    // Jagat Seth win conditions:
    // If RED is currently winning: must find Rai Durlabh
    // If GREEN is currently winning: must find Mir Jafar
    let isCorrect = false;

    if (currentWinner === "RED") {
      isCorrect = target.role === PlayerRole.RAI_DURLABH;
    } else {
      isCorrect = target.role === PlayerRole.MIR_JAFAR;
    }

    const finalWinner = isCorrect ? "JAGAT_SETH" : currentWinner;

    await emitToRoom(io, roomId, "guess:jagatSethResult", {
      guesserId: userId,
      correct: isCorrect,
      winner: finalWinner,
    });

    await endGame(roomId, finalWinner, "JAGAT_SETH_GUESS", io);
  }
}

/**
 * Concludes the game, reveals all roles, and broadcasts outcomes.
 */
export async function endGame(
  roomId: string,
  winner: "GREEN" | "RED" | "JAGAT_SETH",
  reason: string,
  io: Server
): Promise<void> {
  const assignments = await db.roomPlayer.findMany({
    where: { roomId },
  });

  const jeanLawTarget = await redis.get(jeanLawTargetKey(roomId));

  const roleReveal = assignments.map((p) => {
    const role = p.role?.toLowerCase() ?? "";
    let team =
      p.team === PlayerTeam.GREEN
        ? "green"
        : p.team === PlayerTeam.RED
          ? "red"
          : p.team === PlayerTeam.GOLD
            ? "gold"
            : "";

    // Humiliated badge logic: locked Green player loses if Green wins, and wins with Red if Red wins
    if (jeanLawTarget === p.userId && p.team === PlayerTeam.GREEN) {
      team = "humiliated";
    }

    return { userId: p.userId, role, team };
  });

  const excludedWinCredit: string[] = [];
  if (jeanLawTarget) {
    const target = assignments.find((p) => p.userId === jeanLawTarget);
    if (target && target.team === PlayerTeam.GREEN) {
      // If Green wins the game, this locked green player is excluded (loses)
      // If Red wins the game, they are added to win credit (wins)
      if (winner === "GREEN") {
        excludedWinCredit.push(jeanLawTarget);
      }
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

/**
 * Handles De Bussy locking on to scan another player's role (mutually reveals roles, once per game).
 */
export async function handleDebussyLockOn(
  roomId: string,
  userId: string,
  targetUserId: string,
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  if ((state.phase as GamePhase) !== "DISCUSSION") {
    io.to(roomId).emit("room:error", { message: "Debussy lock only allowed during discussion phase" });
    return;
  }

  const deBussyUsed = await redis.get(deBussyUsedKey(roomId));
  if (deBussyUsed === "1") {
    io.to(roomId).emit("room:error", { message: "De Bussy power already used this game" });
    return;
  }

  const player = await db.roomPlayer.findFirst({
    where: { roomId, userId },
  });
  if (!player || player.role !== PlayerRole.DE_BUSSY) {
    io.to(roomId).emit("room:error", { message: "Only De Bussy can use this power" });
    return;
  }

  const target = await db.roomPlayer.findFirst({
    where: { roomId, userId: targetUserId },
  });
  if (!target) {
    io.to(roomId).emit("room:error", { message: "Target player not found" });
    return;
  }

  // De Bussy gets target's actual role (Rai Durlabh is NOT an exception)
  const targetRole = target.role?.toLowerCase() ?? null;
  const deBussyRole = "de_bussy";

  await redis.set(deBussyUsedKey(roomId), "1");
  await redis.expire(deBussyUsedKey(roomId), 7200);

  // Send reveals mutually
  const targetSocket = await findSocketForUser(io, userId);
  if (targetSocket) {
    targetSocket.emit("debussy:reveal", { targetUserId, revealedRole: targetRole });
  }

  const deBussySocket = await findSocketForUser(io, targetUserId);
  if (deBussySocket) {
    deBussySocket.emit("debussy:reveal", { targetUserId: userId, revealedRole: deBussyRole });
  }
}

/**
 * Handles Jean Law lock on to target RED conspirators.
 */
export async function handleJeanLawLock(
  roomId: string,
  userId: string,
  targetUserId: string,
  io: Server
): Promise<void> {
  const state = await getRedisState(roomId);
  if (!state || Object.keys(state).length === 0) {
    return;
  }

  // Enforce Jean Law can only lock once per game
  const existingTarget = await redis.get(jeanLawTargetKey(roomId));
  if (existingTarget) {
    io.to(roomId).emit("room:error", { message: "Jean Law lock already used this game" });
    return;
  }

  const player = await db.roomPlayer.findFirst({
    where: { roomId, userId },
  });
  if (!player || player.role !== PlayerRole.JEAN_LAW) {
    io.to(roomId).emit("room:error", { message: "Only Jean Law can use this power" });
    return;
  }

  const target = await db.roomPlayer.findFirst({
    where: { roomId, userId: targetUserId },
  });
  if (!target) {
    io.to(roomId).emit("room:error", { message: "Target player not found" });
    return;
  }

  // Jean Law locks on. If the target is RED, it does nothing/wastes lock. If Green, it applies curse.
  if (target.team === PlayerTeam.RED) {
    // Wasted lock, nothing happens but lock is set to waste
    await redis.set(jeanLawTargetKey(roomId), "wasted");
    await redis.expire(jeanLawTargetKey(roomId), 7200);
    
    // Emit confirmed but with target as "wasted" (hidden from client)
    await emitToRoom(io, roomId, "jeanlaw:lockConfirmed", { targetUserId: "wasted" });
    return;
  }

  await redis.set(jeanLawTargetKey(roomId), targetUserId);
  await redis.expire(jeanLawTargetKey(roomId), 7200);

  await emitToRoom(io, roomId, "jeanlaw:lockConfirmed", { targetUserId });
}
