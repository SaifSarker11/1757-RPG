import { Instrument_Serif, Outfit } from "next/font/google";

/**
 * Fonts for the landing page, scoped to the landing wrapper (see app/page.tsx).
 * No global font is set — the in-app pages keep their existing typography.
 */
export const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const outfit = Outfit({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

/** Landing palette — historical Bengal: ink, ivory, gold, warm paper cream. */
export const landingColors = {
  ink: "#0A0908",
  inkWarm: "#17110B",
  ivory: "#F6EFE1",
  gold: "#C8A24B",
  goldDeep: "#B08A3C",
  cream: "#FAE2C7",
  creamText: "#2E2010",
  loyalist: "#456B31",
  conspirator: "#93372A",
};

/** Inline styles — bulletproof font application scoped to the landing. */
export const fontDisplay = {
  fontFamily: "var(--font-instrument-serif), Georgia, serif",
} as const;

export const fontBody = {
  fontFamily: "var(--font-outfit), sans-serif",
} as const;
