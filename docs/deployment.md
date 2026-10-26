# Deployment Guide

## Overview

This repository contains a Turborepo monorepo with multiple applications:
- **API** (`apps/api`): Fastify server handling game logic, sockets, and admin endpoints.
- **Web** (`apps/web`): Next.js client for players.
- **Admin** (`apps/admin`): Next.js admin console.

Module 11 focuses on production readiness for the API service, including Docker containerisation, health checks, environment variables, and CI/CD pipeline configuration.

## Prerequisites

- **Docker** (>= 24) installed locally.
- **Render** or similar hosting platform (Render, Vercel, Fly.io) with the following environment variables configured:
  - `DATABASE_URL` – PostgreSQL connection string.
  - `REDIS_URL` – Redis connection string (optional, fallback to in‑memory store).
  - `WEB_URL` – URL of the Next.js web app.
  - `ADMIN_URL` – URL of the admin console.
  - `PORT` – Port the API should listen on (default `3001`).

## Building the Docker Image

```sh
# From the repository root
docker build -t rpg-api:latest .
```

The Dockerfile (located at the repository root) builds the entire Turborepo, installs dependencies, runs `pnpm build`, and sets the entry‑point to start the API server.

## Running Locally (Docker)

```sh
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@localhost:5432/db \
  -e REDIS_URL=redis://localhost:6379 \
  -e WEB_URL=http://localhost:3000 \
  -e ADMIN_URL=http://localhost:3002 \
  --name rpg-api \
  rpg-api:latest
```

The container will expose a `/health` endpoint that reports:
- Database connectivity.
- Redis availability.
- Process uptime and memory usage.

## CI/CD Integration

The existing GitHub Actions workflow (`.github/workflows/ci.yml`) already builds the monorepo and triggers a Render deployment. Ensure the following secrets are set in your repository settings:
- `RENDER_SERVICE_ID`
- `RENDER_API_KEY`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (for the web app).

The workflow will automatically run on pushes to `main` and will:
1. Install dependencies.
2. Generate Prisma client.
3. Type‑check, lint, and build all packages.
4. Deploy the API to Render via the webhook.
5. Deploy the web app to Vercel.

## Production Hardening Checklist

- [ ] Verify that `REDIS_URL` is provided in the Render environment; otherwise the API falls back to an in‑memory store.
- [ ] Ensure the `.env.example` file lists all required variables (already updated).
- [ ] Confirm the health endpoint returns `200` when all services are operational.
- [ ] Set up monitoring/alerts on the Render service for uptime and memory usage.
- [ ] Review Docker image size; consider multi‑stage builds if needed.

## Next Steps

- Add a Render `Dockerfile` reference in `render.yaml` (if using Render’s Docker deploy).
- Write integration tests for the `/health` endpoint in CI.
- Document rollback procedures in `docs/rollback.md`.

---
*Generated on $(date) by Antigravity*