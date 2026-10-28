import { describe, expect, it } from "vitest";
import { ALL_NAMED_ROLES } from "../src/config/gameConfig.js";
import { resolveSettings } from "../src/settings.js";
import type { NamedRoleId } from "../src/types.js";

describe("resolveSettings", () => {
  it("defaults to a 120 s discussion and every role", () => {
    const settings = resolveSettings();
    expect(settings.discussionSeconds).toBe(120);
    expect([...settings.enabledRoles].sort()).toEqual([...ALL_NAMED_ROLES].sort());
  });

  it("accepts the 30 and 300 s bounds", () => {
    expect(resolveSettings({ discussionSeconds: 30 }).discussionSeconds).toBe(30);
    expect(resolveSettings({ discussionSeconds: 300 }).discussionSeconds).toBe(300);
  });

  it("rejects discussion times outside 30-300 s or non-integers", () => {
    expect(() => resolveSettings({ discussionSeconds: 29 })).toThrow(RangeError);
    expect(() => resolveSettings({ discussionSeconds: 301 })).toThrow(RangeError);
    expect(() => resolveSettings({ discussionSeconds: 60.5 })).toThrow(RangeError);
  });

  it("always enables Nawab Siraj and removes duplicates", () => {
    const settings = resolveSettings({ enabledRoles: ["DE_BUSSY", "DE_BUSSY"] });
    expect([...settings.enabledRoles].sort()).toEqual(["DE_BUSSY", "NAWAB_SIRAJ"]);
  });

  it("rejects unknown roles", () => {
    expect(() =>
      resolveSettings({ enabledRoles: ["NOT_A_ROLE" as NamedRoleId] })
    ).toThrow(RangeError);
  });
});
