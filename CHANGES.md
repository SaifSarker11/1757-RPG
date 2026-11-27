# What changed in this cleanup

## New look (apps/web)
- New "Plassey" theme: ink-night background, saffron lamplight, emerald loyalists, crimson conspirators, banker gold.
- Fonts: Cormorant Garamond (display) + Hanken Grotesk (body) + Geist Mono, loaded with `next/font` (no remote CSS @import).
- New public pages: `/` landing (was a redirect to /login), `/rules`, `/characters`, with original painted artwork in `public/images`.
- Sign-in and sign-up redesigned as split screens; guest play is the primary action.
- Game screens (lobby, room) pick up the new theme automatically; old blocky "pixel" styles softened.
- Removed unused landing components and Next.js starter SVGs.

## Bugs fixed
- Room page showed wrong mission team sizes for 11–15 players (now matches the game engine).
- CI deploy jobs failed when Vercel/Render secrets were missing; they now skip cleanly.

## Security fixes
- **Admin console was open to any signed-in user, including guests.** Now restricted to `ADMIN_USER_IDS`.
- **CSRF/origin checks were disabled** in auth and cookies were `SameSite=None`; any `*.vercel.app` site was trusted with credentials. Now only explicit origins are trusted, checks are on, cookies are `SameSite=Lax`.
- API refuses to start in production without a strong `BETTER_AUTH_SECRET`.
- Auth rate limiting enabled; passwords 8–128 chars; request body limit 64 KB; `/health` no longer leaks memory stats.

## Deploying
- **Render (API):** New → Blueprint → pick the repo. Fill `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_URL`, `WEB_URL`, `ADMIN_URL`, `ADMIN_USER_IDS` (+ `REDIS_URL` optional). Plan set to `free`; switch to `starter` to avoid cold starts.
- **Vercel (web):** import repo, Root Directory `code/apps/web`, set `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_SITE_URL`.
- **Vercel (admin):** Root Directory `code/apps/admin`, same API vars.
- Set `WEB_URL` on Render to your exact Vercel URL — preview URLs need `EXTRA_ALLOWED_ORIGINS`.
