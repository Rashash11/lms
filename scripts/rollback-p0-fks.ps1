# ============================================================================
# Rollback P0 Foreign Key Constraints
# ============================================================================
# Purpose: Remove P0 FK constraints added by apply-p0-fks.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "P0 FOREIGN KEY CONSTRAINTS - ROLLBACK" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ROLLBACK_SQL = "scripts\sql\p0_fk_rollback.sql"
$CONTAINER = "lms_postgres"
$DB_USER = "lms_user"
$DB_NAME = "lms_db"

# Check if SQL file exists
if (-not (Test-Path $ROLLBACK_SQL)) {
    Write-Host "ERROR: Rollback SQL file not found: $ROLLBACK_SQL" -ForegroundColor Red
    exit 1
}

# Check if Docker container is running
$containerRunning = docker ps --filter "name=$CONTAINER" --format "{{.Names}}"
if ($containerRunning -ne $CONTAINER) {
    Write-Host "ERROR: Docker container '$CONTAINER' is not running" -ForegroundColor Red
    Write-Host "Start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "This will remove all P0 FK constraints added by apply-p0-fks.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Constraints to be removed:" -ForegroundColor White
Write-Host "  - enrollments (2 FKs)" -ForegroundColor Gray
Write-Host "  - password_reset_tokens (1 FK)" -ForegroundColor Gray
Write-Host "  - assignment_submissions (3 FKs)" -ForegroundColor Gray
Write-Host "  - certificate_issues (3 FKs)" -ForegroundColor Gray
Write-Host "  - test_attempts (2 FKs)" -ForegroundColor Gray
Write-Host "  - tests (1 FK)" -ForegroundColor Gray
Write-Host "  - questions (1 FK)" -ForegroundColor Gray
Write-Host "  - auth_audit_log (1 FK)" -ForegroundColor Gray
Write-Host ""
Write-Host "Total: 14 FK constraints" -ForegroundColor White
Write-Host ""
Write-Host "Note: Indexes will be kept (they don't hurt performance)" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Continue with rollback? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Rollback cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executing rollback..." -ForegroundColor Cyan
Write-Host ""

# Run rollback SQL
try {
    $rollbackOutput = Get-Content $ROLLBACK_SQL | docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Rollback failed" -ForegroundColor Red
        Write-Host $rollbackOutput -ForegroundColor Red
        exit 1
    }
    
    # Display rollback output
    Write-Host $rollbackOutput
    Write-Host ""
    
}
catch {
    Write-Host "ERROR: Rollback execution failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Final verification - count FKs
Write-Host "Final verification..." -ForegroundColor Yellow
Write-Host ""

try {
    $fkCount = docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='FOREIGN KEY';"
    
    Write-Host "Total FK constraints remaining in database: $fkCount" -ForegroundColor Green
    Write-Host ""
    
}
catch {
    Write-Host "WARNING: Could not verify FK count" -ForegroundColor Yellow
}

Write-Host "============================================================================" -ForegroundColor Green
Write-Host "SUCCESS: P0 FK CONSTRAINTS ROLLED BACK" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database returned to pre-P0 FK state." -ForegroundColor White
Write-Host "pgAdmin ERD will show fewer relationships (back to original state)." -ForegroundColor White
Write-Host ""
