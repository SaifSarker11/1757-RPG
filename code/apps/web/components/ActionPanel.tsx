import React, { useState } from "react";
import type { PlayerView } from "@/lib/game-types";

interface ActionPanelProps {
  view: PlayerView;
  playerNames?: Record<string, string>;
  onNominate: (ministerIds: string[]) => void;
  onCastVote: (vote: "APPROVE" | "REJECT") => void;
  onPlayCard: (card: "SUCCESS" | "SABOTAGE") => void;
  onDeBussyReveal: (targetId: string) => void;
  onJeanLawLock: (targetId: string) => void;
  onGuess: (targetId: string) => void;
  loading?: boolean;
}

export function ActionPanel({
  view,
  playerNames = {},
  onNominate,
  onCastVote,
  onPlayCard,
  onDeBussyReveal,
  onJeanLawLock,
  onGuess,
  loading = false,
}: ActionPanelProps) {
  const { pending, game } = view;
  const [selectedMinisters, setSelectedMinisters] = useState<string[]>([]);
  const [targetId, setTargetId] = useState<string>("");

  const toggleMinister = (id: string, requiredSize: number) => {
    setSelectedMinisters((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length < requiredSize) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const otherPlayers = game.players.filter((p) => p.id !== view.me.id);

  return (
    <div className="bg-base-100 border-4 border-base-content/20 p-5 pixel-card flex flex-col gap-4">
      <div className="border-b-2 border-base-300 pb-2">
        <h3 className="text-xl font-historical font-bold text-primary uppercase">
          Council Actions
        </h3>
        <span className="text-xs text-base-content/70 font-sans">
          Phase: <span className="font-pixel font-bold text-base-content">{game.phase}</span>
        </span>
      </div>

      {/* 1. SELECTION: Leader nominates ministers */}
      {pending.nominate && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-pixel text-warning">
            YOU ARE THE LEADER. Select exactly {pending.nominate.teamSize} ministers:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {game.players.map((p) => {
              const isSelected = selectedMinisters.includes(p.id);
              const name = playerNames[p.id] ?? `Player ${p.id.slice(0, 6)}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleMinister(p.id, pending.nominate!.teamSize)}
                  className={`btn btn-sm rounded-none font-pixel border-2 text-xs ${
                    isSelected
                      ? "btn-accent text-accent-content border-accent"
                      : "btn-outline"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={
              loading || selectedMinisters.length !== pending.nominate.teamSize
            }
            onClick={() => onNominate(selectedMinisters)}
            className="btn btn-primary rounded-none font-pixel border-2 pixel-btn mt-2"
          >
            CONFIRM NOMINATION ({selectedMinisters.length}/{pending.nominate.teamSize})
          </button>
        </div>
      )}

      {/* 2. BALLOT: Approval Vote */}
      {pending.vote && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-pixel text-info">
            VOTE ON THE PROPOSED MINISTERS:
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => onCastVote("APPROVE")}
              className="btn btn-success flex-1 rounded-none font-pixel border-2 pixel-btn"
            >
              APPROVE (YEAH)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onCastVote("REJECT")}
              className="btn btn-error flex-1 rounded-none font-pixel border-2 pixel-btn"
            >
              REJECT (NAY)
            </button>
          </div>
        </div>
      )}

      {/* 3. RESOLUTION: Mission card play */}
      {pending.playCard && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-pixel text-warning">
            SECRET MISSION RESOLUTION: Cast your secret card:
          </p>
          <div className="flex gap-4">
            {pending.allowedCards.includes("SUCCESS") && (
              <button
                type="button"
                disabled={loading}
                onClick={() => onPlayCard("SUCCESS")}
                className="btn btn-success flex-1 rounded-none font-pixel border-2 pixel-btn"
              >
                PLAY SUCCESS
              </button>
            )}
            {pending.allowedCards.includes("SABOTAGE") && (
              <button
                type="button"
                disabled={loading}
                onClick={() => onPlayCard("SABOTAGE")}
                className="btn btn-error flex-1 rounded-none font-pixel border-2 pixel-btn"
              >
                PLAY SABOTAGE
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. DISCUSSION ABILITY: De Bussy Reveal */}
      {pending.deBussyReveal && (
        <div className="flex flex-col gap-2 p-3 bg-base-200 border-2 border-base-300">
          <span className="font-pixel text-xs font-bold text-accent">
            DE BUSSY SPECIAL ABILITY (ONCE PER MATCH):
          </span>
          <div className="flex gap-2">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="select select-bordered select-sm rounded-none font-pixel flex-1 border-2"
            >
              <option value="">Select target player...</option>
              {otherPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerNames[p.id] ?? `Player ${p.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading || !targetId}
              onClick={() => {
                onDeBussyReveal(targetId);
                setTargetId("");
              }}
              className="btn btn-accent btn-sm rounded-none font-pixel border-2"
            >
              MUTUAL REVEAL
            </button>
          </div>
        </div>
      )}

      {/* 5. DISCUSSION ABILITY: Jean Law Lock */}
      {pending.jeanLawLock && (
        <div className="flex flex-col gap-2 p-3 bg-base-200 border-2 border-base-300">
          <span className="font-pixel text-xs font-bold text-error">
            JEAN LAW CURSE / LOCK (ONCE PER MATCH):
          </span>
          <div className="flex gap-2">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="select select-bordered select-sm rounded-none font-pixel flex-1 border-2"
            >
              <option value="">Select target player to curse...</option>
              {otherPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerNames[p.id] ?? `Player ${p.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading || !targetId}
              onClick={() => {
                onJeanLawLock(targetId);
                setTargetId("");
              }}
              className="btn btn-error btn-sm rounded-none font-pixel border-2"
            >
              CURSE TARGET
            </button>
          </div>
        </div>
      )}

      {/* 6. ENDGAME: Mir Jafar / Jagat Seth Guess */}
      {pending.guess && (
        <div className="flex flex-col gap-2 p-3 bg-error/10 border-2 border-error">
          <span className="font-pixel text-xs font-bold text-error">
            ENDGAME ASSASSINATION GUESS ({pending.guess.replace(/_/g, " ")}):
          </span>
          <div className="flex gap-2">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="select select-bordered select-sm rounded-none font-pixel flex-1 border-2"
            >
              <option value="">Identify target conspirator...</option>
              {otherPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerNames[p.id] ?? `Player ${p.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading || !targetId}
              onClick={() => {
                onGuess(targetId);
                setTargetId("");
              }}
              className="btn btn-error btn-sm rounded-none font-pixel border-2"
            >
              CONFIRM GUESS
            </button>
          </div>
        </div>
      )}

      {/* Default State: Waiting for other players */}
      {!pending.nominate &&
        !pending.vote &&
        !pending.playCard &&
        !pending.deBussyReveal &&
        !pending.jeanLawLock &&
        !pending.guess && (
          <p className="text-xs font-sans text-base-content/60 italic py-2">
            Waiting for other conspirators to deliberate or complete actions...
          </p>
        )}
    </div>
  );
}
