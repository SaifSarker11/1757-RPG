import { describe, expect, it } from "vitest";
import { generateRoomCode, generateUniqueRoomCode, normalizeRoomCode } from "./roomCode.js";

describe("generateRoomCode", () => {
  it("makes 6 characters from A-Z0-9", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateRoomCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });

  it("can produce letters beyond A-F (the old hex-only bug)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) for (const ch of generateRoomCode()) seen.add(ch);
    expect([...seen].some((ch) => ch >= "G" && ch <= "Z")).toBe(true);
  });

  it("uses the injected random source", () => {
    expect(generateRoomCode(() => 0)).toBe("AAAAAA");
    expect(generateRoomCode((max) => max - 1)).toBe("999999");
  });
});

describe("normalizeRoomCode", () => {
  it("upper-cases and trims", () => {
    expect(normalizeRoomCode("  ab12cd ")).toBe("AB12CD");
  });

  it("rejects anything that isn't 6 alphanumerics", () => {
    for (const bad of ["", "ABC12", "ABC1234", "AB-12C", "clx9abc0001", "ÄBC123"]) {
      expect(normalizeRoomCode(bad)).toBeNull();
    }
  });
});

describe("generateUniqueRoomCode", () => {
  it("retries until a free code is found", async () => {
    const taken = new Set(["AAAAAA"]);
    let calls = 0;
    const next = () => (calls++ < 6 ? 0 : 1); // first code AAAAAA, then BBBBBB
    await expect(generateUniqueRoomCode(async (c) => taken.has(c), next)).resolves.toBe("BBBBBB");
  });

  it("gives up after 10 attempts", async () => {
    await expect(generateUniqueRoomCode(async () => true)).rejects.toThrow(/10 attempts/);
  });
});
