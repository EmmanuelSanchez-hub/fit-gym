# Start Fingerprint Service
Write-Host "Starting HuellApp Fingerprint Service (DigitalPersona 4500)..." -ForegroundColor Cyan

# Check if .NET SDK is available
if (-not (Get-Command "dotnet" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: .NET SDK not found. Install from https://dotnet.microsoft.com/download" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "Building fingerprint service..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
dotnet build --nologo -v q 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Trying with dotnet restore first..." -ForegroundColor Red
    dotnet restore --nologo
    dotnet build --nologo
}

Write-Host "Starting fingerprint service on http://localhost:3005" -ForegroundColor Green
Write-Host "Swagger UI: http://localhost:3005/swagger" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

dotnet run --nologo --launch-profile "FingerprintService"

Pop-Location