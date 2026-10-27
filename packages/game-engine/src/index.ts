// Public API of the game engine. Pure TypeScript, no I/O.
export * from "./types.js";
export * from "./config/gameConfig.js";
export { createRng, shuffle, type Rng } from "./rng.js";
export { ROLE_CATALOG, teamOf, dependencyClosure, type RoleDefinition } from "./roles/catalog.js";
export { assignRoles, pickRoles } from "./roles/assignRoles.js";
export { resolveSettings } from "./settings.js";
export { createGame, type CreateGameInput } from "./createGame.js";
export { reduce } from "./reduce.js";
export { tallyBallot, voteWeightOf, type BallotTally } from "./phases/ballot.js";
export { allowedCardsFor } from "./phases/mission.js";
export {
  ballotResultsCard,
  lastBallotResultsCard,
  type BallotResultsCard,
} from "./phases/resultsCard.js";
export { roundWins } from "./phases/round.js";
export { isPaused } from "./phases/pause.js";
export * from "./vision/types.js";
export { viewFor, publicView } from "./vision/viewFor.js";
export { computeVision, computeReveals, isMirMadanVisionActive } from "./vision/visionRules.js";
export { isJeanLawFlipped } from "./abilities/jeanLaw.js";
export {
  playerResults,
  matchSummary,
  type PlayerResult,
  type MatchSummary,
  type SummaryNomination,
  type SummaryBallotVote,
} from "./scoring.js";
