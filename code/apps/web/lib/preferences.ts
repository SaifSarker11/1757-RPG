/** Browser-independent preference validation, shared by controls and tests. */
export const THEMES = [
  { id: "plassey", name: "Royal Plassey", background: "#111111", surface: "#55362a", text: "#f9d4af", accent: "#e01e1e", elevated: "#4f0505" },
  { id: "ivory-sage", name: "Ivory & Sage", background: "#E4E4DE", surface: "#C4C5BA", text: "#1B1B1B", accent: "#595F39" },
  { id: "navy-cream", name: "Navy & Cream", background: "#0F1A2B", surface: "#D8CFC0", text: "#F5F0E6", accent: "#C5A059" },
  { id: "espresso", name: "Espresso & Champagne", background: "#241B15", surface: "#8C7A6B", text: "#F4EFEA", accent: "#DFC498" },
  { id: "burgundy", name: "Burgundy & Rose", background: "#3B1219", surface: "#D6B4B8", text: "#F7F3F0", accent: "#B88B4A" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const CLICK_SOUNDS = [
  { id: "whisper", name: "Court whisper" },
  { id: "seal", name: "Bronze seal" },
  { id: "drum", name: "Distant war drum" },
  { id: "chime", name: "Shadow chime" },
] as const;
export type ClickSoundId = (typeof CLICK_SOUNDS)[number]["id"];
export function validTheme(value: string | null): ThemeId {
  return THEMES.find((theme) => theme.id === value)?.id ?? "plassey";
}
export function themeForPage(saved: string | null, authenticated: boolean, pathname: string): ThemeId {
  return authenticated && (pathname === "/home" || pathname.startsWith("/room/")) ? validTheme(saved) : "plassey";
}
export function validClickSound(value: string | null): ClickSoundId {
  return CLICK_SOUNDS.find((sound) => sound.id === value)?.id ?? "whisper";
}
export function safeVolume(value: string | null, fallback: number): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}
