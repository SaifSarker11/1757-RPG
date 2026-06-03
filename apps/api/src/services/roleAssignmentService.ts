import { PlayerRole, PlayerTeam } from "@repo/db";

export interface IRoleAssignment {
  role: PlayerRole;
  team: PlayerTeam;
}

const ROLE_BALANCE: Record<number, { green: number; red: number; hasJagatSeth: boolean }> = {
  6: { green: 4, red: 2, hasJagatSeth: false },
  7: { green: 4, red: 2, hasJagatSeth: true },
  8: { green: 5, red: 3, hasJagatSeth: false },
  9: { green: 5, red: 3, hasJagatSeth: true },
  10: { green: 6, red: 4, hasJagatSeth: false },
  11: { green: 6, red: 4, hasJagatSeth: true },
  12: { green: 7, red: 5, hasJagatSeth: false },
  13: { green: 7, red: 5, hasJagatSeth: true },
  14: { green: 8, red: 6, hasJagatSeth: false },
  15: { green: 8, red: 6, hasJagatSeth: true },
};

const GREEN_ROLES: PlayerRole[] = [
  PlayerRole.NAWAB_SIRAJ,
  PlayerRole.LUTFUNNESA,
  PlayerRole.SAINT_FRASY,
  PlayerRole.DE_BUSSY,
  PlayerRole.MOHON_LAL,
  PlayerRole.TARA_BAI,
];

const RED_ROLES: PlayerRole[] = [
  PlayerRole.JEAN_LAW,
  PlayerRole.GHASHETI_BEGUM,
  PlayerRole.YAR_LUTUF,
  PlayerRole.UMICHAD,
  PlayerRole.RAI_DURLABH,
];

export function assignRoles(playerCount: number): IRoleAssignment[] {
  if (playerCount < 6 || playerCount > 15) {
    throw new Error("Invalid player count: must be between 6 and 15");
  }

  const balance = ROLE_BALANCE[playerCount];
  if (!balance) {
    throw new Error("Invalid player count");
  }

  const assignments: IRoleAssignment[] = [];

  // Mir Madan is always in the game (Green team)
  assignments.push({ role: PlayerRole.MIR_MADAN, team: PlayerTeam.GREEN });

  // Mir Jafar is always in the game (Red team)
  assignments.push({ role: PlayerRole.MIR_JAFAR, team: PlayerTeam.RED });

  // Fill remaining Green slots with other Green roles
  const remainingGreenSlots = balance.green - 1;
  const availableGreenRoles = [...GREEN_ROLES];
  shuffleArray(availableGreenRoles);
  
  for (let i = 0; i < remainingGreenSlots; i++) {
    assignments.push({ role: availableGreenRoles[i % availableGreenRoles.length], team: PlayerTeam.GREEN });
  }

  // Fill remaining Red slots with other Red roles
  const remainingRedSlots = balance.red - 1;
  const availableRedRoles = [...RED_ROLES];
  shuffleArray(availableRedRoles);

  for (let i = 0; i < remainingRedSlots; i++) {
    assignments.push({ role: availableRedRoles[i % availableRedRoles.length], team: PlayerTeam.RED });
  }

  // Jagat Seth is added separately if game has slot
  if (balance.hasJagatSeth) {
    assignments.push({ role: PlayerRole.JAGAT_SETH, team: PlayerTeam.GOLD });
  }

  // Shuffle all assignments
  shuffleArray(assignments);

  return assignments;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function isRaiDurlabh(role: PlayerRole | null): boolean {
  return role === PlayerRole.RAI_DURLABH;
}