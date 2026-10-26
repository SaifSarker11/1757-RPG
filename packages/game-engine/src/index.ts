// Public API of the game engine. Pure TypeScript, no I/O.
export * from "./types.js";
export * from "./config/gameConfig.js";
export { createRng, shuffle, type Rng } from "./rng.js";
export { ROLE_CATALOG, teamOf, dependencyClosure, type RoleDefinition } from "./roles/catalog.js";
export { assignRoles, pickRoles } from "./roles/assignRoles.js";
export { resolveSettings } from "./settings.js";
export { createGame, type CreateGameInput } from "./createGame.js";
export { reduce } from "./reduce.js";
export { tallyBallot, type BallotTally } from "./phases/ballot.js";
export { roundWins } from "./phases/round.js";
