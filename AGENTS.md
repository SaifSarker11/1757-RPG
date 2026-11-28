# External game architecture
- Keep the existing Next.js monorepo and Vercel/Render deployment pipeline; this is the original game, not a framework migration.
- Mount Experience once in the web root layout so music survives navigation and all controls share one deduplicated click listener.
- Keep player preference validation in web/lib/preferences.ts and test it with the existing Vitest runner; pure validation needs no browser or server.
- Apply personal themes only to authenticated dashboard/room pages through semantic CSS variables; public pages always retain the default.
- Browser audio preferences use safe local storage, never game-state persistence; blocked autoplay waits for a user gesture and respects Off.
