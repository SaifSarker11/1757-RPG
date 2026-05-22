# Docker Quick Start

## TL;DR

### Start Backend in Docker

**Windows (PowerShell)**:
```powershell
.\scripts\docker-start.ps1
```

**macOS/Linux**:
```bash
./scripts/docker-start.sh
```

### Start Frontend on Host

```bash
pnpm dev
```

### Verify Everything Works

```bash
# Check API health
curl http://localhost:3001/health

# Open http://localhost:3000 in browser
# Scan Expo QR code with your phone
```

---

## Common Commands

| Task | Command |
|------|---------|
| Start backend only | `docker compose up -d postgres redis api` |
| Start everything | `.\scripts\docker-start.ps1 -All` |
| View logs | `docker compose logs -f api` |
| Stop all | `docker compose down` |
| Reset database | `docker compose down -v` |
| Access PostgreSQL | `docker compose exec postgres psql -U postgres -d spl_dev` |
| Access Redis | `docker compose exec redis redis-cli` |
| Rebuild images | `docker compose build` |

---

## Workflow Options

### Option 1: Backend in Docker, Frontend on Host (Recommended)

**Best for**: Rapid development, hot reload, debugging

```bash
# Terminal 1: Start backend
.\scripts\docker-start.ps1

# Terminal 2: Start frontend
pnpm dev
```

**Ports**:
- API: `http://localhost:3001`
- Web: `http://localhost:3000`
- Expo: `http://<YOUR_IP>:8081`

---

### Option 2: Everything in Docker

**Best for**: Full containerization, CI/CD testing

```bash
.\scripts\docker-start.ps1 -All
```

**Ports**:
- API: `http://localhost:3001`
- Web: `http://localhost:3000`
- Expo: `http://localhost:8081` (or your LAN IP)

---

### Option 3: Backend + Web in Docker, Expo on Host

```bash
.\scripts\docker-start.ps1 -IncludeWeb

# Terminal 2: Start Expo on host
pnpm --filter mobile dev
```

---

## Environment Variables

### For Host Machine

Create `.env` at project root:
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

### For Docker Containers

Use `.env.docker` (already configured):
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/spl_dev"
# ... other vars
```

---

## Troubleshooting

### API won't start

```bash
# Check logs
docker compose logs api

# Verify database is ready
docker compose logs postgres

# Reset everything
docker compose down -v
docker compose up -d postgres redis api
```

### Port already in use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Expo QR code not scanning

```bash
# Verify IP detection
docker compose exec mobile env | grep REACT_NATIVE_PACKAGER_HOSTNAME

# Manually set IP
HOST_IP=192.168.1.100 docker compose up -d mobile
```

### Database connection failed

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

---

## Next Steps

1. Read [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed documentation
2. Check [DOCKER_PROBLEMS.md](./DOCKER_PROBLEMS.md) for known issues
3. Review [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md) for technical details
