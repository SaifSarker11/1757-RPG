import { describe, expect, it } from "vitest";
import { Harness, eventsOfType } from "./helpers.js";

function toResolution(players = 6, seed = 1): Harness {
  const h = new Harness(players, seed);
  h.nominateFirst();
  h.voteAll("APPROVE");
  return h;
}

describe("PLAY_CARD", () => {
  it("only ministers can play, once each", () => {
    const h = toResolution();
    const [minister] = h.state.ministerIds;
    const outsider = h.state.players.find((p) => !h.state.ministerIds.includes(p.id))?.id ?? "";

    let events = h.dispatch({ type: "PLAY_CARD", playerId: outsider, card: "SABOTAGE" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("NOT_A_MINISTER");

    events = h.dispatch({ type: "PLAY_CARD", playerId: minister ?? "", card: "SUCCESS" });
    expect(events).toEqual([{ type: "CARD_PLAYED", playerId: minister }]);

    events = h.dispatch({ type: "PLAY_CARD", playerId: minister ?? "", card: "SABOTAGE" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("ALREADY_PLAYED");
  });

  it("is rejected outside RESOLUTION", () => {
    const h = new Harness();
    const events = h.dispatch({ type: "PLAY_CARD", playerId: "p0", card: "SUCCESS" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("WRONG_PHASE");
  });
});

describe("mission resolution", () => {
  it("all Success → Green takes the round", () => {
    const h = toResolution();
    h.playAll("SUCCESS");
    const resolved = eventsOfType(h.log, "MISSION_RESOLVED")[0];
    expect(resolved).toMatchObject({ round: 1, successCount: 2, sabotageCount: 0, winner: "GREEN" });
    expect(h.state.phase).toBe("ROUND_RESULT");
    expect(h.state.roundResults[0]).toMatchObject({ winner: "GREEN", reason: "MISSION" });
  });

  it("one Sabotage fails a normal round", () => {
    const h = new Harness();
    h.nominate(h.ministersFor("SABOTAGE"));
    h.voteAll("APPROVE");
    const saboteur = h.saboteurId();
    h.dispatch({ type: "PLAY_CARD", playerId: saboteur, card: "SABOTAGE" });
    for (const id of h.state.ministerIds.filter((m) => m !== saboteur)) {
      h.dispatch({ type: "PLAY_CARD", playerId: id, card: "SUCCESS" });
    }
    expect(eventsOfType(h.log, "MISSION_RESOLVED")[0]).toMatchObject({
      sabotageCount: 1,
      winner: "RED",
    });
  });

  it("reveals the cards as a shuffled list, not keyed by player", () => {
    const h = toResolution();
    h.playAll("SUCCESS");
    const resolved = eventsOfType(h.log, "MISSION_RESOLVED")[0];
    expect(resolved?.cards).toEqual(["SUCCESS", "SUCCESS"]);
    expect(JSON.stringify(resolved)).not.toContain(h.state.ministerIds[0] ?? "p");
  });

  it("Round 4 with 7+ players needs 2 Sabotages to fail", () => {
    const h = new Harness(7, 3);
    for (let r = 0; r < 3; r++) {
      // alternate wins so the match is still open at Round 4
      h.playRound(r === 1 ? "SABOTAGE" : "SUCCESS");
    }
    if (h.state.phase === "POST_GAME") throw new Error("match ended early");
    expect(h.state.round).toBe(4);
    h.nominate(h.ministersFor("SABOTAGE"));
    h.voteAll("APPROVE");
    const saboteur = h.saboteurId();
    h.dispatch({ type: "PLAY_CARD", playerId: saboteur, card: "SABOTAGE" });
    for (const id of h.state.ministerIds.filter((m) => m !== saboteur)) {
      h.dispatch({ type: "PLAY_CARD", playerId: id, card: "SUCCESS" });
    }
    expect(eventsOfType(h.log, "MISSION_RESOLVED").at(-1)).toMatchObject({
      round: 4,
      sabotageCount: 1,
      winner: "GREEN",
    });
  });
});

describe("RESOLUTION timeout", () => {
  it("counts missing cards as Success", () => {
    const h = new Harness();
    h.nominate(h.ministersFor("SABOTAGE"));
    h.voteAll("APPROVE");
    h.dispatch({ type: "PLAY_CARD", playerId: h.saboteurId(), card: "SABOTAGE" });
    h.timeout();
    expect(eventsOfType(h.log, "MISSION_RESOLVED")[0]).toMatchObject({
      successCount: 1,
      sabotageCount: 1,
    });
  });
});
