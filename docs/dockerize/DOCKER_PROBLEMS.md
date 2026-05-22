# Docker Problems & Solutions

## Database Issues

### Problem: "Connection refused" when API starts

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Root Cause**: PostgreSQL container hasn't finished initializing, or the API is trying to connect before the healthcheck passes.

**Solutions**:

1. **Wait longer for initialization**:
   ```bash
   docker compose up -d postgres
   sleep 20  # Wait 20 seconds
   docker compose up -d api
   ```

2. **Check PostgreSQL logs**:
   ```bash
   docker compose logs postgres
   ```

3. **Verify healthcheck**:
   ```bash
   docker compose ps postgres
   # Status should show "healthy"
   ```

4. **Reset and restart**:
   ```bash
   docker compose down -v
   docker compose up -d postgres redis api
   ```

---

### Problem: "Database does not exist" error

**Symptoms**:
```
FATAL: database "spl_dev" does not exist
```

**Root Cause**: PostgreSQL container started but the database wasn't created.

**Solutions**:

1. **Manually create database**:
   ```bash
   docker compose exec postgres psql -U postgres -c "CREATE DATABASE spl_dev;"
   ```

2. **Reset and let Docker Compose recreate**:
   ```bash
   docker compose down -v
   docker compose up -d postgres
   sleep 10
   docker compose up -d api
   ```

3. **Check environment variables**:
   ```bash
   docker compose config | grep -A 5 "postgres:"
   # Verify POSTGRES_DB is set to "spl_dev"
   ```

---

### Problem: "Prisma schema not found" or "db:generate failed"

**Symptoms**:
```
Error: Could not find Prisma schema file
```

**Root Cause**: Prisma schema file not copied into Docker image, or `pnpm db:generate` ran before schema was available.

**Solutions**:

1. **Verify schema file exists**:
   ```bash
   ls packages/db/prisma/schema.prisma
   ```

2. **Rebuild Docker image**:
   ```bash
   docker compose build --no-cache api
   docker compose up -d api
   ```

3. **Check Dockerfile**:
   - Ensure `COPY packages/db ./packages/db` is present
   - Ensure `RUN pnpm --filter @repo/db db:generate` runs after copying

---

### Problem: "Neon adapter error" when using local PostgreSQL

**Symptoms**:
```
Error: Cannot use Neon adapter with non-Neon database
```

**Root Cause**: The Prisma client is trying to use the Neon WebSocket adapter with a local PostgreSQL connection.

**Solutions**:

1. **Verify DATABASE_URL doesn't contain "neon.tech"**:
   ```bash
   docker compose exec api env | grep DATABASE_URL
   # Should show: postgresql://postgres:postgres@postgres:5432/spl_dev
   ```

2. **Check Prisma client code**:
   - Ensure `packages/db/src/index.ts` has the conditional adapter logic
   - Verify `isNeonDatabase()` function checks for "neon.tech"

3. **Rebuild and restart**:
   ```bash
   docker compose build --no-cache api
   docker compose down -v
   docker compose up -d postgres redis api
   ```

---

## Network Issues

### Problem: "Cannot reach API from frontend"

**Symptoms**:
```
Error: Failed to fetch http://localhost:3001/health
```

**Root Cause**: Frontend and API are on different networks, or API port is not exposed.

**Solutions**:

1. **Verify API is running**:
   ```bash
   docker compose ps api
   # Status should be "Up"
   ```

2. **Check port mapping**:
   ```bash
   docker compose port api 3001
   # Should show: 0.0.0.0:3001
   ```

3. **Test API directly**:
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

4. **Check firewall**:
   - Windows: Allow Docker Desktop through Windows Firewall
   - macOS: Check System Preferences > Security & Privacy
   - Linux: Check `ufw` or `iptables` rules

5. **Verify docker-compose.yml**:
   - Ensure `ports: - "3001:3001"` is present under `api` service
   - Ensure `networks: - app-network` is present

---

### Problem: "Containers can't communicate with each other"

**Symptoms**:
```
Error: getaddrinfo ENOTFOUND postgres
```

**Root Cause**: Containers are not on the same Docker network.

**Solutions**:

1. **Verify network exists**:
   ```bash
   docker network ls | grep app-network
   ```

2. **Check container network**:
   ```bash
   docker inspect spl-api | grep -A 5 "Networks"
   # Should show "app-network"
   ```

3. **Recreate network**:
   ```bash
   docker compose down
   docker network rm app-network
   docker compose up -d
   ```

4. **Verify docker-compose.yml**:
   - Ensure `networks: - app-network` is under each service
   - Ensure `networks: app-network: driver: bridge` is at the bottom

---

## Expo & Mobile Issues

### Problem: "Metro bundler QR code not scanning"

**Symptoms**:
- QR code appears in terminal but phone can't connect
- "Cannot reach dev server" error in Expo Go

**Root Cause**: `REACT_NATIVE_PACKAGER_HOSTNAME` is set to `127.0.0.1` or `localhost`, which is not accessible from your phone.

**Solutions**:

1. **Verify HOST_IP is set**:
   ```bash
   docker compose exec mobile env | grep REACT_NATIVE_PACKAGER_HOSTNAME
   # Should show your actual IP (e.g., 192.168.1.100), not 127.0.0.1
   ```

2. **Manually set HOST_IP**:
   ```bash
   # Windows
   $env:HOST_IP = "192.168.1.100"
   docker compose up -d mobile

   # macOS/Linux
   export HOST_IP=192.168.1.100
   docker compose up -d mobile
   ```

3. **Find your local IP**:
   ```bash
   # Windows (PowerShell)
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" }

   # macOS
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Linux
   hostname -I
   ```

4. **Test connectivity**:
   ```bash
   # From your phone, try to reach the IP
   ping 192.168.1.100
   curl http://192.168.1.100:8081
   ```

5. **Check firewall**:
   - Ensure port 8081 is not blocked
   - Disable firewall temporarily to test

---

### Problem: "Expo container exits immediately"

**Symptoms**:
```
docker compose logs mobile
# Shows: "exited with code 1"
```

**Root Cause**: Missing `stdin_open: true` and `tty: true`, or missing dependencies.

**Solutions**:

1. **Verify docker-compose.yml**:
   ```yaml
   mobile:
     stdin_open: true
     tty: true
   ```

2. **Check logs for errors**:
   ```bash
   docker compose logs mobile
   ```

3. **Rebuild image**:
   ```bash
   docker compose build --no-cache mobile
   docker compose up -d mobile
   ```

4. **Check Dockerfile**:
   - Ensure all dependencies are installed
   - Ensure `pnpm install` completes successfully

---

### Problem: "Metro bundler port 8081 already in use"

**Symptoms**:
```
Error: listen EADDRINUSE :::8081
```

**Root Cause**: Another process is using port 8081.

**Solutions**:

1. **Find process using port**:
   ```bash
   # Windows
   netstat -ano | findstr :8081

   # macOS/Linux
   lsof -i :8081
   ```

2. **Kill process**:
   ```bash
   # Windows
   taskkill /PID <PID> /F

   # macOS/Linux
   kill -9 <PID>
   ```

3. **Use different port**:
   ```yaml
   mobile:
     ports:
       - "8082:8081"  # Map to different host port
   ```

---

## Build Issues

### Problem: "Docker build fails with 'pnpm: not found'"

**Symptoms**:
```
/bin/sh: pnpm: not found
```

**Root Cause**: pnpm not installed in Docker image, or PATH not set correctly.

**Solutions**:

1. **Verify Dockerfile**:
   ```dockerfile
   RUN npm install -g pnpm@9.0.0
   ```

2. **Rebuild image**:
   ```bash
   docker compose build --no-cache api
   ```

3. **Check Node version**:
   ```bash
   docker run node:20-alpine node --version
   # Should be v20.x.x
   ```

---

### Problem: "Docker build fails with 'COPY failed: file not found'"

**Symptoms**:
```
COPY failed: stat /var/lib/docker/tmp/docker-builder.../packages/db/package.json: no such file or directory
```

**Root Cause**: File path in Dockerfile is incorrect, or file doesn't exist on host.

**Solutions**:

1. **Verify file exists**:
   ```bash
   ls packages/db/package.json
   ls apps/api/package.json
   ```

2. **Check Dockerfile paths**:
   - Paths should be relative to project root
   - Use forward slashes even on Windows

3. **Rebuild from project root**:
   ```bash
   cd /path/to/project
   docker compose build --no-cache
   ```

---

### Problem: "Docker build fails with 'node_modules permission denied'"

**Symptoms**:
```
Error: EACCES: permission denied, open '/app/node_modules/...'
```

**Root Cause**: File permissions issue in Docker image.

**Solutions**:

1. **Add user to Dockerfile**:
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nodejs -u 1001
   USER nodejs
   ```

2. **Rebuild image**:
   ```bash
   docker compose build --no-cache
   ```

3. **Reset Docker**:
   ```bash
   docker system prune -a
   docker compose build
   ```

---

## Performance Issues

### Problem: "Docker containers are very slow"

**Symptoms**:
- API takes 10+ seconds to start
- Hot reload is slow
- Build takes a long time

**Root Cause**: Docker Desktop resource limits, or large `node_modules` being copied.

**Solutions**:

1. **Increase Docker Desktop resources**:
   - Windows: Docker Desktop > Settings > Resources
   - macOS: Docker Desktop > Preferences > Resources
   - Allocate more CPU and memory

2. **Use volume mounts** (optional):
   ```yaml
   api:
     volumes:
       - ./apps/api:/app/apps/api
       - ./packages/db:/app/packages/db
   ```

3. **Enable BuildKit**:
   ```bash
   export DOCKER_BUILDKIT=1
   docker compose build
   ```

4. **Clean up Docker**:
   ```bash
   docker system prune -a
   docker volume prune
   ```

---

### Problem: "Disk space running out"

**Symptoms**:
```
Error: no space left on device
```

**Root Cause**: Docker images, containers, and volumes consuming disk space.

**Solutions**:

1. **Clean up Docker**:
   ```bash
   docker system prune -a
   docker volume prune
   ```

2. **Remove unused images**:
   ```bash
   docker image prune -a
   ```

3. **Check disk usage**:
   ```bash
   docker system df
   ```

4. **Move Docker data directory** (advanced):
   - Windows: Docker Desktop > Settings > Resources > Disk image location
   - macOS: Docker Desktop > Preferences > Resources > Disk image location

---

## Environment & Configuration Issues

### Problem: "Environment variables not being read"

**Symptoms**:
```
Error: DATABASE_URL is not set
```

**Root Cause**: `.env` file not found, or environment variables not passed to Docker.

**Solutions**:

1. **Verify .env file exists**:
   ```bash
   ls .env
   ```

2. **Check docker-compose.yml**:
   ```yaml
   api:
     environment:
       DATABASE_URL: ${DATABASE_URL}
   ```

3. **Load .env manually**:
   ```bash
   # Windows (PowerShell)
   Get-Content .env | ForEach-Object { $_ -split '=' | % { [Environment]::SetEnvironmentVariable($_.Split('=')[0], $_.Split('=')[1]) } }

   # macOS/Linux
   export $(cat .env | xargs)
   ```

4. **Use .env.docker**:
   ```bash
   cp .env.docker .env
   docker compose up -d
   ```

---

### Problem: "Wrong database URL in Docker"

**Symptoms**:
```
Error: connect ECONNREFUSED localhost:5432
```

**Root Cause**: Using `localhost` inside Docker instead of service name `postgres`.

**Solutions**:

1. **Use service name inside Docker**:
   ```env
   # Inside Docker container
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/spl_dev"
   ```

2. **Use localhost on host**:
   ```env
   # On host machine
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spl_dev"
   ```

3. **Verify docker-compose.yml**:
   ```yaml
   api:
     environment:
       DATABASE_URL: postgresql://postgres:postgres@postgres:5432/spl_dev
   ```

---

## Getting Help

### Collect Debug Information

```bash
# Docker version
docker --version
docker compose --version

# System info
docker system info

# Container status
docker compose ps

# Service logs
docker compose logs --tail=100

# Network info
docker network inspect app-network

# Environment variables
docker compose exec api env
```

### Common Debug Commands

```bash
# Test API health
curl -v http://localhost:3001/health

# Test database connection
docker compose exec postgres psql -U postgres -d spl_dev -c "SELECT 1"

# Test Redis connection
docker compose exec redis redis-cli ping

# Check container resource usage
docker stats

# Inspect container
docker inspect spl-api
```

---

## Still Stuck?

1. Check [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed documentation
2. Review [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) for common workflows
3. Check Docker logs: `docker compose logs -f`
4. Search Docker documentation: https://docs.docker.com/
5. Check Prisma documentation: https://www.prisma.io/docs/
