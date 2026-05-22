# Docker Startup Guide - Choose Your Method

You have multiple options to start the Docker services. Choose the one that works best for your environment.

---

## 🚀 Option 1: Windows CMD (Recommended for Windows)

**Best for**: Windows users who want the simplest approach

```cmd
.\scripts\docker-start.bat
```

**With flags**:
```cmd
.\scripts\docker-start.bat -IncludeWeb
.\scripts\docker-start.bat -IncludeMobile
.\scripts\docker-start.bat -All
```

**Advantages**:
- ✅ Works directly in Windows CMD
- ✅ Works in Git Bash
- ✅ Auto-detects local IP
- ✅ Simple and reliable

---

## 🚀 Option 2: Git Bash / Shell Script (Works Everywhere)

**Best for**: Git Bash, macOS, Linux, or Windows with WSL

```bash
./scripts/docker-start-simple.sh
```

**With flags**:
```bash
./scripts/docker-start-simple.sh -IncludeWeb
./scripts/docker-start-simple.sh -IncludeMobile
./scripts/docker-start-simple.sh -All
```

**Advantages**:
- ✅ Works in Git Bash (your current environment)
- ✅ Works on macOS and Linux
- ✅ Auto-detects local IP
- ✅ Cross-platform compatible

---

## 🚀 Option 3: PowerShell (Advanced)

**Best for**: PowerShell users who want advanced features

```powershell
.\scripts\docker-start.ps1
```

**With flags**:
```powershell
.\scripts\docker-start.ps1 -IncludeWeb
.\scripts\docker-start.ps1 -IncludeMobile
.\scripts\docker-start.ps1 -All
```

**Advantages**:
- ✅ Full PowerShell features
- ✅ Advanced error handling
- ✅ Auto-detects local IP

**Note**: Run from PowerShell directly, not from Git Bash

---

## 🚀 Option 4: Manual Docker Commands

**Best for**: Advanced users who want full control

```bash
# Set environment variables
export HOST_IP=192.168.1.100  # Replace with your IP
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=spl_dev
export BETTER_AUTH_SECRET=dev-secret-change-in-production

# Start backend only
docker compose up -d postgres redis api

# Start everything
docker compose up -d

# Start specific services
docker compose up -d postgres redis api web mobile
```

---

## ✅ Quick Start (Recommended)

### For Git Bash (Your Current Environment)

```bash
# Make script executable (first time only)
chmod +x ./scripts/docker-start-simple.sh

# Run the script
./scripts/docker-start-simple.sh
```

### For Windows CMD

```cmd
.\scripts\docker-start.bat
```

### For PowerShell

```powershell
.\scripts\docker-start.ps1
```

---

## 📋 What Each Script Does

### `docker-start.bat` (Windows CMD)
- Detects local IP using `ipconfig`
- Sets environment variables
- Starts Docker Compose services
- Supports flags: `-IncludeWeb`, `-IncludeMobile`, `-All`

### `docker-start-simple.sh` (Bash/Git Bash)
- Detects OS (Windows/macOS/Linux)
- Detects local IP appropriately for each OS
- Sets environment variables
- Starts Docker Compose services
- Supports flags: `-IncludeWeb`, `-IncludeMobile`, `-All`

### `docker-start.ps1` (PowerShell)
- Detects local IP using `Get-NetIPAddress`
- Sets environment variables
- Starts Docker Compose services
- Supports flags: `-IncludeWeb`, `-IncludeMobile`, `-All`

---

## 🎯 Workflow Options

### Backend Only (Recommended for Development)

```bash
# Start backend
./scripts/docker-start-simple.sh

# In another terminal, start frontend
pnpm dev
```

### Backend + Web in Docker

```bash
./scripts/docker-start-simple.sh -IncludeWeb
```

### Backend + Mobile in Docker

```bash
./scripts/docker-start-simple.sh -IncludeMobile
```

### Everything in Docker

```bash
./scripts/docker-start-simple.sh -All
```

---

## ✅ Verification

After starting services, verify everything works:

```bash
# Check API health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}

# View running services
docker compose ps

# View logs
docker compose logs -f api
```

---

## 🔧 Common Commands

```bash
# View running services
docker compose ps

# View logs
docker compose logs -f api
docker compose logs postgres
docker compose logs redis

# Stop all services
docker compose down

# Reset database (remove volumes)
docker compose down -v

# Rebuild images
docker compose build

# Access PostgreSQL
docker compose exec postgres psql -U postgres -d spl_dev

# Access Redis
docker compose exec redis redis-cli
```

---

## 🆘 Troubleshooting

### Script Won't Run

**Git Bash**:
```bash
# Make script executable
chmod +x ./scripts/docker-start-simple.sh

# Run it
./scripts/docker-start-simple.sh
```

**Windows CMD**:
```cmd
# Just run it
.\scripts\docker-start.bat
```

**PowerShell**:
```powershell
# Run from PowerShell directly (not Git Bash)
.\scripts\docker-start.ps1
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Docker Not Running

- Ensure Docker Desktop is installed and running
- Check Docker status: `docker ps`

### IP Detection Failed

The scripts will use `127.0.0.1` as fallback. For LAN access to Expo, manually set:

```bash
# Git Bash / Linux / macOS
export HOST_IP=192.168.1.100
docker compose up -d mobile

# Windows CMD
set HOST_IP=192.168.1.100
docker compose up -d mobile

# PowerShell
$env:HOST_IP = "192.168.1.100"
docker compose up -d mobile
```

---

## 📚 Next Steps

1. **Choose your script** based on your environment
2. **Run the script**: `./scripts/docker-start-simple.sh` (or your chosen script)
3. **Verify services**: `docker compose ps`
4. **Start frontend**: `pnpm dev`
5. **Open browser**: `http://localhost:3000`
6. **Test Expo**: Scan QR code with your phone

---

## 📖 For More Information

- **Quick Start**: See `START_HERE.md`
- **Complete Guide**: See `docs/DOCKER_SETUP.md`
- **Troubleshooting**: See `docs/DOCKER_PROBLEMS.md`
- **Technical Details**: See `docs/DOCKER_ARCHITECTURE.md`

---

## ✨ Summary

You now have **3 ways** to start Docker services:

| Method | Command | Best For |
|--------|---------|----------|
| **Git Bash** | `./scripts/docker-start-simple.sh` | Git Bash, macOS, Linux |
| **Windows CMD** | `.\scripts\docker-start.bat` | Windows CMD |
| **PowerShell** | `.\scripts\docker-start.ps1` | PowerShell |

**Recommended for your environment (Git Bash)**:
```bash
./scripts/docker-start-simple.sh
```

---

**Happy developing! 🚀**
