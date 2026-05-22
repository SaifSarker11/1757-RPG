@echo off
REM Docker startup script for Windows (CMD)
REM Automatically detects local IP and starts backend services

setlocal enabledelayedexpansion

echo.
echo 🐳 SPL Docker Startup Script (Windows)
echo.

REM Set default environment variables
set "DB_USER=postgres"
set "DB_PASSWORD=postgres"
set "DB_NAME=spl_dev"
set "BETTER_AUTH_SECRET=dev-secret-change-in-production"

REM Try to detect local IP
set "HOST_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4 Address"') do (
    set "HOST_IP=%%a"
    goto :found_ip
)

:found_ip
if defined HOST_IP (
    REM Remove leading space
    for /f "tokens=* delims= " %%a in ("!HOST_IP!") do set "HOST_IP=%%a"
    echo ✓ Detected local IP: !HOST_IP!
) else (
    echo ⚠ Could not auto-detect IP. Using 127.0.0.1
    set "HOST_IP=127.0.0.1"
)

echo.
echo Configuration:
echo   HOST_IP: !HOST_IP!
echo   Database: PostgreSQL (localhost:5432)
echo   Redis: localhost:6379
echo   API: http://localhost:3001
echo.

REM Determine which services to start
set "SERVICES=postgres redis api"

if "%1"=="-All" (
    set "SERVICES=!SERVICES! web mobile"
    echo ✓ Including web service
    echo ✓ Including mobile service
) else if "%1"=="-IncludeWeb" (
    set "SERVICES=!SERVICES! web"
    echo ✓ Including web service
) else if "%1"=="-IncludeMobile" (
    set "SERVICES=!SERVICES! mobile"
    echo ✓ Including mobile service
)

echo.
echo Starting services: !SERVICES!
echo.

REM Set environment variables and start Docker Compose
set "HOST_IP=!HOST_IP!"
docker compose up -d !SERVICES!

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✓ Services started successfully!
    echo.
    echo Next steps:
    echo   1. Wait 10-15 seconds for services to initialize
    echo   2. Check API health: curl http://localhost:3001/health
    echo   3. View logs: docker compose logs -f api
    echo.
    
    if not "%1"=="-All" if not "%1"=="-IncludeWeb" if not "%1"=="-IncludeMobile" (
        echo To run frontend on host:
        echo   pnpm dev
        echo.
        echo To include web/mobile in Docker:
        echo   .\scripts\docker-start.bat -IncludeWeb
        echo   .\scripts\docker-start.bat -IncludeMobile
        echo   .\scripts\docker-start.bat -All
    )
) else (
    echo ✗ Failed to start services
    exit /b 1
)

endlocal
