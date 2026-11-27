import React from "react";
import type { PublicNomination, PublicView, Team } from "@/lib/game-types";
import { COURT, FACTION_META } from "@/lib/roles-content";

interface PostGameSummaryProps {
  game: PublicView;
  playerNames?: Record<string, string>;
  onReturnToLobby?: () => void;
}

const SIDE_NAME: Record<Team, string> = {
  GREEN: "Nawab's Loyalists",
  RED: "East India Company",
  GOLD: "Jagat Seth",
};

function roleName(role: string | undefined) {
  return COURT.find((entry) => entry.id === role)?.name ?? role?.replaceAll("_", " ") ?? "Unknown";
}

function outcomeStory(game: PublicView) {
  const outcome = game.outcome;
  if (!outcome) return "";
  if (outcome.reason === "MIR_JAFAR_GUESS") {
    return "The Loyalists held the field, but Mir Jafar identified Mir Madan. With one final revelation, the Company seized the victory.";
  }
  if (outcome.reason === "JAGAT_SETH_GUESS") {
    return "Both armies claimed the field, but Jagat Seth's final guess was true. The banker alone leaves Plassey victorious.";
  }
  return `${SIDE_NAME[outcome.winner]} secured three rounds and carried the field before any final guess could change the result.`;
}

export function PostGameSummary({
  game,
  playerNames = {},
  onReturnToLobby,
}: PostGameSummaryProps) {
  const { outcome, results, players, roundResults, nominations } = game;

  if (!outcome) return null;

  const resultById = new Map((results ?? []).map((result) => [result.playerId, result]));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const nameOf = (id: string | null) => {
    if (!id) return "No one — time expired";
    const player = playerById.get(id);
    const name = playerNames[id] ?? `Seat ${(player?.seat ?? 0) + 1}`;
    return player ? `#${player.seat + 1} ${name}` : name;
  };
  const greenWins = roundResults.filter((round) => round.winner === "GREEN").length;
  const redWins = roundResults.filter((round) => round.winner === "RED").length;
  const mirMadan = players.find((player) => player.role === "MIR_MADAN");
  const mirJafar = players.find((player) => player.role === "MIR_JAFAR");
  const jagatSeth = players.find((player) => player.role === "JAGAT_SETH");

  const nominationLabel = (nomination: PublicNomination) =>
    nomination.ministerIds?.length
      ? nomination.ministerIds.map(nameOf).join(", ")
      : "No ministers named — the leader timed out";

  return (
    <article className="battle-recap pixel-card overflow-hidden" aria-labelledby="battle-recap-title">
      <header className="battle-recap__hero relative overflow-hidden border-b border-primary/20 px-6 py-10 text-center md:px-12 md:py-14">
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="bracket text-primary/75">Battle report · 23 June 1757</span>
          <p className="mt-7 font-mono text-xs uppercase tracking-[0.3em] text-base-content/60">
            The field is decided
          </p>
          <h2
            id="battle-recap-title"
            className="mt-3 font-display text-5xl font-black uppercase leading-[0.95] text-primary md:text-7xl"
          >
            {SIDE_NAME[outcome.winner]}
            <span className="mt-3 block text-2xl tracking-[0.18em] text-accent md:text-3xl">Victory</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-base-content/75 md:text-base">
            {outcomeStory(game)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-primary/15 bg-base-100/50 px-6 py-6 md:px-12">
        <div className="text-left">
          <span className="bracket text-primary/65">Loyalists</span>
          <strong className="mt-2 block font-display text-5xl text-primary">{greenWins}</strong>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-base-content/40">Rounds</span>
        <div className="text-right">
          <span className="bracket text-accent/80">Company</span>
          <strong className="mt-2 block font-display text-5xl text-accent">{redWins}</strong>
        </div>
      </div>

      <section className="border-b border-primary/15 px-6 py-8 md:px-12" aria-labelledby="campaign-title">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="bracket text-primary/65">01 · The campaign</span>
            <h3 id="campaign-title" className="mt-2 font-display text-3xl font-bold text-primary">
              Round by round
            </h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-content/45">
            {roundResults.length} rounds · {nominations.length} councils
          </span>
        </div>

        <ol className="space-y-4">
          {roundResults.map((round) => {
            const attempts = nominations.filter((nomination) => nomination.round === round.round);
            const approved = [...attempts].reverse().find((nomination) => nomination.approved);
            return (
              <li key={round.round} className="recap-round border border-primary/15 bg-base-100/55">
                <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center md:p-6">
                  <span className="font-display text-4xl font-black text-primary/35">
                    {String(round.round).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-display text-2xl font-bold text-base-content">
                      {round.reason === "DEADLOCK"
                        ? "The council deadlocked"
                        : round.winner === "GREEN"
                          ? "The mission held"
                          : "The mission was sabotaged"}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-base-content/65">
                      {approved
                        ? `Ministers: ${nominationLabel(approved)}. `
                        : "No council received approval. "}
                      {round.reason === "MISSION"
                        ? `${round.successCount} Success · ${round.sabotageCount} Sabotage.`
                        : "Five rejected councils gave the round to the Company."}
                    </p>
                  </div>
                  <span className={`recap-result ${round.winner === "RED" ? "recap-result--red" : ""}`}>
                    {round.winner === "GREEN" ? "Loyalists" : "Company"}
                  </span>
                </div>

                {attempts.length > 0 && (
                  <details className="recap-details border-t border-primary/10">
                    <summary className="cursor-pointer px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70 md:px-6">
                      Inspect {attempts.length} ballot{attempts.length === 1 ? "" : "s"}
                    </summary>
                    <div className="space-y-3 px-5 pb-5 md:px-6">
                      {attempts.map((nomination) => (
                        <div key={`${nomination.round}-${nomination.attempt}`} className="border-l border-accent/50 pl-4">
                          <p className="text-xs font-semibold text-base-content/85">
                            Ballot {nomination.attempt} · {nomination.approved ? "Approved" : "Rejected"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-base-content/55">
                            Leader #{nomination.leaderSeat + 1} · {nominationLabel(nomination)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(nomination.votes).map(([playerId, vote]) => (
                              <span key={playerId} className={`recap-vote ${vote === "REJECT" ? "recap-vote--reject" : ""}`}>
                                {nameOf(playerId)} · {vote === "APPROVE" ? "Yes" : "No"}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-b border-primary/15 px-6 py-8 md:px-12" aria-labelledby="revelation-title">
        <span className="bracket text-primary/65">02 · The final revelation</span>
        <h3 id="revelation-title" className="mt-2 font-display text-3xl font-bold text-primary">
          Mir Madan unmasked
        </h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="recap-reveal">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-content/50">Mir Madan was</span>
            <strong className="mt-2 block font-display text-2xl text-primary">
              {mirMadan ? nameOf(mirMadan.id) : "Not dealt in this match"}
            </strong>
            {mirJafar && (
              <p className="mt-3 text-sm leading-6 text-base-content/65">
                Mir Jafar ({nameOf(mirJafar.id)}) {outcome.mirJafarGuess
                  ? `named ${nameOf(outcome.mirJafarGuess.targetId)} — ${outcome.mirJafarGuess.correct ? "a correct, decisive guess" : "the wrong target"}.`
                  : "never received a final guess."}
              </p>
            )}
          </div>
          <div className="recap-reveal">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-content/50">The banker's gamble</span>
            <strong className="mt-2 block font-display text-2xl text-primary">
              {jagatSeth ? nameOf(jagatSeth.id) : "Jagat Seth was not in play"}
            </strong>
            <p className="mt-3 text-sm leading-6 text-base-content/65">
              {outcome.jagatSethGuess
                ? `Jagat Seth named ${nameOf(outcome.jagatSethGuess.targetId)} — ${outcome.jagatSethGuess.correct ? "correct, winning alone" : "incorrect, leaving empty-handed"}.`
                : "No banker’s guess changed the final result."}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-8 md:px-12" aria-labelledby="identities-title">
        <span className="bracket text-primary/65">03 · Final identities</span>
        <h3 id="identities-title" className="mt-2 font-display text-3xl font-bold text-primary">
          Every secret, revealed
        </h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => {
            const result = resultById.get(player.id);
            const role = player.role ?? result?.role;
            const team = player.team ?? result?.team ?? "GREEN";
            const courtRole = COURT.find((entry) => entry.id === role);
            return (
              <div key={player.id} className="recap-identity">
                {courtRole?.portrait && (
                  <img src={courtRole.portrait} alt="" className="h-14 w-14 rounded-full border border-primary/25 object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-base-content">{nameOf(player.id)}</p>
                  <p className="mt-0.5 text-xs text-primary/75">{roleName(role)}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-base-content/45">
                    {FACTION_META[team].label}
                  </p>
                </div>
                <span className={`recap-fate ${result?.won ? "" : "recap-fate--lost"}`}>
                  {result?.won ? "Won" : "Lost"}
                </span>
              </div>
            );
          })}
        </div>

        {onReturnToLobby && (
          <button type="button" onClick={onReturnToLobby} className="btn btn-primary pixel-btn mt-8 w-full font-mono text-xs uppercase tracking-[0.18em]">
            Return to council lobby
          </button>
        )}
      </section>
    </article>
  );
}
