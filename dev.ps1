<#
.SYNOPSIS
  ShopAI Developer Helper CLI Script
.EXAMPLE
  .\dev.ps1 run       # Runs backend and frontend concurrently
  .\dev.ps1 test      # Runs backend automated xUnit tests
  .\dev.ps1 build     # Compiles both backend and frontend for production
  .\dev.ps1 migrate   # Applies latest EF Core migrations to PostgreSQL
  .\dev.ps1 docker    # Launches docker-compose multi-container stack
#>

param(
  [Parameter(Position=0)]
  [string]$Command = "help"
)

switch ($Command.ToLower()) {
  "run" {
    Write-Host "[ShopAI] Starting Backend API & Frontend Development Servers..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/ShopAI.Api; dotnet run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
  }
  "test" {
    Write-Host "[ShopAI] Executing Automated Unit & Integration Tests..." -ForegroundColor Cyan
    dotnet test backend/ShopAI.Tests/ShopAI.Tests.csproj --verbosity normal
  }
  "build" {
    Write-Host "[ShopAI] Building Backend Solution (Release)..." -ForegroundColor Cyan
    dotnet build backend/ShopAI.slnx -c Release
    Write-Host "[ShopAI] Building Frontend Single Page Application (Production)..." -ForegroundColor Cyan
    npm --prefix frontend run build
  }
  "migrate" {
    Write-Host "[ShopAI] Applying EF Core Database Migrations..." -ForegroundColor Cyan
    dotnet ef database update --project backend/ShopAI.Infrastructure --startup-project backend/ShopAI.Api
  }
  "docker" {
    Write-Host "[ShopAI] Launching Docker Compose Stack..." -ForegroundColor Cyan
    docker-compose up --build
  }
  default {
    Write-Host "ShopAI Developer CLI" -ForegroundColor Yellow
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  .\dev.ps1 run       - Start Backend API & Frontend dev servers"
    Write-Host "  .\dev.ps1 test      - Run all xUnit tests with FluentAssertions"
    Write-Host "  .\dev.ps1 build     - Compile both projects for production"
    Write-Host "  .\dev.ps1 migrate   - Apply database migrations to PostgreSQL"
    Write-Host "  .\dev.ps1 docker    - Launch multi-container Docker Compose"
  }
}
