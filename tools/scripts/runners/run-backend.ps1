# Start the Python FastAPI backend
# Run from the backend directory

# Activate virtual environment if exists
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
}

# Start uvicorn with hot reload
Write-Host "Starting FastAPI backend on http://localhost:8000" -ForegroundColor Green
uvicorn app.main:app --reload --port 8000
