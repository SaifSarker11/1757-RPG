import { describe, expect, it } from "vitest";
import { reduce } from "../src/reduce.js";
import { createRng } from "../src/rng.js";
import type { RoleId } from "../src/types.js";
import { publicView, viewFor } from "../src/vision/viewFor.js";
import { FULL_CAST, byRole, gameWithRoles, inPhase } from "./fixtures.js";
import { Harness, T0 } from "./helpers.js";

const full = gameWithRoles(FULL_CAST);
const id = (role: RoleId) => byRole(full, role).id;

describe("viewFor", () => {
  it("shows the player their own role and team", () => {
    const view = viewFor(full, id("MIR_JAFAR"));
    expect(view.me).toMatchObject({ id: id("MIR_JAFAR"), role: "MIR_JAFAR", team: "RED" });
  });

  it("throws for someone not in the game", () => {
    expect(() => viewFor(full, "ghost")).toThrow();
  });

  it("de Bussy and his target see each other's exact role", () => {
    const { state } = reduce(
      full,
      { type: "DEBUSSY_REVEAL", playerId: id("DE_BUSSY"), targetId: id("MIR_JAFAR") },
      T0,
      createRng(1)
    );
    expect(viewFor(state, id("DE_BUSSY")).reveals).toEqual([
      { playerId: id("MIR_JAFAR"), seat: byRole(full, "MIR_JAFAR").seat, role: "MIR_JAFAR", source: "DE_BUSSY" },
    ]);
    expect(viewFor(state, id("MIR_JAFAR")).reveals).toEqual([
      { playerId: id("DE_BUSSY"), seat: byRole(full, "DE_BUSSY").seat, role: "DE_BUSSY", source: "DE_BUSSY" },
    ]);
    expect(viewFor(state, id("NAWAB_SIRAJ")).reveals).toEqual([]);
  });

  it("the reveal persists into later phases", () => {
    const { state } = reduce(
      full,
      { type: "DEBUSSY_REVEAL", playerId: id("DE_BUSSY"), targetId: id("UMICHAD") },
      T0,
      createRng(1)
    );
    expect(viewFor(inPhase(state, "BALLOT", 4), id("DE_BUSSY")).reveals).toHaveLength(1);
  });

  it("only Jean Law sees his lock target", () => {
    const { state } = reduce(
      full,
      { type: "JEANLAW_LOCK", playerId: id("JEAN_LAW"), targetId: id("SAINT_FRASY") },
      T0,
      createRng(1)
    );
    expect(viewFor(state, id("JEAN_LAW")).jeanLawTargetId).toBe(id("SAINT_FRASY"));
    for (const p of state.players.filter((x) => x.role !== "JEAN_LAW")) {
      expect(viewFor(state, p.id).jeanLawTargetId).toBeNull();
    }
  });
});

describe("pending actions", () => {
  it("offers the abilities only in Discussion, until used", () => {
    expect(viewFor(full, id("DE_BUSSY")).pending.deBussyReveal).toBe(true);
    expect(viewFor(full, id("JEAN_LAW")).pending.jeanLawLock).toBe(true);
    expect(viewFor(full, id("MIR_JAFAR")).pending).toMatchObject({
      deBussyReveal: false,
      jeanLawLock: false,
    });
    expect(viewFor(inPhase(full, "SELECTION"), id("DE_BUSSY")).pending.deBussyReveal).toBe(false);
  });

  it("asks only the Leader to nominate, with the team size", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    expect(viewFor(h.state, h.leaderId).pending.nominate).toEqual({ teamSize: 2 });
    const other = h.state.players.find((p) => p.id !== h.leaderId)?.id ?? "";
    expect(viewFor(h.state, other).pending.nominate).toBeNull();
  });

  it("asks for a vote until the player has voted, then shows their own vote", () => {
    const h = new Harness();
    h.nominateFirst();
    expect(viewFor(h.state, "p0").pending.vote).toBe(true);
    h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "REJECT" });
    const view = viewFor(h.state, "p0");
    expect(view.pending.vote).toBe(false);
    expect(view.myVote).toBe("REJECT");
    expect(viewFor(h.state, "p1").myVote).toBeNull();
  });

  it("asks only ministers for a card", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("APPROVE");
    const [minister] = h.state.ministerIds;
    const outsider = h.state.players.find((p) => !h.state.ministerIds.includes(p.id))?.id ?? "";
    expect(viewFor(h.state, minister ?? "").pending.playCard).toBe(true);
    expect(viewFor(h.state, outsider).pending.playCard).toBe(false);
    h.dispatch({ type: "PLAY_CARD", playerId: minister ?? "", card: "SABOTAGE" });
    expect(viewFor(h.state, minister ?? "").myCard).toBe("SABOTAGE");
  });
});

describe("publicView", () => {
  it("lists players without roles before POST_GAME", () => {
    for (const p of publicView(full).players) {
      expect(Object.keys(p).sort()).toEqual(["id", "seat"]);
    }
  });

  it("reveals every role in POST_GAME", () => {
    const view = publicView(inPhase(full, "POST_GAME"));
    expect(view.players.map((p) => p.role)).toEqual(FULL_CAST);
  });

  it("shows who voted but not how", () => {
    const h = new Harness();
    h.nominateFirst();
    h.dispatch({ type: "CAST_VOTE", playerId: "p2", vote: "REJECT" });
    const view = publicView(h.state);
    expect(view.votedIds).toEqual(["p2"]);
    expect(JSON.stringify(view)).not.toContain("REJECT");
  });

  it("shows who played a card but not which", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("APPROVE");
    const [minister] = h.state.ministerIds;
    h.dispatch({ type: "PLAY_CARD", playerId: minister ?? "", card: "SABOTAGE" });
    const view = publicView(h.state);
    expect(view.playedIds).toEqual([minister]);
    expect(JSON.stringify(view)).not.toContain("SABOTAGE");
  });

  it("includes the current team size", () => {
    expect(publicView(gameWithRoles(FULL_CAST, { round: 5 })).teamSize).toBe(7);
  });
});
