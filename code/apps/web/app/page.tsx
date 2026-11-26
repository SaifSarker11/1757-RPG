import { LandingHero } from "@/components/landing/LandingHero";
import { HowToPlay } from "@/components/landing/HowToPlay";
import { Factions } from "@/components/landing/Factions";
import { RolesGrid } from "@/components/landing/RolesGrid";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { instrumentSerif, outfit } from "@/components/landing/fonts";

/**
 * The public landing page. Fonts are scoped here (the wrapper carries the
 * next/font variables); no global styles are touched, and the in-app pages
 * keep their existing typography.
 */
export default function Home() {
  return (
    <main
      id="top"
      className={`${instrumentSerif.variable} ${outfit.variable}`}
    >
      <LandingHero />
      <HowToPlay />
      <Factions />
      <RolesGrid />
      <ClosingCta />
    </main>
  );
}
