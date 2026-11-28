# Testing 1757 (Vitest)

“Vtest” refers to **Vitest**, the automated TypeScript test runner used here.
The tests exist below the `code` monorepo, not in a root `test` folder.

## Where the tests are

- [`code/packages/game-engine/test/`](code/packages/game-engine/test/): deterministic game rules, full matches, role assignment, voting, missions, scoring, endgame, privacy, and player preferences.
- [`code/apps/api/src/`](code/apps/api/src/): colocated `*.test.ts` files for server actions, sessions, room events, and trusted origins.
- New council identity checks: [`council-privacy.test.ts`](code/packages/game-engine/test/council-privacy.test.ts).

## Run them yourself

```bash
cd code
pnpm install --frozen-lockfile
pnpm db:generate
pnpm test                         # all workspace suites, no cached test results
pnpm --filter @repo/game-engine test
pnpm --filter api test
```

API tests need a configured `DATABASE_URL` and `DIRECT_URL` for Prisma initialization;
CI supplies dummy URLs and tests mock database operations. Engine tests need no live services.

## Instructor / reviewer evidence

1. Open [GitHub Actions](https://github.com/SaifSarker11/1757-RPG/actions/workflows/ci.yml).
2. Select the latest commit and open **ci → Run Vitest suites (game engine and API)**.
3. The run summary lists passed, failed, and pending/TODO counts for each workspace.
4. Download **vitest-results** for JUnit XML and JSON reports; retained for 30 days.

Tests are executed before the build and deployment jobs. A failed test prevents those jobs.
An overall green workflow is not proof that a hosting provider finished: the Vercel jobs
perform their deployments, while Render's deployment status must also be checked in Render.

## Scope and limitations

Full match tests cover Loyalist and Company wins, Mir Jafar/Jagat Seth guesses, nomination
limits, and role secrecy. Browser playtests check real sign-in, room creation/joining,
chat and the signed-in table. Unit tests do not prove browser rendering or eliminate every bug.
Any reported TODO cases are unfinished, not passes. No coverage percentage is claimed.
