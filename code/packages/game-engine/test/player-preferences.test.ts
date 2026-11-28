import { describe, expect, it } from "vitest";
import { CLICK_SOUNDS, THEMES, safeVolume, themeForPage, validClickSound, validTheme } from "../../../apps/web/lib/preferences";
describe("player themes", () => {
 it("keeps royal as default", () => { expect(validTheme(null)).toBe("plassey"); expect(THEMES[0]).toMatchObject({background:"#111111", surface:"#55362a", text:"#f9d4af", accent:"#e01e1e", elevated:"#4f0505"}); });
 it("offers the exact ivory/sage palette", () => { expect(THEMES.find(t => t.id === "ivory-sage")).toMatchObject({background:"#E4E4DE",surface:"#C4C5BA",text:"#1B1B1B",accent:"#595F39"}); });
 it("offers the exact navy/cream palette", () => { expect(THEMES.find(t => t.id === "navy-cream")).toMatchObject({background:"#0F1A2B",surface:"#D8CFC0",text:"#F5F0E6",accent:"#C5A059"}); });
 it("offers the exact espresso palette", () => { expect(THEMES.find(t => t.id === "espresso")).toMatchObject({background:"#241B15",surface:"#8C7A6B",text:"#F4EFEA",accent:"#DFC498"}); });
 it("offers the exact burgundy palette", () => { expect(THEMES.find(t => t.id === "burgundy")).toMatchObject({background:"#3B1219",surface:"#D6B4B8",text:"#F7F3F0",accent:"#B88B4A"}); });
 it("only applies personal themes after login in the game", () => { expect(themeForPage("navy-cream",false,"/home")).toBe("plassey"); expect(themeForPage("navy-cream",true,"/login")).toBe("plassey"); expect(themeForPage("navy-cream",true,"/")).toBe("plassey"); expect(themeForPage("navy-cream",true,"/home")).toBe("navy-cream"); expect(themeForPage("navy-cream",true,"/room/abc")).toBe("navy-cream"); });
 it("rejects unsupported themes", () => expect(validTheme("retro")).toBe("plassey"));
});
describe("sound preferences", () => {
 it("provides four distinct click choices", () => expect(new Set(CLICK_SOUNDS.map(s => s.id)).size).toBe(4));
 it("defaults to a suspense cue instead of a legacy chiptune", () => expect(validClickSound(null)).toBe("whisper"));
 it("clamps volume without allowing corrupt values", () => { expect(safeVolume("2",0.35)).toBe(1); expect(safeVolume("-2",0.35)).toBe(0); expect(safeVolume("NaN",0.35)).toBe(0.35); });
});
