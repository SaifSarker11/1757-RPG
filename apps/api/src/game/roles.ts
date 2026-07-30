import { RoleName, TeamName, IRoleAssignment, IPrivateRoleInfo } from "@repo/types";
import { PlayerRole, PlayerTeam } from "@repo/db";

// Balance table: total counts for each team per player count
// Format: { green: number, red: number, hasJagatSeth: boolean }
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

// Roles that can be randomly selected for green slots (excluding mir_madan)
const GREEN_ROLES_POOL: RoleName[] = [
  "nawab_siraj",
  "lutfunnesa",
  "saint_frasy",
  "de_bussy",
  "mohon_lal",
  "raja_ramnarain",
];

// Roles that can be randomly selected for red slots (excluding mir_jafar)
const RED_ROLES_POOL: RoleName[] = [
  "jean_law",
  "ghasheti_begum",
  "yar_lutuf",
  "umichad",
  "rai_durlabh",
  "tara_bai",
];

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Returns a shuffled array of role names for the given player count.
 */
function getRolePool(playerCount: number): RoleName[] {
  if (playerCount < 6 || playerCount > 15) {
    throw new Error("Invalid player count: must be between 6 and 15");
  }

  const balance = ROLE_BALANCE[playerCount];
  if (!balance) {
    throw new Error("Invalid player count");
  }

  const roles: RoleName[] = [];

  // Always include mir_madan (green)
  roles.push("mir_madan");
  // Always include mir_jafar (red)
  roles.push("mir_jafar");

  // Fill remaining green slots from GREEN_ROLES_POOL
  const remainingGreenSlots = balance.green - 1;
  const shuffledGreenPool = [...GREEN_ROLES_POOL];
  shuffleArray(shuffledGreenPool);
  for (let i = 0; i < remainingGreenSlots; i++) {
    roles.push(shuffledGreenPool[i % shuffledGreenPool.length]);
  }

  // Fill remaining red slots from RED_ROLES_POOL
  const remainingRedSlots = balance.red - 1;
  const shuffledRedPool = [...RED_ROLES_POOL];
  shuffleArray(shuffledRedPool);
  for (let i = 0; i < remainingRedSlots; i++) {
    roles.push(shuffledRedPool[i % shuffledRedPool.length]);
  }

  // Add jagat_seth if needed
  if (balance.hasJagatSeth) {
    roles.push("jagat_seth");
  }

  // Shuffle all roles
  shuffleArray(roles);

  return roles;
}

/**
 * Assigns roles to the given user IDs.
 */
export function assignRoles(userIds: string[], playerCount: number): IRoleAssignment[] {
  if (userIds.length !== playerCount) {
    throw new Error("Number of user IDs must match player count");
  }

  const roles = getRolePool(playerCount);
  const assignments: IRoleAssignment[] = [];

  for (let i = 0; i < playerCount; i++) {
    assignments.push({
      userId: userIds[i],
      role: roles[i],
      team: getTeamForRole(roles[i]),
    });
  }

  return assignments;
}

/**
 * Returns the team for a given role.
 */
export function getTeamForRole(role: RoleName): TeamName {
  const greenRoles: RoleName[] = [
    "mir_madan",
    "nawab_siraj",
    "lutfunnesa",
    "saint_frasy",
    "de_bussy",
    "mohon_lal",
    "raja_ramnarain",
  ];
  const redRoles: RoleName[] = [
    "mir_jafar",
    "jean_law",
    "ghasheti_begum",
    "yar_lutuf",
    "umichad",
    "rai_durlabh",
    "tara_bai",
  ];

  if (role === "jagat_seth") {
    return "gold";
  }
  if (greenRoles.includes(role)) {
    return "green";
  }
  if (redRoles.includes(role)) {
    return "red";
  }
  throw new Error(`Unknown role: ${role}`);
}

/**
 * Helper to check if a DB role is Rai Durlabh.
 */
export function isRaiDurlabh(role: PlayerRole | null): boolean {
  return role === PlayerRole.RAI_DURLABH;
}

/**
 * Builds private role information for a player based on their assignment and all assignments.
 */
export function buildPrivateRoleInfo(
  assignment: IRoleAssignment,
  allAssignments: IRoleAssignment[]
): IPrivateRoleInfo {
  const { role, team, userId } = assignment;
  const otherPlayers = allAssignments.filter((a) => a.userId !== userId);

  let visiblePlayers: Array<{ userId: string; role: string; team: TeamName }> = [];
  let isFlustered = false;
  let deBussyUsed = false;

  switch (role) {
    case "nawab_siraj": {
      // Nawab Siraj sees the real Lutfunnesa
      const realLutfunnesa = otherPlayers.find((a) => a.role === "lutfunnesa");
      if (realLutfunnesa) {
        visiblePlayers.push({
          userId: realLutfunnesa.userId,
          role: "lutfunnesa",
          team: "green",
        });
      }
      // If Tara Bai is in the game, he is flustered and sees her as "Lutfunnesa" too
      const taraBai = otherPlayers.find((a) => a.role === "tara_bai");
      if (taraBai) {
        visiblePlayers.push({
          userId: taraBai.userId,
          role: "lutfunnesa",
          team: "green",
        });
        isFlustered = true;
      }
      break;
    }

    case "lutfunnesa": {
      // Lutfunnesa sees the real Nawab Siraj
      const realNawab = otherPlayers.find((a) => a.role === "nawab_siraj");
      if (realNawab) {
        visiblePlayers.push({
          userId: realNawab.userId,
          role: "nawab_siraj",
          team: "green",
        });
      }
      // If Tara Bai is in the game, she is flustered and sees her as "Nawab Siraj" too
      const taraBai = otherPlayers.find((a) => a.role === "tara_bai");
      if (taraBai) {
        visiblePlayers.push({
          userId: taraBai.userId,
          role: "nawab_siraj",
          team: "green",
        });
        isFlustered = true;
      }
      break;
    }

    case "mir_madan":
      // Sees all red except rai_durlabh as "red"
      const redPlayers = otherPlayers.filter(
        (a) => getTeamForRole(a.role) === "red" && a.role !== "rai_durlabh"
      );
      visiblePlayers = redPlayers.map((a) => ({
        userId: a.userId,
        role: "red",
        team: "red",
      }));
      break;

    case "mohon_lal":
      // Sees both Mir Madan and Ghasheti Begum as "spy"
      const mirMadan = otherPlayers.find((a) => a.role === "mir_madan");
      if (mirMadan) {
        visiblePlayers.push({
          userId: mirMadan.userId,
          role: "spy",
          team: "green",
        });
      }
      const ghasheti = otherPlayers.find((a) => a.role === "ghasheti_begum");
      if (ghasheti) {
        visiblePlayers.push({
          userId: ghasheti.userId,
          role: "spy",
          team: "red",
        });
      }
      break;

    case "raja_ramnarain": {
      const nawab = otherPlayers.find((a) => a.role === "nawab_siraj");
      if (nawab) {
        visiblePlayers.push({
          userId: nawab.userId,
          role: "nawab_siraj",
          team: "green",
        });
      }
      break;
    }

    case "rai_durlabh":
      visiblePlayers = [];
      break;

    default:
      visiblePlayers = [];
      break;
  }

  return {
    role,
    team,
    visiblePlayers,
    isFlustered,
    deBussyUsed,
  };
}
