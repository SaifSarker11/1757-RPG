# Known Errors Log

## 2026-06-03

**Issue**: `PlayerRole` enum had `LUTFUNNES` instead of the correct spelling `LUTFUNNESA`.

**Fixed in**:
- `packages/db/prisma/schema.prisma` — enum value changed to `LUTFUNNESA`
- `packages/types/src/index.ts` — `RoleName` literal changed to `"lutfunnesa"`
- `packages/types/src/index.d.ts` — declaration updated to match
- `apps/api/src/game/roleAssignment.ts` — all role references updated
- `apps/api/src/services/roleAssignmentService.ts` — all role references updated

**Actions taken**:
- Regenerated Prisma client with `pnpm --filter db db:generate`
- Pushed schema with `pnpm db:push --accept-data-loss`
- Verified clean typecheck with `pnpm typecheck`
