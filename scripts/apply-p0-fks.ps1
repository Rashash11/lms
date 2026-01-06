# ============================================================================
# Apply P0 Foreign Key Constraints
# ============================================================================
# Purpose: Safely add database-level FK constraints for P0 critical tables
# 
# This script:
# 1. Runs precheck to detect orphaned records
# 2. ABORTS if any orphans found (count > 0)
# 3. If safe, applies FK constraints
# 4. Shows FK count verification
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "P0 FOREIGN KEY CONSTRAINTS - APPLY" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PRECHECK_SQL = "scripts\sql\p0_fk_precheck.sql"
$APPLY_SQL = "scripts\sql\p0_fk_apply.sql"
$CONTAINER = "lms_postgres"
$DB_USER = "lms_user"
$DB_NAME = "lms_db"

# Check if SQL files exist
if (-not (Test-Path $PRECHECK_SQL)) {
    Write-Host "ERROR: Precheck SQL file not found: $PRECHECK_SQL" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $APPLY_SQL)) {
    Write-Host "ERROR: Apply SQL file not found: $APPLY_SQL" -ForegroundColor Red
    exit 1
}

# Check if Docker container is running
$containerRunning = docker ps --filter "name=$CONTAINER" --format "{{.Names}}"
if ($containerRunning -ne $CONTAINER) {
    Write-Host "ERROR: Docker container '$CONTAINER' is not running" -ForegroundColor Red
    Write-Host "Start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Running orphan precheck..." -ForegroundColor Yellow
Write-Host ""

# Run precheck SQL
try {
    $precheckOutput = Get-Content $PRECHECK_SQL | docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Precheck failed to execute" -ForegroundColor Red
        Write-Host $precheckOutput -ForegroundColor Red
        exit 1
    }
    
    # Display full precheck output
    Write-Host $precheckOutput
    Write-Host ""
    
    # Parse output for orphan counts
    $orphanFound = $false
    $orphanLines = @()
    
    foreach ($line in $precheckOutput -split "`n") {
        # Look for lines with orphan counts (numeric values)
        if ($line -match '^\s*(\d+)\s*$') {
            $count = [int]$matches[1]
            if ($count -gt 0) {
                $orphanFound = $true
                $orphanLines += $line
            }
        }
    }
    
    if ($orphanFound) {
        Write-Host "============================================================================" -ForegroundColor Red
        Write-Host "ABORT: ORPHANED RECORDS DETECTED" -ForegroundColor Red
        Write-Host "============================================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "One or more orphan counts > 0 detected in the precheck output above." -ForegroundColor Red
        Write-Host ""
        Write-Host "You MUST fix orphaned data before adding FK constraints." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "  1. Review the precheck output above to identify which tables have orphans" -ForegroundColor White
        Write-Host "  2. Delete orphaned records or fix the references" -ForegroundColor White
        Write-Host "  3. Re-run this script after fixing the data" -ForegroundColor White
        Write-Host ""
        Write-Host "Example remediation (adjust table/column as needed):" -ForegroundColor Cyan
        Write-Host "  DELETE FROM assignment_submissions WHERE userId NOT IN (SELECT id FROM users);" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
    
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "PRECHECK PASSED: No orphaned records detected" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    
}
catch {
    Write-Host "ERROR: Precheck execution failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Confirm before proceeding
Write-Host "Step 2: Applying FK constraints..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will add database-level FK constraints for P0 tables." -ForegroundColor White
Write-Host "The operation is safe (uses NOT VALID and minimal locks)." -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue with FK application? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Applying FK constraints (this may take 1-2 minutes for index creation)..." -ForegroundColor Cyan
Write-Host ""

# Run apply SQL
try {
    $applyOutput = Get-Content $APPLY_SQL | docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: FK application failed" -ForegroundColor Red
        Write-Host $applyOutput -ForegroundColor Red
        Write-Host ""
        Write-Host "To rollback partial changes, run: .\scripts\rollback-p0-fks.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    # Display apply output
    Write-Host $applyOutput
    Write-Host ""
    
}
catch {
    Write-Host "ERROR: FK application execution failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "To rollback partial changes, run: .\scripts\rollback-p0-fks.ps1" -ForegroundColor Yellow
    exit 1
}

# Final verification - count FKs
Write-Host "Step 3: Final verification..." -ForegroundColor Yellow
Write-Host ""

try {
    $fkCount = docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='FOREIGN KEY';"
    
    Write-Host "Total FK constraints in database: $fkCount" -ForegroundColor Green
    Write-Host ""
    
}
catch {
    Write-Host "WARNING: Could not verify FK count" -ForegroundColor Yellow
}

Write-Host "============================================================================" -ForegroundColor Green
Write-Host "SUCCESS: P0 FK CONSTRAINTS APPLIED" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open pgAdmin" -ForegroundColor White
Write-Host "  2. Right-click database -> Tools -> ERD Tool (or Generate ERD)" -ForegroundColor White
Write-Host "  3. Verify relationships now show for users/enrollments/courses/assignments" -ForegroundColor White
Write-Host ""
Write-Host "To rollback these changes: .\scripts\rollback-p0-fks.ps1" -ForegroundColor Yellow
Write-Host ""
