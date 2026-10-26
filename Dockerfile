# Builder stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm i -g pnpm@9

WORKDIR /app

# Copy package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./
COPY . ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the monorepo
RUN pnpm turbo run build

# Production stage
FROM node:20-alpine AS runtime

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile && pnpm prune --prod

ENV NODE_ENV=production
EXPOSE 3001

# Use non-root user
USER appuser

# Start the API server
CMD ["node", "apps/api/src/index.js"]
