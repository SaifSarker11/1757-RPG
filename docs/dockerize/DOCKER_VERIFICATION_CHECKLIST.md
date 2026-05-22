# Docker Setup Verification Checklist

Use this checklist to verify that the Docker setup is working correctly.

## Pre-Flight Checks

### System Requirements
- [ ] Docker Desktop is installed
- [ ] Docker Desktop is running
- [ ] Docker version is 20.10 or higher: `docker --version`
- [ ] Docker Compose version is 2.0 or higher: `docker compose --version`
- [ ] Node.js 18+ is installed: `node --version`
- [ ] pnpm 9.0.0 is installed: `pnpm --version`

### Project Setup
- [ ] `.env` file exists at project root
- [ ] `.env` contains `DATABASE_URL` and `BETTER_AUTH_SECRET`
- [ ] `pnpm install` has been run: `pnpm install`
- [ ] Typecheck passes: `pnpm typecheck`

### File Verification
- [ ] `docker-compose.yml` exists at project root
- [ ] `apps/api/Dockerfile.dev` exists
- [ ] `apps/web/Dockerfile.dev` exists
- [ ] `apps/mobile/Dockerfile.dev` exists
- [ ] `scripts/docker-start.ps1` exists (Windows)
- [ ] `scripts/docker-start.sh` exists (macOS/Linux)
- [ ] `.env.docker` exists at project root
- [ ] `packages/db/src/index.ts` has adapter detection logic

---

## Docker Build Verification

### Build All Images
```bash
docker compose build
```

- [ ] Build completes without errors
- [ ] All three images are built:
  - [ ] `1757-api`
  - [ ] `1757-web`
  - [ ] `1757-mobile`

### Verify Image Sizes
```bash
docker images | grep 1757
```

- [ ] API image: ~600MB
- [ ] Web image: ~600MB
- [ ] Mobile image: ~700MB

---

## Backend Services Verification

### Start Backend Services
```bash
# Windows
.\scripts\docker-start.ps1

# macOS/Linux
./scripts/docker-start.sh
```

- [ ] Script runs without errors
- [ ] HOST_IP is detected and displayed
- [ ] Services start successfully

### Verify Services Are Running
```bash
docker compose ps
```

- [ ] PostgreSQL container is running and healthy
- [ ] Redis container is running and healthy
- [ ] API container is running and healthy

### Verify PostgreSQL
```bash
docker compose exec postgres psql -U postgres -d spl_dev -c "SELECT 1"
```

- [ ] Command returns `1`
- [ ] Database connection works

### Verify Redis
```bash
docker compose exec redis redis-cli ping
```

- [ ] Command returns `PONG`
- [ ] Redis connection works

### Verify API Health
```bash
curl http://localhost:3001/health
```

- [ ] Returns: `{"status":"ok","timestamp":"..."}`
- [ ] HTTP status code is 200

### Verify Database Schema
```bash
docker compose exec postgres psql -U postgres -d spl_dev -c "\dt"
```

- [ ] Shows database tables (schema was pushed)
- [ ] At least one table exists

### Check API Logs
```bash
docker compose logs api
```

- [ ] No error messages
- [ ] Shows "Listening on 0.0.0.0:3001"
- [ ] Shows "database tables were successfully pushed"

---

## Frontend Services Verification

### Start Frontend on Host
```bash
pnpm dev
```

- [ ] Next.js starts without errors
- [ ] Expo starts without errors
- [ ] Both show their respective URLs

### Verify Next.js Web
```bash
curl http://localhost:3000
```

- [ ] Returns HTML content
- [ ] HTTP status code is 200

### Open Web in Browser
```
http://localhost:3000
```

- [ ] Page loads without errors
- [ ] No connection errors in console
- [ ] API calls succeed (check Network tab)

### Verify Expo Metro
```bash
docker compose logs mobile | grep "QR code"
```

- [ ] QR code is displayed
- [ ] Metro bundler is running

### Test Expo on Phone
- [ ] Scan QR code with Expo Go
- [ ] App loads on phone
- [ ] No connection errors

---

## Network Verification

### Verify Bridge Network
```bash
docker network inspect app-network
```

- [ ] Network exists
- [ ] All containers are connected
- [ ] Network driver is "bridge"

### Test Container Communication
```bash
docker compose exec api nslookup postgres
```

- [ ] Returns IP address of PostgreSQL container
- [ ] DNS resolution works

### Test API to Database Connection
```bash
docker compose exec api curl http://postgres:5432
```

- [ ] Connection attempt is made (may fail, but no DNS error)

---

## Environment Variables Verification

### Verify Host Environment
```bash
cat .env | grep DATABASE_URL
```

- [ ] DATABASE_URL points to `localhost:5432`

### Verify Docker Environment
```bash
docker compose exec api env | grep DATABASE_URL
```

- [ ] DATABASE_URL points to `postgres:5432`

### Verify Prisma Adapter Detection
```bash
docker compose exec api node -e "console.log(require('packages/db/src/index.ts'))"
```

- [ ] No errors (adapter detection works)

---

## Hybrid Workflow Verification

### Test Backend in Docker, Frontend on Host

**Terminal 1**:
```bash
.\scripts\docker-start.ps1
```

- [ ] Backend services start

**Terminal 2**:
```bash
pnpm dev
```

- [ ] Frontend services start
- [ ] Both can communicate

**Browser**:
```
http://localhost:3000
```

- [ ] Page loads
- [ ] API calls succeed

**Phone**:
- [ ] Scan Expo QR code
- [ ] App loads
- [ ] Can communicate with API

---

## Optional: Everything in Docker

### Start All Services
```bash
.\scripts\docker-start.ps1 -All
```

- [ ] All services start successfully

### Verify All Services
```bash
docker compose ps
```

- [ ] All 5 containers are running and healthy

### Test Web in Docker
```bash
curl http://localhost:3000
```

- [ ] Returns HTML content

### Test Expo in Docker
```bash
docker compose logs mobile | grep "QR code"
```

- [ ] QR code is displayed

---

## Performance Verification

### Check Container Resource Usage
```bash
docker stats
```

- [ ] API memory usage: 100-200MB
- [ ] PostgreSQL memory usage: 50-100MB
- [ ] Redis memory usage: 10-20MB
- [ ] CPU usage is reasonable (not maxed out)

### Measure API Response Time
```bash
time curl http://localhost:3001/health
```

- [ ] Response time is <100ms

### Measure Database Query Time
```bash
docker compose exec postgres psql -U postgres -d spl_dev -c "EXPLAIN ANALYZE SELECT 1"
```

- [ ] Query time is <50ms

---

## Cleanup & Reset Verification

### Stop Services
```bash
docker compose down
```

- [ ] All containers stop
- [ ] No errors

### Verify Services Stopped
```bash
docker compose ps
```

- [ ] No containers are running

### Reset Database
```bash
docker compose down -v
```

- [ ] Volumes are removed
- [ ] No errors

### Restart Services
```bash
docker compose up -d postgres redis api
```

- [ ] Services start fresh
- [ ] Database is empty (schema needs to be pushed again)

---

## Troubleshooting Verification

### Test Port Conflicts
```bash
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001
```

- [ ] No other process is using port 3001

### Test Firewall
```bash
curl http://localhost:3001/health
```

- [ ] Connection succeeds (firewall not blocking)

### Test Docker Daemon
```bash
docker ps
```

- [ ] Command succeeds
- [ ] Docker daemon is running

---

## Documentation Verification

### Verify Documentation Files
- [ ] `docs/README.md` exists
- [ ] `docs/DOCKER_SETUP.md` exists
- [ ] `docs/DOCKER_QUICK_START.md` exists
- [ ] `docs/DOCKER_PROBLEMS.md` exists
- [ ] `docs/DOCKER_ARCHITECTURE.md` exists
- [ ] `docs/DOCKER_IMPLEMENTATION_SUMMARY.md` exists

### Verify Documentation Quality
- [ ] All files are readable
- [ ] All files contain relevant information
- [ ] All files have proper formatting
- [ ] All files have working links

---

## Final Verification

### Complete Workflow Test

1. **Start Backend**:
   ```bash
   .\scripts\docker-start.ps1
   ```
   - [ ] Backend starts successfully

2. **Start Frontend**:
   ```bash
   pnpm dev
   ```
   - [ ] Frontend starts successfully

3. **Test Web**:
   - [ ] Open http://localhost:3000
   - [ ] Page loads
   - [ ] API calls succeed

4. **Test Expo**:
   - [ ] Scan QR code
   - [ ] App loads on phone
   - [ ] Can communicate with API

5. **Stop Services**:
   ```bash
   docker compose down
   ```
   - [ ] Services stop cleanly

---

## Sign-Off

- [ ] All pre-flight checks passed
- [ ] All Docker build checks passed
- [ ] All backend services checks passed
- [ ] All frontend services checks passed
- [ ] All network checks passed
- [ ] All environment variable checks passed
- [ ] All hybrid workflow checks passed
- [ ] All performance checks passed
- [ ] All cleanup checks passed
- [ ] All troubleshooting checks passed
- [ ] All documentation checks passed
- [ ] Complete workflow test passed

**Status**: ✅ Docker setup is ready for development

---

## Next Steps

1. Read [docs/DOCKER_QUICK_START.md](./docs/DOCKER_QUICK_START.md)
2. Start backend: `.\scripts\docker-start.ps1`
3. Start frontend: `pnpm dev`
4. Open http://localhost:3000
5. Scan Expo QR code with your phone

---

## Support

If any checks fail:

1. Check [docs/DOCKER_PROBLEMS.md](./docs/DOCKER_PROBLEMS.md) for solutions
2. Check [docs/DOCKER_SETUP.md](./docs/DOCKER_SETUP.md) for detailed information
3. Review Docker logs: `docker compose logs -f`
4. Check Docker documentation: https://docs.docker.com/

---

## Verification Date

- **Date**: _______________
- **Verified By**: _______________
- **Notes**: _______________
