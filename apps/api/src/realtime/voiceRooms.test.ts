import { describe, expect, it } from "vitest";
import { VoiceRooms } from "./voiceRooms.js";

describe("VoiceRooms", () => {
  it("returns the peers already present on join", () => {
    const voice = new VoiceRooms();
    expect(voice.join("r1", "s1", "u1")).toEqual([]);
    expect(voice.join("r1", "s2", "u2")).toEqual([{ socketId: "s1", userId: "u1", muted: false }]);
    expect(voice.list("r1").map((p) => p.socketId)).toEqual(["s1", "s2"]);
    expect(voice.list("r2")).toEqual([]);
  });

  it("rejoining doesn't list yourself or count twice", () => {
    const voice = new VoiceRooms(2);
    voice.join("r1", "s1", "u1");
    voice.join("r1", "s2", "u2");
    expect(voice.join("r1", "s2", "u2")).toEqual([{ socketId: "s1", userId: "u1", muted: false }]);
    expect(voice.join("r1", "s3", "u3")).toBeNull(); // full
  });

  it("tracks mute and leaving", () => {
    const voice = new VoiceRooms();
    voice.join("r1", "s1", "u1");
    expect(voice.setMuted("r1", "s1", true)).toBe(true);
    expect(voice.list("r1")[0]?.muted).toBe(true);
    expect(voice.setMuted("r1", "nobody", true)).toBe(false);
    expect(voice.leave("r1", "s1")).toBe(true);
    expect(voice.leave("r1", "s1")).toBe(false);
    expect(voice.has("r1", "s1")).toBe(false);
  });

  it("hands out copies so callers can't change the registry", () => {
    const voice = new VoiceRooms();
    voice.join("r1", "s1", "u1");
    voice.list("r1")[0]!.muted = true;
    expect(voice.list("r1")[0]?.muted).toBe(false);
  });
});
