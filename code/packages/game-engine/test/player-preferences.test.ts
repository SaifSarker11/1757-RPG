import { describe, expect, it } from "vitest";
import { CLICK_SOUNDS, FACTION_STYLES, THEMES, safeVolume, themeForPage, validClickSound, validTheme } from "../../../apps/web/lib/preferences";
describe("player themes", () => {
 it("keeps royal as default", () => { expect(validTheme(null)).toBe("plassey"); expect(THEMES[0]).toMatchObject({background:"#111111", surface:"#55362a", text:"#f9d4af", accent:"#e01e1e", elevated:"#4f0505"}); });
 it("offers the exact Midnight Opulence reference palette", () => expect(THEMES.find(t => t.id === "midnight-opulence" )).toHaveProperty("colors", ["#1a1a2e", "#16213e", "#0f3460", "#efc07b"]));
 it("offers the exact Golden Hour Elite reference palette", () => expect(THEMES.find(t => t.id === "golden-hour-elite" )).toHaveProperty("colors", ["#FEF4D5", "#F1E49A", "#E6D17B", "#2c1810"]));
 it("offers the exact Emerald Sophistication reference palette", () => expect(THEMES.find(t => t.id === "emerald-sophistication" )).toHaveProperty("colors", ["#0d4c3c", "#2d5a4a", "#7ba05b", "#f4f1eb"]));
 it("offers the exact Platinum Prestige reference palette", () => expect(THEMES.find(t => t.id === "platinum-prestige" )).toHaveProperty("colors", ["#2c3e50", "#34495e", "#bdc3c7", "#ecf0f1"]));
 it("offers the exact Royal Burgundy reference palette", () => expect(THEMES.find(t => t.id === "royal-burgundy" )).toHaveProperty("colors", ["#722f37", "#8b1538", "#a0522d", "#f5f5dc"]));
 it("offers the exact Sapphire Dreams reference palette", () => expect(THEMES.find(t => t.id === "sapphire-dreams" )).toHaveProperty("colors", ["#0f1419", "#1e3a5f", "#4a90a4"]));
 it("offers the exact Rose Gold Romance reference palette", () => expect(THEMES.find(t => t.id === "rose-gold-romance" )).toHaveProperty("colors", ["#b76e79", "#e8b4b8", "#f7e7ce", "#ffffff"]));
 it("offers the exact Obsidian Elegance reference palette", () => expect(THEMES.find(t => t.id === "obsidian-elegance" )).toHaveProperty("colors", ["#0c0c0c", "#2c2c2c", "#4a4a4a", "#bea98e"]));
 it("offers the exact Arctic Luxury reference palette", () => expect(THEMES.find(t => t.id === "arctic-luxury" )).toHaveProperty("colors", ["#f8f8ff", "#e6e6fa", "#b0c4de", "#2f4f4f"]));
 it("offers the exact Quiet Luxury reference palette", () => expect(THEMES.find(t => t.id === "quiet-luxury" )).toHaveProperty("colors", ["#EDE6DA", "#D6CBB8", "#A8998A", "#4F473F"]));
 it("offers the exact Luminous Blue Luxe reference palette", () => expect(THEMES.find(t => t.id === "luminous-blue-luxe" )).toHaveProperty("colors", ["#0B1A33", "#1D3B6A", "#2E6FD8", "#EDE7DC"]));
 it("offers the exact Olive & Deep Wine reference palette", () => expect(THEMES.find(t => t.id === "olive-deep-wine" )).toHaveProperty("colors", ["#2F3A22", "#6E7445", "#5B1A2A", "#EFE6D6"]));
 it("only applies personal themes after login in the game", () => { expect(themeForPage("midnight-opulence",false,"/home")).toBe("plassey"); expect(themeForPage("midnight-opulence",true,"/login")).toBe("plassey"); expect(themeForPage("midnight-opulence",true,"/")).toBe("plassey"); expect(themeForPage("midnight-opulence",true,"/home")).toBe("midnight-opulence"); expect(themeForPage("midnight-opulence",true,"/room/abc")).toBe("midnight-opulence"); });
 it("rejects unsupported themes", () => expect(validTheme("retro")).toBe("plassey"));
});
describe("sound preferences", () => {
 it("provides four distinct click choices", () => expect(new Set(CLICK_SOUNDS.map(s => s.id)).size).toBe(4));
 it("defaults to a suspense cue instead of a legacy chiptune", () => expect(validClickSound(null)).toBe("whisper"));
 it("clamps volume without allowing corrupt values", () => { expect(safeVolume("2",0.35)).toBe(1); expect(safeVolume("-2",0.35)).toBe(0); expect(safeVolume("NaN",0.35)).toBe(0.35); });
});

describe("faction colours", () => {
 it("keeps the Nawab and Loyalists green", () => expect(FACTION_STYLES.GREEN.color).toBe("#2f9e5b"));
 it("keeps the East India Company red", () => expect(FACTION_STYLES.RED.color).toBe("#e01e1e"));
 it("makes Jagat Seth neutral light gray", () => expect(FACTION_STYLES.GOLD.color).toBe("#D3D3D3"));
 it("keeps Royal first with all twelve published alternatives", () => { expect(THEMES[0]?.id).toBe("plassey"); expect(THEMES).toHaveLength(13); });
});
