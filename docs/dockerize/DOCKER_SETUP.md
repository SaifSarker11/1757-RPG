# Docker Setup Guide — Hybrid Strategy

## Overview

This document describes the Docker configuration for the SPL monorepo using a **hybrid strategy**: backend services (Fastify API, PostgreSQL, Redis) run in Docker containers, while frontend applications (Next.js, Expo) can run either on your host machine or inside Docker.

### Why This Approach?

1. **Consistency**: Backend services run in identical environments across development, CI/CD, and production
2. **Offline Development**: Local PostgreSQL mirrors Neon DB, enabling development without internet
3. **Flexibility**: Choose to run frontends locally (faster iteration) or in Docker (full containerization)
4. **Monorepo Optimization**: Multi-stage builds handle pnpm's hoisted `node_modules` correctly
5. **LAN Access**: Expo can be accessed from physical devices on your local network

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network (bridge)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │   Fastify    │       │
│  │   (5432)     │  │   (6379)     │  │   API (3001) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Next.js Web │  │  Expo Mobile │  (Optional - in Docker) │
│  │   (3000)     │  │   (8081)     │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓ Exposed to Host (localhost:PORT)
    ┌─────────────────────────────────────────┐
    │  Host Machine (pnpm dev / turbo dev)    │
    │  - Next.js Web (3000)                   │
    │  - Expo Mobile (8081)                   │
    │  - IDE / Development Tools              │
    └─────────────────────────────────────────┘
```

---

## What We Did

### 1. Modified Prisma Client (`packages/db/src/index.ts`)

**Problem**: The original implementation always used `PrismaNeon` (WebSocket adapter), which fails when connecting to a local PostgreSQL instance in Docker.

**Solution**: Added runtime detection of the database URL:
- If `DATABASE_URL` contains `neon.tech` → Use `PrismaNeon` with WebSocket adapter
- Otherwise → Use standard `PrismaClient` with TCP connection

**Benefits**:
- Single codebase works with both Neon (production) and local PostgreSQL (development)
- No environment-specific code paths needed
- Automatic fallback to TCP for Docker

```typescript
function isNeonDatabase(connectionString: string): boolean {
  return connectionString.includes("neon.tech");
}

// Use Neon adapter for serverless connections
if (isNeonDatabase(connectionString)) {
  // ... PrismaNeon setup
}

// Use standard TCP for local PostgreSQL
return new PrismaClient();
```

### 2. Multi-Stage Dockerfiles

**Problem**: pnpm monorepos with hoisted `node_modules` are tricky to containerize:
- Workspace dependencies must be installed in the correct order
- All `package.json` files across `apps/` and `packages/` must be present
- Build cache should be optimized to avoid reinstalling on code changes

**Solution**: Three-stage build process:

**Stage 1: Dependencies**
- Copy workspace configuration (`pnpm-workspace.yaml`, `pnpm-lock.yaml`)
- Copy all `package.json` files from apps and packages
- Run `pnpm install --frozen-lockfile`
- Result: Cached layer with all dependencies

**Stage 2: Development**
- Copy `node_modules` from Stage 1
- Copy source code
- Run service-specific setup (e.g., `pnpm db:generate` for API)
- Start development server

**Benefits**:
- Dependency layer is cached separately from code
- Rebuilding after code changes is fast
- Hoisted `node_modules` are correctly shared across packages

### 3. Docker Compose Configuration

**Backend Services (Always Active)**:
- **PostgreSQL 16**: Mirrors Neon DB for offline development
  - Healthcheck ensures readiness before API starts
  - Data persisted in named volume `postgres_data`
  - Accessible at `postgres:5432` (internal) or `localhost:5432` (host)

- **Redis 7**: For caching and session management
  - Healthcheck ensures readiness
  - Data persisted in named volume `redis_data`

- **Fastify API**: Runs `pnpm --filter api dev`
  - Depends on PostgreSQL and Redis being healthy
  - Automatically runs `pnpm db:push` on startup to sync schema
  - Exposed at `localhost:3001`

**Frontend Services (Optional/Commented)**:
- **Next.js Web**: Runs `pnpm --filter web dev`
  - Uncomment to run in Docker
  - Exposed at `localhost:3000`

- **Expo Mobile**: Runs `pnpm --filter mobile dev`
  - Uncomment to run in Docker
  - Metro bundler accessible at `localhost:8081`
  - `REACT_NATIVE_PACKAGER_HOSTNAME` set to host IP for LAN access

**Bridge Network**: All services on `app-network` for internal communication

### 4. Helper Scripts

**Windows (PowerShell)**: `scripts/docker-start.ps1`
- Auto-detects local IP using `Get-NetIPAddress`
- Supports flags: `-IncludeWeb`, `-IncludeMobile`, `-All`
- Sets environment variables for Docker Compose

**macOS/Linux (Bash)**: `scripts/docker-start.sh`
- Auto-detects local IP using `ifconfig` (macOS) or `hostname -I` (Linux)
- Supports flags: `--web`, `--mobile`, `--all`
- Sets environment variables for Docker Compose

---

## Problems We Faced & Solutions

### Problem 1: Database Adapter Incompatibility

**Issue**: Neon's WebSocket adapter (`@prisma/adapter-neon`) requires a serverless environment. Local PostgreSQL uses standard TCP connections. The original code always tried to use Neon, causing connection failures in Docker.

**Solution**: Implemented conditional adapter selection based on the database URL hostname. This allows the same code to work with both Neon (production) and local PostgreSQL (development).

### Problem 2: Monorepo Dependency Hoisting

**Issue**: pnpm hoists dependencies to the root `node_modules`, but Docker's `COPY` command doesn't preserve this structure correctly. Copying individual app directories loses the hoisted dependencies.

**Solution**: Multi-stage build that:
1. Copies the entire workspace structure (all `package.json` files)
2. Runs `pnpm install` in the container (respects hoisting)
3. Copies the resulting `node_modules` to the final stage
4. Copies source code separately for better cache invalidation

### Problem 3: Expo Metro Bundler on LAN

**Issue**: Expo's Metro bundler runs inside a Docker container, but physical devices on your local network can't resolve `localhost` or `127.0.0.1`. The QR code generated by Metro is inaccessible from your phone.

**Solution**: 
- Set `REACT_NATIVE_PACKAGER_HOSTNAME` to the host machine's actual LAN IP (e.g., `192.168.1.100`)
- Helper scripts auto-detect this IP and pass it to Docker Compose
- Expo Go on your phone can now scan the QR code and connect to the dev server

### Problem 4: Database Schema Synchronization

**Issue**: When the API container starts, the database schema might not exist yet. Prisma migrations need to run before the API can connect.

**Solution**: Docker Compose entrypoint runs `pnpm db:push` before starting the API:
```bash
CMD ["sh", "-c", "pnpm --filter @repo/db db:push && pnpm --filter api dev"]
```

This ensures the schema is always in sync when the API starts.

---

## How to Use

### Quick Start: Backend in Docker, Frontend on Host

This is the recommended workflow for rapid development.

**Windows (PowerShell)**:
```powershell
# Start backend services
.\scripts\docker-start.ps1

# In another terminal, run frontend on host
pnpm dev
```

**macOS/Linux**:
```bash
# Start backend services
./scripts/docker-start.sh

# In another terminal, run frontend on host
pnpm dev
```

**What happens**:
1. PostgreSQL, Redis, and Fastify API start in Docker
2. Next.js and Expo start on your host machine
3. Frontend apps connect to the API at `http://localhost:3001`
4. Expo Go on your phone connects to Metro at `http://<YOUR_IP>:8081`

### Advanced: Everything in Docker

**Windows (PowerShell)**:
```powershell
.\scripts\docker-start.ps1 -All
```

**macOS/Linux**:
```bash
./scripts/docker-start.sh --all
```

**What happens**:
1. All services (backend + frontend) start in Docker
2. Access Next.js at `http://localhost:3000`
3. Access API at `http://localhost:3001`
4. Expo Metro at `http://localhost:8081` (or your LAN IP)

### Selective Services

**Start only backend + web**:
```powershell
.\scripts\docker-start.ps1 -IncludeWeb
```

**Start only backend + mobile**:
```bash
./scripts/docker-start.sh --mobile
```

### Manual Docker Commands

**View running services**:
```bash
docker compose ps
```

**View logs**:
```bash
docker compose logs -f api          # Follow API logs
docker compose logs postgres        # View PostgreSQL logs
docker compose logs --tail=50 redis # Last 50 Redis logs
```

**Stop all services**:
```bash
docker compose down
```

**Stop and remove volumes** (reset database):
```bash
docker compose down -v
```

**Rebuild images** (after Dockerfile changes):
```bash
docker compose build
```

**Access PostgreSQL CLI**:
```bash
docker compose exec postgres psql -U postgres -d spl_dev
```

**Access Redis CLI**:
```bash
docker compose exec redis redis-cli
```

---

## Environment Configuration

### Host Machine (.env)

Used when running frontend on your host:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spl_dev"
NEXT_PUBLIC_API_URL="http://localhost:3001"
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

### Docker Containers (.env.docker)

Used when running services inside Docker:
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/spl_dev"
NEXT_PUBLIC_API_URL="http://localhost:3001"
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

**Key difference**: Inside Docker, use service names (`postgres`, `api`) instead of `localhost`.

---

## Verification & Testing

### 1. Verify Docker Builds

```bash
docker compose build
```

Should complete without errors. This validates all Dockerfiles.

### 2. Verify Backend Stack

```bash
# Start backend only
docker compose up -d postgres redis api

# Wait 10-15 seconds for initialization

# Check API health
curl http://localhost:3001/health
# Expected response: {"status":"ok","timestamp":"2024-..."}

# Check database connection
docker compose logs api | grep "database"

# Check Redis connection
docker compose exec redis redis-cli ping
# Expected response: PONG
```

### 3. Verify Frontend Connection

```bash
# Start frontend on host
pnpm dev

# Open http://localhost:3000 in browser
# Should load without connection errors

# Check browser console for API calls
# Should see successful requests to http://localhost:3001
```

### 4. Verify Expo on LAN

```bash
# Start mobile in Docker
docker compose up -d mobile

# View logs to get QR code
docker compose logs mobile

# Scan QR code with Expo Go on your phone
# Should connect and load the app
```

### 5. Type Checking

```bash
pnpm typecheck
```

Should pass without errors, confirming Prisma client changes compile correctly.

---

## Performance Optimization

### 1. Docker Build Cache

- Dependencies are cached separately from code
- Rebuilding after code changes is fast (~5-10 seconds)
- Changing `package.json` invalidates cache (~30-60 seconds)

### 2. Volume Mounts (Optional)

For faster development, mount source code as volumes:

```yaml
api:
  volumes:
    - ./apps/api:/app/apps/api
    - ./packages/db:/app/packages/db
```

**Trade-off**: Slightly slower startup, but changes reflect immediately without rebuild.

### 3. Resource Limits

Add resource constraints to prevent runaway containers:

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: "1"
        memory: 512M
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - run: docker compose build
      - run: docker compose up -d
      - run: docker compose exec -T api curl http://localhost:3001/health
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Failed

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify database exists
docker compose exec postgres psql -U postgres -l

# Reset database
docker compose down -v
docker compose up -d postgres
```

### Expo QR Code Not Scanning

```bash
# Verify HOST_IP is set correctly
docker compose exec mobile env | grep REACT_NATIVE_PACKAGER_HOSTNAME

# Check if your phone can reach the IP
ping <YOUR_IP>

# Manually set IP
HOST_IP=192.168.1.100 docker compose up -d mobile
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a

# Remove volumes
docker volume prune
```

---

## Next Steps

1. **Run the backend**: `./scripts/docker-start.ps1` (Windows) or `./scripts/docker-start.sh` (macOS/Linux)
2. **Verify health**: `curl http://localhost:3001/health`
3. **Start frontend**: `pnpm dev`
4. **Test Expo**: Scan QR code with Expo Go on your phone

---

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pnpm Monorepo Guide](https://pnpm.io/workspaces)
- [Prisma Adapter Documentation](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/overview)
- [Expo Development Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Fastify Documentation](https://www.fastify.io/)
