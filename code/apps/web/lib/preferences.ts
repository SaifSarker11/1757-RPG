/** Browser-independent preference validation, shared by controls and tests. */
export const THEMES = [
  { id: "plassey", name: "Royal Plassey", background: "#111111", surface: "#55362a", text: "#f9d4af", accent: "#e01e1e", elevated: "#4f0505" },
  { id: "midnight-opulence", name: "Midnight Opulence", background: "#1a1a2e", surface: "#16213e", text: "#efc07b", accent: "#efc07b", colors: ["#1a1a2e", "#16213e", "#0f3460", "#efc07b"] },
  { id: "golden-hour-elite", name: "Golden Hour Elite", background: "#FEF4D5", surface: "#F1E49A", text: "#2c1810", accent: "#2c1810", colors: ["#FEF4D5", "#F1E49A", "#E6D17B", "#2c1810"] },
  { id: "emerald-sophistication", name: "Emerald Sophistication", background: "#0d4c3c", surface: "#2d5a4a", text: "#f4f1eb", accent: "#7ba05b", colors: ["#0d4c3c", "#2d5a4a", "#7ba05b", "#f4f1eb"] },
  { id: "platinum-prestige", name: "Platinum Prestige", background: "#2c3e50", surface: "#34495e", text: "#ecf0f1", accent: "#bdc3c7", colors: ["#2c3e50", "#34495e", "#bdc3c7", "#ecf0f1"] },
  { id: "royal-burgundy", name: "Royal Burgundy", background: "#722f37", surface: "#8b1538", text: "#f5f5dc", accent: "#a0522d", colors: ["#722f37", "#8b1538", "#a0522d", "#f5f5dc"] },
  { id: "sapphire-dreams", name: "Sapphire Dreams", background: "#0f1419", surface: "#1e3a5f", text: "#4a90a4", accent: "#4a90a4", colors: ["#0f1419", "#1e3a5f", "#4a90a4"] },
  { id: "rose-gold-romance", name: "Rose Gold Romance", background: "#ffffff", surface: "#f7e7ce", text: "#b76e79", accent: "#b76e79", colors: ["#b76e79", "#e8b4b8", "#f7e7ce", "#ffffff"] },
  { id: "obsidian-elegance", name: "Obsidian Elegance", background: "#0c0c0c", surface: "#2c2c2c", text: "#bea98e", accent: "#bea98e", colors: ["#0c0c0c", "#2c2c2c", "#4a4a4a", "#bea98e"] },
  { id: "arctic-luxury", name: "Arctic Luxury", background: "#f8f8ff", surface: "#e6e6fa", text: "#2f4f4f", accent: "#2f4f4f", colors: ["#f8f8ff", "#e6e6fa", "#b0c4de", "#2f4f4f"] },
  { id: "quiet-luxury", name: "Quiet Luxury", background: "#EDE6DA", surface: "#D6CBB8", text: "#4F473F", accent: "#4F473F", colors: ["#EDE6DA", "#D6CBB8", "#A8998A", "#4F473F"] },
  { id: "luminous-blue-luxe", name: "Luminous Blue Luxe", background: "#0B1A33", surface: "#1D3B6A", text: "#EDE7DC", accent: "#2E6FD8", colors: ["#0B1A33", "#1D3B6A", "#2E6FD8", "#EDE7DC"] },
  { id: "olive-deep-wine", name: "Olive & Deep Wine", background: "#2F3A22", surface: "#6E7445", text: "#EFE6D6", accent: "#5B1A2A", colors: ["#2F3A22", "#6E7445", "#5B1A2A", "#EFE6D6"] },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export function validTheme(value: string | null): ThemeId {
  return THEMES.find((theme) => theme.id === value)?.id ?? "plassey";
}
export function themeForPage(saved: string | null, _authenticated: boolean, _pathname: string): ThemeId {
  return validTheme(saved);
}
export function safeVolume(value: string | null, fallback: number): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}

/** Faction identity never changes when a player chooses a personal palette. */
export const FACTION_STYLES = {
  GREEN: { color: "#2f9e5b", surface: "faction-surface faction-green", text: "text-loyal border-loyal", badge: "bg-loyal/15 text-loyal border-loyal/50", label: "Loyalist" },
  RED: { color: "#e01e1e", surface: "faction-surface faction-red", text: "text-traitor border-traitor", badge: "bg-traitor/15 text-traitor border-traitor/50", label: "Conspirator" },
  GOLD: { color: "#D3D3D3", surface: "faction-surface faction-gray", text: "text-banker border-banker", badge: "bg-banker/15 text-banker border-banker/50", label: "Neutral" },
} as const;
