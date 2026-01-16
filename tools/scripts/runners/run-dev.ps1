# Start both frontend and backend for development
# Run from the project root

Write-Host "Starting LMS Development Environment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Start Python backend in background
Write-Host "`nStarting Python backend..." -ForegroundColor Yellow
$repoRoot = Split-Path -Parent $PSCommandPath
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:repoRoot
    Set-Location backend
    if (Test-Path ".\venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
    }
    uvicorn app.main:app --reload --port 8000
}

# Wait for backend to be ready
Start-Sleep -Seconds 3

# Set environment variable for frontend to use Python backend
$env:PYTHON_BACKEND_URL = "http://localhost:8000"

# Start Next.js frontend
Write-Host "`nStarting Next.js frontend..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop both services" -ForegroundColor Cyan

Set-Location $repoRoot
npm run dev

# Cleanup
Stop-Job $backendJob
Remove-Job $backendJob
