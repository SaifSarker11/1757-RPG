# =============================================================================
# 1757-RPG API — Production Dockerfile (multi-stage)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies and build the monorepo
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/types/package.json packages/types/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

# Copy full source after install (maximises cache hits)
COPY . .

# Generate Prisma client and build everything.
# prisma.config.ts requires DIRECT_URL, but generate (also re-run by the
# turbo build) never connects. A placeholder, as in CI, keeps real
# credentials out of the build; the runtime stage below doesn't inherit it.
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm db:generate
RUN pnpm turbo run build --filter=api...

# ---------------------------------------------------------------------------
# Stage 2: Minimal production image
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built output and manifests
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/dist apps/api/dist/
COPY --from=builder /app/packages packages/

# Install production-only dependencies
RUN pnpm install --frozen-lockfile --prod

# Prisma 7 generates into packages/db/src/generated (copied with packages/ above)
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client node_modules/@prisma/client/

ENV NODE_ENV=production
EXPOSE 3001

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
