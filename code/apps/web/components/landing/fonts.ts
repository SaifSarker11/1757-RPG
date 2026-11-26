import { Inter } from "next/font/google";

/**
 * Landing fonts, scoped to the landing wrapper (see app/page.tsx).
 * Supply (supply.madebyoversight.com) runs Inter for body and heading type —
 * tight-tracked, medium weight for display sizes — with a monospace stack for
 * micro-labels. No global font is set; in-app pages keep their typography.
 */
export const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Supply design tokens, lifted from the live stylesheet of
 * supply.madebyoversight.com (Oversight Supply).
 */
export const supply = {
  canvas: "#ececeb",
  brandCanvas: "#f0efeb",
  surface: "#ffffff",
  surfaceSunken: "#f3f3f2",
  surfaceHover: "#f4f4f3",
  element: "#f8f8f8",
  ink: "#111111",
  textSecondary: "#5c5c5c",
  textTertiary: "#8a8a8a",
  line: "#e6e6e4",
  lineStrong: "#d4d4d1",
  accent: "#ff5206",
  accentHover: "#e84700",
  accentInk: "#c53a00",
  accentWash: "#fff2ec",
  accentLine: "#ffd4c2",
  successInk: "#1f6b3f",
  successWash: "#eaf5ee",
  warnInk: "#8a5a00",
  warnWash: "#fdf4e3",
  dangerInk: "#a8291b",
  dangerWash: "#fdeeec",
  night: "#111111",
} as const;

/** Inline styles — bulletproof font application scoped to the landing. */
export const fontSans = {
  fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
} as const;

export const fontMono = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
} as const;

/**
 * Shared Supply component recipes so every section speaks the same visual
 * language: white surfaces, hairline borders, pill buttons, mono labels.
 */
export const ui = {
  /** White card with hairline border + the soft layered "shell" shadow. */
  card: "rounded-[18px] border border-[#e6e6e4] bg-white",
  /** Card hover: tiny lift + raised shadow (Supply template cards). */
  cardHover:
    "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_14px_-6px_rgba(0,0,0,0.16)]",
  /** Mono uppercase micro-label (Supply "2026" / category labels). */
  label: "text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]",
  /** Filter-bar chip (Supply "All / Webflow / Framer" pills). */
  chip: "inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e4] bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#5c5c5c]",
  /** Primary orange pill (Supply "Get prompt + code"). */
  btnPrimary:
    "inline-flex items-center justify-center rounded-full bg-[#ff5206] px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:bg-[#e84700] hover:shadow-[0_8px_20px_-6px_rgba(255,82,6,0.55)] active:scale-[0.97]",
  /** White surface pill (Supply "Preview" / "Details"). */
  btnSurface:
    "inline-flex items-center justify-center rounded-full border border-[#e6e6e4] bg-white px-5 py-2.5 text-[14px] font-medium text-[#111] transition-all duration-300 hover:bg-[#f4f4f3] hover:border-[#d4d4d1] active:scale-[0.97]",
} as const;
