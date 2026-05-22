# Docker Architecture & Technical Details

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Host Machine (Windows)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Docker Desktop (Hyper-V / WSL2)                 │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │         Docker Network: app-network (bridge)           │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │  │   │
│  │  │  │ PostgreSQL   │  │    Redis     │  │  Fastify   │   │  │   │
│  │  │  │ Container    │  │  Container   │  │  Container │   │  │   │
│  │  │  │ (5432)       │  │  (6379)      │  │  (3001)    │   │  │   │
│  │  │  └──────────────┘  └──────────────┘  └────────────┘   │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌──────────────┐  ┌──────────────┐                   │  │   │
│  │  │  │  Next.js     │  │    Expo      │  (Optional)       │  │   │
│  │  │  │  Container   │  │  Container   │                   │  │   │
│  │  │  │  (3000)      │  │  (8081)      │                   │  │   │
│  │  │  └──────────────┘  └──────────────┘                   │  │   │
│  │  │                                                         │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Host Machine (pnpm dev / turbo dev)              │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐                         │   │
│  │  │  Next.js     │  │    Expo      │  (Optional)             │   │
│  │  │  Dev Server  │  │  Dev Server  │                         │   │
│  │  │  (3000)      │  │  (8081)      │                         │   │
│  │  └──────────────┘  └──────────────┘                         │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Container Specifications

### PostgreSQL Container

**Image**: `postgres:16-alpine`

**Configuration**:
- **Port**: 5432 (internal) → 5432 (host)
- **Volume**: `postgres_data` (persistent storage)
- **Environment**:
  - `POSTGRES_USER`: postgres
  - `POSTGRES_PASSWORD`: postgres
  - `POSTGRES_DB`: spl_dev
- **Healthcheck**: `pg_isready -U postgres`
- **Startup Time**: ~5-10 seconds

**Why Alpine?**
- Minimal image size (~150MB)
- Fast startup
- Sufficient for development

**Data Persistence**:
- Named volume `postgres_data` persists data across container restarts
- `docker compose down -v` removes volume and resets database

---

### Redis Container

**Image**: `redis:7-alpine`

**Configuration**:
- **Port**: 6379 (internal) → 6379 (host)
- **Volume**: `redis_data` (persistent storage)
- **Healthcheck**: `redis-cli ping`
- **Startup Time**: ~2-3 seconds

**Why Alpine?**
- Minimal image size (~30MB)
- Fast startup
- Sufficient for development caching

---

### Fastify API Container

**Image**: Built from `apps/api/Dockerfile.dev`

**Configuration**:
- **Port**: 3001 (internal) → 3001 (host)
- **Depends On**: PostgreSQL (healthy), Redis (healthy)
- **Healthcheck**: HTTP GET `/health` endpoint
- **Startup Time**: ~15-30 seconds (includes `db:push`)
- **Entrypoint**: `pnpm --filter @repo/db db:push && pnpm --filter api dev`

**Multi-Stage Build**:

```dockerfile
# Stage 1: Dependencies (cached)
- Copy workspace config (pnpm-workspace.yaml, pnpm-lock.yaml)
- Copy all package.json files
- Run pnpm install --frozen-lockfile
- Result: ~500MB layer (cached)

# Stage 2: Development (code changes only)
- Copy node_modules from Stage 1
- Copy source code
- Run pnpm db:generate
- Start dev server
- Result: ~600MB final image
```

**Why Multi-Stage?**
- Dependencies cached separately from code
- Rebuilding after code changes: ~5-10 seconds
- Rebuilding after package.json changes: ~30-60 seconds

---

### Next.js Web Container (Optional)

**Image**: Built from `apps/web/Dockerfile.dev`

**Configuration**:
- **Port**: 3000 (internal) → 3000 (host)
- **Depends On**: API (healthy)
- **Startup Time**: ~10-15 seconds
- **Entrypoint**: `pnpm --filter web dev`

**Multi-Stage Build**:
- Similar to API, optimized for Next.js
- Includes TypeScript compilation
- Hot reload enabled

---

### Expo Mobile Container (Optional)

**Image**: Built from `apps/mobile/Dockerfile.dev`

**Configuration**:
- **Port**: 8081 (Metro bundler) → 8081 (host)
- **Ports**: 19000, 19001 (debugging)
- **Depends On**: API (healthy)
- **Startup Time**: ~15-20 seconds
- **Entrypoint**: `pnpm --filter mobile dev`
- **Special**: `stdin_open: true`, `tty: true` for interactive terminal

**LAN Access**:
- `REACT_NATIVE_PACKAGER_HOSTNAME` set to host IP (e.g., 192.168.1.100)
- Metro bundler accessible from physical devices on local network
- QR code scannable with Expo Go

---

## Network Architecture

### Bridge Network: `app-network`

**Type**: Docker bridge network (isolated from host)

**Services Connected**:
- PostgreSQL
- Redis
- Fastify API
- Next.js Web (optional)
- Expo Mobile (optional)

**Communication**:
- Internal: Services use service names (e.g., `postgres:5432`)
- External: Services exposed via host ports (e.g., `localhost:5432`)

**DNS Resolution**:
- Docker's embedded DNS server resolves service names
- Example: `api` container can reach `postgres` at `postgres:5432`

---

## Volume Management

### Named Volumes

**`postgres_data`**:
- Stores PostgreSQL data files
- Persists across container restarts
- Removed with `docker compose down -v`
- Location: `/var/lib/docker/volumes/postgres_data/_data`

**`redis_data`**:
- Stores Redis snapshots
- Persists across container restarts
- Removed with `docker compose down -v`
- Location: `/var/lib/docker/volumes/redis_data/_data`

### Bind Mounts (Optional)

For faster development, mount source code:

```yaml
api:
  volumes:
    - ./apps/api:/app/apps/api
    - ./packages/db:/app/packages/db
```

**Trade-offs**:
- ✓ Changes reflect immediately without rebuild
- ✗ Slightly slower startup
- ✗ File permission issues on Windows

---

## Dependency Management

### pnpm Monorepo Structure

```
project/
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json (root)
├── apps/
│   ├── api/
│   │   └── package.json
│   ├── web/
│   │   └── package.json
│   └── mobile/
│       └── package.json
└── packages/
    ├── db/
    │   └── package.json
    ├── auth/
    │   └── package.json
    └── config/
        └── package.json
```

### Hoisted node_modules

pnpm hoists dependencies to root `node_modules`:

```
node_modules/
├── react/
├── next/
├── expo/
├── fastify/
├── .pnpm/
│   ├── react@19.2.4/
│   ├── next@16.2.6/
│   └── ...
└── .bin/
```

### Docker Build Process

1. **Copy workspace config**:
   ```dockerfile
   COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
   ```

2. **Copy all package.json files**:
   ```dockerfile
   COPY apps/api/package.json ./apps/api/
   COPY packages/db/package.json ./packages/db/
   # ... etc
   ```

3. **Install dependencies**:
   ```dockerfile
   RUN pnpm install --frozen-lockfile
   ```
   - pnpm respects hoisting rules
   - Creates correct `node_modules` structure

4. **Copy source code**:
   ```dockerfile
   COPY apps/api ./apps/api
   COPY packages/db ./packages/db
   ```

5. **Generate Prisma client**:
   ```dockerfile
   RUN pnpm --filter @repo/db db:generate
   ```

---

## Database Adapter Strategy

### Prisma Client Initialization

**File**: `packages/db/src/index.ts`

**Logic**:

```typescript
function isNeonDatabase(connectionString: string): boolean {
  return connectionString.includes("neon.tech");
}

if (isNeonDatabase(connectionString)) {
  // Use Neon adapter (WebSocket)
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
} else {
  // Use standard TCP adapter
  return new PrismaClient();
}
```

### Connection Methods

**Neon (Production)**:
- Protocol: WebSocket (serverless)
- Connection String: `postgresql://user:pass@ep-xxx-pooler.neon.tech/db`
- Adapter: `@prisma/adapter-neon`
- Benefits: Serverless, auto-scaling, no connection pooling needed

**Local PostgreSQL (Development)**:
- Protocol: TCP
- Connection String: `postgresql://postgres:postgres@postgres:5432/spl_dev`
- Adapter: Native PrismaClient
- Benefits: Full control, debugging, offline development

### Why This Approach?

1. **Single Codebase**: No environment-specific code paths
2. **Automatic Fallback**: Detects database type at runtime
3. **No Configuration**: Works with both Neon and local PostgreSQL
4. **Type-Safe**: Full TypeScript support

---

## Environment Variables

### Host Machine (.env)

Used when running frontend on host:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spl_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/spl_dev"
BETTER_AUTH_SECRET="dev-secret-change-in-production"
BETTER_AUTH_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

### Docker Containers (.env.docker)

Used when running services inside Docker:

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/spl_dev"
DIRECT_URL="postgresql://postgres:postgres@postgres:5432/spl_dev"
BETTER_AUTH_SECRET="dev-secret-change-in-production"
BETTER_AUTH_URL="http://api:3001"
WEB_URL="http://web:3000"
API_URL="http://api:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

### Key Differences

| Variable | Host | Docker |
|----------|------|--------|
| DATABASE_URL | `localhost:5432` | `postgres:5432` |
| BETTER_AUTH_URL | `localhost:3001` | `api:3001` |
| WEB_URL | `localhost:3000` | `web:3000` |

---

## Health Checks

### PostgreSQL Healthcheck

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**What it does**:
- Runs `pg_isready` every 10 seconds
- Waits up to 5 seconds for response
- Retries up to 5 times before marking unhealthy
- Waits 10 seconds before first check

**Status**:
- `healthy`: Database is ready
- `unhealthy`: Database is not responding
- `starting`: Initial startup period

### Redis Healthcheck

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**What it does**:
- Runs `redis-cli ping` every 10 seconds
- Expects response: `PONG`

### Fastify API Healthcheck

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

**What it does**:
- Makes HTTP GET request to `/health` endpoint
- Expects HTTP 200 response
- Longer startup period (30s) for database initialization

---

## Startup Sequence

### Order of Operations

1. **PostgreSQL starts** (no dependencies)
   - Initializes database
   - Runs healthcheck
   - Status: `healthy` after ~10 seconds

2. **Redis starts** (no dependencies)
   - Initializes cache
   - Runs healthcheck
   - Status: `healthy` after ~3 seconds

3. **Fastify API starts** (depends on PostgreSQL and Redis)
   - Waits for PostgreSQL healthcheck: `healthy`
   - Waits for Redis healthcheck: `healthy`
   - Runs `pnpm db:push` (schema synchronization)
   - Starts dev server
   - Runs healthcheck
   - Status: `healthy` after ~30 seconds

4. **Next.js Web starts** (optional, depends on API)
   - Waits for API healthcheck: `healthy`
   - Starts dev server
   - Status: `healthy` after ~15 seconds

5. **Expo Mobile starts** (optional, depends on API)
   - Waits for API healthcheck: `healthy`
   - Starts Metro bundler
   - Displays QR code
   - Status: `healthy` after ~20 seconds

**Total Startup Time**: ~30-45 seconds (backend only)

---

## Performance Characteristics

### Build Times

| Scenario | Time |
|----------|------|
| First build (all layers) | 2-3 minutes |
| Rebuild after code change | 5-10 seconds |
| Rebuild after package.json change | 30-60 seconds |
| Rebuild with `--no-cache` | 2-3 minutes |

### Runtime Performance

| Metric | Value |
|--------|-------|
| API startup | 15-30 seconds |
| API response time | <100ms |
| Database query time | <50ms |
| Memory usage (API) | 100-200MB |
| Memory usage (PostgreSQL) | 50-100MB |
| Memory usage (Redis) | 10-20MB |

### Optimization Tips

1. **Use BuildKit**: `export DOCKER_BUILDKIT=1`
2. **Increase Docker resources**: Allocate more CPU/memory
3. **Use volume mounts**: For faster hot reload
4. **Parallel builds**: Build multiple images simultaneously
5. **Layer caching**: Arrange Dockerfile layers strategically

---

## Security Considerations

### Development vs Production

**Development** (current setup):
- Default credentials: `postgres:postgres`
- No SSL/TLS encryption
- All ports exposed
- Suitable for local development only

**Production** (not implemented):
- Strong credentials
- SSL/TLS encryption
- Restricted port access
- Network policies
- Secret management

### Best Practices

1. **Never use development credentials in production**
2. **Use environment variables for secrets**
3. **Restrict network access**
4. **Enable SSL/TLS**
5. **Use Docker secrets for sensitive data**
6. **Scan images for vulnerabilities**: `docker scan`

---

## Monitoring & Debugging

### View Container Logs

```bash
# Follow API logs
docker compose logs -f api

# View last 100 lines
docker compose logs --tail=100 api

# View logs with timestamps
docker compose logs --timestamps api
```

### Inspect Container

```bash
# View container details
docker inspect spl-api

# View container processes
docker top spl-api

# View container resource usage
docker stats spl-api
```

### Execute Commands in Container

```bash
# Interactive shell
docker compose exec api sh

# Run single command
docker compose exec api pnpm --version

# Run as different user
docker compose exec -u root api apk add curl
```

### Network Debugging

```bash
# View network details
docker network inspect app-network

# Test DNS resolution
docker compose exec api nslookup postgres

# Test connectivity
docker compose exec api curl http://postgres:5432
```

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Specification](https://github.com/compose-spec/compose-spec)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Prisma Adapters](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/overview)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Node.js Docker Image](https://hub.docker.com/_/node)
