import { LandingHero } from "@/components/landing/LandingHero";
import { HowToPlay } from "@/components/landing/HowToPlay";
import { Factions } from "@/components/landing/Factions";
import { RolesGrid } from "@/components/landing/RolesGrid";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { fontSans, inter } from "@/components/landing/fonts";

/**
 * The public landing page — Supply design system (supply.madebyoversight.com):
 * warm light-gray canvas, white hairline cards, vivid orange accent, Inter
 * display type with tight tracking, mono micro-labels and a fine grain layer.
 * Fonts are scoped here (the wrapper carries the next/font variable); no
 * global styles are touched, and the in-app pages keep their existing
 * typography.
 */
export default function Home() {
  return (
    <main
      id="top"
      className={`relative min-h-screen w-full bg-[#ececeb] text-[#111] ${inter.variable}`}
      style={fontSans}
    >
      {/* Fine grain over everything — Supply's fractal-noise texture */}
      <div aria-hidden className="grain-overlay" />
      <LandingHero />
      <HowToPlay />
      <Factions />
      <RolesGrid />
      <ClosingCta />
    </main>
  );
}
