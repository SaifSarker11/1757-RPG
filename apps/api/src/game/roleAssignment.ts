import { RoleName, TeamName, IRoleAssignment, IPrivateRoleInfo } from "@repo/types";

// Balance table: total counts for each team per player count
// Format: { green: number, red: number, hasJagatSeth: boolean }
// Note: green and red counts include the always-present mir_madan and mir_jafar respectively.
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
  "tara_bai",
];

// Roles that can be randomly selected for red slots (excluding mir_jafar)
const RED_ROLES_POOL: RoleName[] = [
  "jean_law",
  "ghasheti_begum",
  "yar_lutuf",
  "umichad",
  "rai_durlabh",
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
 * The array includes:
 *   - mir_madan (always)
 *   - mir_jafar (always)
 *   - (greenCount - 1) roles from GREEN_ROLES_POOL
 *   - (redCount - 1) roles from RED_ROLES_POOL
 *   - jagat_seth if hasJagatSeth is true
 * Then shuffles the entire array.
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
 * @param userIds - Array of user IDs
 * @param playerCount - Number of players (should match userIds.length)
 * @returns Array of role assignments
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
  // Green team roles
  const greenRoles: RoleName[] = [
    "mir_madan",
    "nawab_siraj",
    "lutfunnesa",
    "saint_frasy",
    "de_bussy",
    "mohon_lal",
    "tara_bai",
  ];
  // Red team roles
  const redRoles: RoleName[] = [
    "mir_jafar",
    "jean_law",
    "ghasheti_begum",
    "yar_lutuf",
    "umichad",
    "rai_durlabh",
  ];
  // Gold team role
  if (role === "jagat_seth") {
    return "gold";
  }
  if (greenRoles.includes(role)) {
    return "green";
  }
  if (redRoles.includes(role)) {
    return "red";
  }
  // Should never happen if role is valid
  throw new Error(`Unknown role: ${role}`);
}

/**
 * Builds private role information for a player based on their assignment and all assignments.
 */
export function buildPrivateRoleInfo(
  assignment: IRoleAssignment,
  allAssignments: IRoleAssignment[]
): IPrivateRoleInfo {
  const { role, team, userId } = assignment;

  // Find all other players
  const otherPlayers = allAssignments.filter((a) => a.userId !== userId);

  // Initialize visible players as empty
  let visiblePlayers: Array<{ userId: string; role: string; team: TeamName }> = [];
  let isFlustered = false;
  let deBussyUsed = false; // This would be set elsewhere, e.g., when de_bussy uses their lock

  switch (role) {
    case "nawab_siraj":
      // Sees lutfunnesa
      const lutfunnesaAssignment = otherPlayers.find(
        (a) => a.role === "lutfunnesa"
      );
      if (lutfunnesaAssignment) {
        visiblePlayers.push({
          userId: lutfunnesaAssignment.userId,
          role: lutfunnesaAssignment.role,
          team: lutfunnesaAssignment.team,
        });
      }
      // isFlustered if tara_bai is present
      const taraBaiAssignment = otherPlayers.find(
        (a) => a.role === "tara_bai"
      );
      isFlustered = !!taraBaiAssignment;
      break;

    case "lutfunnesa":
      // Sees nawab_siraj
      const nawabSirajAssignment = otherPlayers.find(
        (a) => a.role === "nawab_siraj"
      );
      if (nawabSirajAssignment) {
        visiblePlayers.push({
          userId: nawabSirajAssignment.userId,
          role: nawabSirajAssignment.role,
          team: nawabSirajAssignment.team,
        });
      }
      // isFlustered if tara_bai is present
      const taraBaiAssignment2 = otherPlayers.find(
        (a) => a.role === "tara_bai"
      );
      isFlustered = !!taraBaiAssignment2;
      break;

    case "mir_madan":
      // Sees all red except rai_durlabh
      const redPlayers = otherPlayers.filter(
        (a) =>
          getTeamForRole(a.role) === "red" && a.role !== "rai_durlabh"
      );
      visiblePlayers = redPlayers.map((a) => ({
        userId: a.userId,
        role: a.role,
        team: a.team,
      }));
      break;

    case "mohon_lal":
      // Sees mir_madan and ghasheti_begum as "spy" (masked role)
      const mirMadanAssignment = otherPlayers.find(
        (a) => a.role === "mir_madan"
      );
      if (mirMadanAssignment) {
        visiblePlayers.push({
          userId: mirMadanAssignment.userId,
          role: "spy", // Masked role
          team: mirMadanAssignment.team,
        });
      }
      const ghashetiBegumAssignment = otherPlayers.find(
        (a) => a.role === "ghasheti_begum"
      );
      if (ghashetiBegumAssignment) {
        visiblePlayers.push({
          userId: ghashetiBegumAssignment.userId,
          role: "spy", // Masked role
          team: ghashetiBegumAssignment.team,
        });
      }
      break;

    case "rai_durlabh":
      // Sees nothing (invisible)
      visiblePlayers = [];
      break;

    default:
      // All others: see nothing
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