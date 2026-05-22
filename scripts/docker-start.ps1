# Docker startup script for Windows (PowerShell)
# Automatically detects local IP and starts backend services

param(
    [switch]$IncludeWeb,
    [switch]$IncludeMobile,
    [switch]$All,
    [string]$HostIP
)

Write-Host "🐳 SPL Docker Startup Script (Windows)" -ForegroundColor Cyan

# Detect local IP if not provided
if (-not $HostIP) {
    try {
        # Get the primary network adapter's IP (excluding loopback)
        $ipAddresses = @(Get-NetIPAddress -AddressFamily IPv4 | 
                         Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -eq "Dhcp" })
        
        if ($ipAddresses.Count -gt 0) {
            $HostIP = $ipAddresses[0].IPAddress
        }
        else {
            # Fallback: try to get any non-loopback IPv4
            $ipAddresses = @(Get-NetIPAddress -AddressFamily IPv4 | 
                             Where-Object { $_.IPAddress -notlike "127.*" })
            if ($ipAddresses.Count -gt 0) {
                $HostIP = $ipAddresses[0].IPAddress
            }
        }
        
        if ($HostIP) {
            Write-Host "✓ Detected local IP: $HostIP" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ Could not auto-detect IP. Using 127.0.0.1" -ForegroundColor Yellow
            $HostIP = "127.0.0.1"
        }
    }
    catch {
        Write-Host "⚠ Error detecting IP: $_. Using 127.0.0.1" -ForegroundColor Yellow
        $HostIP = "127.0.0.1"
    }
}

# Set environment variables
$env:HOST_IP = $HostIP
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres"
$env:DB_NAME = "spl_dev"
$env:BETTER_AUTH_SECRET = "dev-secret-change-in-production"

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  HOST_IP: $HostIP"
Write-Host "  Database: PostgreSQL (localhost:5432)"
Write-Host "  Redis: localhost:6379"
Write-Host "  API: http://localhost:3001"
Write-Host ""

# Determine which services to start
$services = "postgres redis api"

if ($All -or $IncludeWeb) {
    $services += " web"
    Write-Host "✓ Including web service" -ForegroundColor Green
}

if ($All -or $IncludeMobile) {
    $services += " mobile"
    Write-Host "✓ Including mobile service" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting services: $services" -ForegroundColor Cyan
Write-Host ""

# Start Docker Compose
docker compose up -d $services.Split()

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Wait 10-15 seconds for services to initialize"
    Write-Host "  2. Check API health: curl http://localhost:3001/health"
    Write-Host "  3. View logs: docker compose logs -f api"
    Write-Host ""
    
    if (-not ($All -or $IncludeWeb -or $IncludeMobile)) {
        Write-Host "To run frontend on host:" -ForegroundColor Cyan
        Write-Host "  pnpm dev" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To include web/mobile in Docker:" -ForegroundColor Cyan
        Write-Host "  .\scripts\docker-start.ps1 -IncludeWeb" -ForegroundColor Yellow
        Write-Host "  .\scripts\docker-start.ps1 -IncludeMobile" -ForegroundColor Yellow
        Write-Host "  .\scripts\docker-start.ps1 -All" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    exit 1
}
