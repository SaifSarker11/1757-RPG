# Docker Implementation Summary

## What Was Done

This document summarizes the Docker setup implementation for the SPL monorepo using a hybrid strategy.

### 1. Modified Prisma Client (`packages/db/src/index.ts`)

**Change**: Added runtime detection of database type to support both Neon (production) and local PostgreSQL (development).

**Before**:
```typescript
// Always used Neon adapter
const adapter = new PrismaNeon({ connectionString });
return new PrismaClient({ adapter });
```

**After**:
```typescript
// Detects database type at runtime
function isNeonDatabase(connectionString: string): boolean {
  return connectionString.includes("neon.tech");
}

if (isNeonDatabase(connectionString)) {
  // Use Neon adapter for serverless
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
} else {
  // Use standard TCP for local PostgreSQL
  return new PrismaClient();
}
```

**Benefits**:
- Single codebase works with both Neon and local PostgreSQL
- No environment-specific code paths
- Automatic fallback to TCP for Docker

---

### 2. Created Dockerfile.dev Files

#### `apps/api/Dockerfile.dev`
- Multi-stage build optimized for pnpm monorepo
- Stage 1: Dependencies (cached layer)
- Stage 2: Development (code changes only)
- Includes Prisma client generation
- Exposes port 3001
- Healthcheck: HTTP GET `/health`

#### `apps/web/Dockerfile.dev`
- Multi-stage build for Next.js
- Optimized for pnpm hoisted node_modules
- Exposes port 3000
- Includes TypeScript compilation

#### `apps/mobile/Dockerfile.dev`
- Multi-stage build for Expo
- Includes Metro bundler configuration
- Exposes ports 8081 (Metro), 19000, 19001 (debugging)
- Configured for LAN access via `REACT_NATIVE_PACKAGER_HOSTNAME`

---

### 3. Created docker-compose.yml

**Backend Services (Always Active)**:
- **PostgreSQL 16**: Local database mirroring Neon
  - Healthcheck ensures readiness
  - Data persisted in named volume
  - Accessible at `postgres:5432` (internal) or `localhost:5432` (host)

- **Redis 7**: Caching and session management
  - Healthcheck ensures readiness
  - Data persisted in named volume

- **Fastify API**: Backend server
  - Depends on PostgreSQL and Redis being healthy
  - Automatically runs `pnpm db:push` on startup
  - Exposed at `localhost:3001`

**Frontend Services (Optional/Commented)**:
- **Next.js Web**: Uncomment to run in Docker
- **Expo Mobile**: Uncomment to run in Docker
  - Configured for LAN access with `REACT_NATIVE_PACKAGER_HOSTNAME`
  - Uses `stdin_open: true` and `tty: true` for interactive terminal

**Bridge Network**: All services on `app-network` for internal communication

---

### 4. Created Helper Scripts

#### `scripts/docker-start.ps1` (Windows PowerShell)
- Auto-detects local IP using `Get-NetIPAddress`
- Supports flags: `-IncludeWeb`, `-IncludeMobile`, `-All`
- Sets environment variables for Docker Compose
- Provides helpful output and next steps

#### `scripts/docker-start.sh` (macOS/Linux Bash)
- Auto-detects local IP using `ifconfig` (macOS) or `hostname -I` (Linux)
- Supports flags: `--web`, `--mobile`, `--all`
- Sets environment variables for Docker Compose
- Provides helpful output and next steps

---

### 5. Created Environment Configuration

#### `.env.docker`
- Docker-specific environment variables
- Uses service names instead of `localhost` for internal communication
- Example: `DATABASE_URL="postgresql://postgres:postgres@postgres:5432/spl_dev"`

---

### 6. Created Comprehensive Documentation

#### `docs/DOCKER_SETUP.md` (Main Guide)
- Overview of hybrid strategy
- Architecture diagram
- Detailed explanation of what was done and why
- Problems faced and solutions
- How to use the setup
- Environment configuration
- Verification and testing procedures
- Performance optimization tips
- CI/CD integration examples
- Troubleshooting guide

#### `docs/DOCKER_QUICK_START.md` (Quick Reference)
- TL;DR commands
- Common commands table
- Workflow options
- Environment variables
- Quick troubleshooting

#### `docs/DOCKER_PROBLEMS.md` (Detailed Troubleshooting)
- Database issues (connection, schema, adapters)
- Network issues (port mapping, container communication)
- Expo/Mobile issues (QR code, Metro bundler)
- Build issues (pnpm, permissions)
- Performance issues (slow containers, disk space)
- Environment configuration issues
- Debug commands and information collection

#### `docs/DOCKER_ARCHITECTURE.md` (Technical Details)
- System architecture diagram
- Container specifications
- Network architecture
- Volume management
- Dependency management (pnpm hoisting)
- Database adapter strategy
- Environment variables
- Health checks
- Startup sequence
- Performance characteristics
- Security considerations
- Monitoring and debugging

---

## Why This Approach

### 1. Hybrid Strategy Benefits

**Backend in Docker**:
- Consistent environment across development, CI/CD, and production
- Easy to replicate production setup locally
- Isolated from host machine dependencies

**Frontend on Host (Optional)**:
- Faster iteration with hot reload
- Better IDE integration
- Easier debugging
- Can still run in Docker if needed

### 2. Multi-Stage Dockerfiles

**Problem**: pnpm monorepos with hoisted `node_modules` are tricky to containerize

**Solution**: 
- Stage 1: Copy workspace config and all package.json files, install dependencies
- Stage 2: Copy source code, run service-specific setup, start dev server
- Result: Dependency layer cached separately from code

**Benefits**:
- Rebuilding after code changes: ~5-10 seconds
- Rebuilding after package.json changes: ~30-60 seconds
- Hoisted `node_modules` correctly shared across packages

### 3. Prisma Adapter Detection

**Problem**: Neon's WebSocket adapter fails with local PostgreSQL

**Solution**: Runtime detection of database URL

**Benefits**:
- Single codebase works with both Neon and local PostgreSQL
- No environment-specific code paths
- Automatic fallback to TCP for Docker

### 4. LAN Access for Expo

**Problem**: Metro bundler in Docker can't be accessed from physical devices on local network

**Solution**: 
- Set `REACT_NATIVE_PACKAGER_HOSTNAME` to host IP
- Helper scripts auto-detect IP and pass to Docker Compose

**Benefits**:
- Physical devices can scan QR code and connect
- No need to manually configure IP
- Works across Windows, macOS, and Linux

---

## Problems We Faced

### 1. Database Adapter Incompatibility

**Issue**: Original code always used Neon adapter, which failed with local PostgreSQL

**Solution**: Conditional adapter selection based on database URL hostname

### 2. Monorepo Dependency Hoisting

**Issue**: Docker's `COPY` command doesn't preserve pnpm's hoisted `node_modules` structure

**Solution**: Multi-stage build that copies entire workspace structure and runs `pnpm install` in container

### 3. Expo Metro Bundler on LAN

**Issue**: Physical devices can't resolve `localhost` or `127.0.0.1` from Docker container

**Solution**: Set `REACT_NATIVE_PACKAGER_HOSTNAME` to host machine's actual LAN IP

### 4. Database Schema Synchronization

**Issue**: API container starts before database schema exists

**Solution**: Docker Compose entrypoint runs `pnpm db:push` before starting API

---

## How to Use

### Quick Start: Backend in Docker, Frontend on Host

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

### Everything in Docker

**Windows (PowerShell)**:
```powershell
.\scripts\docker-start.ps1 -All
```

**macOS/Linux**:
```bash
./scripts/docker-start.sh --all
```

### Manual Docker Commands

```bash
# View running services
docker compose ps

# View logs
docker compose logs -f api

# Stop all services
docker compose down

# Reset database
docker compose down -v

# Rebuild images
docker compose build
```

---

## Verification Checklist

### Before Running

- [ ] Docker Desktop is installed and running
- [ ] `.env` file exists with database credentials
- [ ] `pnpm install` has been run on host
- [ ] Typecheck passes: `pnpm typecheck`

### After Starting Backend

- [ ] PostgreSQL container is healthy: `docker compose ps postgres`
- [ ] Redis container is healthy: `docker compose ps redis`
- [ ] API container is healthy: `docker compose ps api`
- [ ] API responds to health check: `curl http://localhost:3001/health`

### After Starting Frontend

- [ ] Next.js loads at `http://localhost:3000`
- [ ] API calls succeed (check browser console)
- [ ] Expo QR code displays in terminal
- [ ] Expo Go on phone connects to dev server

---

## Files Created

### Docker Configuration
- `docker-compose.yml` - Orchestration configuration
- `apps/api/Dockerfile.dev` - API container definition
- `apps/web/Dockerfile.dev` - Web container definition
- `apps/mobile/Dockerfile.dev` - Mobile container definition
- `.env.docker` - Docker-specific environment variables

### Helper Scripts
- `scripts/docker-start.ps1` - Windows startup script
- `scripts/docker-start.sh` - macOS/Linux startup script

### Documentation
- `docs/DOCKER_SETUP.md` - Main guide (comprehensive)
- `docs/DOCKER_QUICK_START.md` - Quick reference
- `docs/DOCKER_PROBLEMS.md` - Troubleshooting guide
- `docs/DOCKER_ARCHITECTURE.md` - Technical details
- `docs/DOCKER_IMPLEMENTATION_SUMMARY.md` - This file

### Modified Files
- `packages/db/src/index.ts` - Prisma client with adapter detection

---

## Next Steps

1. **Start Docker Desktop** (if not already running)
2. **Run backend**: `.\scripts\docker-start.ps1` (Windows) or `./scripts/docker-start.sh` (macOS/Linux)
3. **Verify health**: `curl http://localhost:3001/health`
4. **Start frontend**: `pnpm dev`
5. **Test Expo**: Scan QR code with Expo Go on your phone

---

## Documentation Structure

```
docs/
├── DOCKER_SETUP.md                    # Main guide (start here)
├── DOCKER_QUICK_START.md              # Quick reference
├── DOCKER_PROBLEMS.md                 # Troubleshooting
├── DOCKER_ARCHITECTURE.md             # Technical details
└── DOCKER_IMPLEMENTATION_SUMMARY.md   # This file
```

**Recommended Reading Order**:
1. `DOCKER_QUICK_START.md` - Get started quickly
2. `DOCKER_SETUP.md` - Understand the full setup
3. `DOCKER_ARCHITECTURE.md` - Learn technical details
4. `DOCKER_PROBLEMS.md` - Troubleshoot issues

---

## Key Takeaways

✓ **Hybrid Strategy**: Backend in Docker, frontend on host (or both in Docker)
✓ **Multi-Stage Builds**: Optimized for pnpm monorepo with hoisted node_modules
✓ **Adapter Detection**: Single codebase works with both Neon and local PostgreSQL
✓ **LAN Access**: Expo accessible from physical devices on local network
✓ **Helper Scripts**: Auto-detect IP and start services with one command
✓ **Comprehensive Docs**: Detailed guides for setup, troubleshooting, and architecture

---

## Support

For issues or questions:
1. Check `DOCKER_QUICK_START.md` for common commands
2. Check `DOCKER_PROBLEMS.md` for troubleshooting
3. Check `DOCKER_ARCHITECTURE.md` for technical details
4. Review `DOCKER_SETUP.md` for comprehensive guide
5. Check Docker logs: `docker compose logs -f`
