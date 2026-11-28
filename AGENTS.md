# External game architecture
- Keep the existing Next.js monorepo and Vercel/Render deployment pipeline; this is the original game, not a framework migration.
- Mount Experience once in the web root layout so music survives navigation; controls stay silent with no click sounds or vibration.
- Keep player preference validation in web/lib/preferences.ts and test it with the existing Vitest runner; pure validation needs no browser or server.
- Apply saved personal themes from the first public screen through semantic CSS variables so preferences survive login and navigation.
- Browser audio preferences use safe local storage, never game-state persistence; blocked autoplay waits for a user gesture and respects Off.

- Render the council from the authoritative PlayerView; show only self/private reveals as portraits because visions may be decoys.
- Emit JUnit and JSON from each Vitest workspace in CI and upload reports so reviewers can verify actual execution, not infer it from a badge.
- Select transition art with a session-persisted shuffle bag; show each scene once per cycle and prewarm images to avoid blank overlays.
