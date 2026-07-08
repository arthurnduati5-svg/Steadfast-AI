<#
.SYNOPSIS
  Task 024 Verification Script — Production Monitoring, Incident Response, Backup/Restore Drill,
  Operational Hardening, and Safe Operations Proof

.DESCRIPTION
  Runs all required gates for Task 024 acceptance:
    - Prisma validate
    - Prisma generate
    - Backend typecheck
    - Backend build
    - Strict real Prisma persistence tests (TASK024_REQUIRE_REAL_PRISMA=1)
    - Task 024 targeted tests
    - Report generation
  Captures exit codes and writes verification summary.
#>

$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-024"
$null = New-Item -ItemType Directory -Force $logDir

$results = @()
$overallExit = 0

function Run-Step {
  param($Name, $Command, $LogFile)
  $logPath = Join-Path $logDir $LogFile
  Write-Host "`n=== $Name ==="
  Write-Host "Command: $Command"
  $start = Get-Date
  try {
    $output = cmd /c $Command 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
    if ($LASTEXITCODE -eq $null) { $exitCode = 0 }
  } catch {
    $output = $_.Exception.Message
    $exitCode = 1
  }
  $end = Get-Date
  $output | Out-File -FilePath $logPath -Encoding utf8
  $result = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
  $duration = ($end - $start).TotalSeconds
  Write-Host "Exit code: $exitCode"
  Write-Host "Result: $result"
  Write-Host "Duration: ${duration}s"
  Write-Host "Log: $logPath"
  $global:results += @{
    Name = $Name
    Command = $Command
    LogPath = $logPath
    ExitCode = $exitCode
    Result = $result
    DurationSeconds = $duration
  }
  if ($exitCode -ne 0) { $global:overallExit = 1 }
}

Push-Location $rootDir

# Step 1: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 2: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 3: Prisma SQLite test client generate
Run-Step -Name "Prisma Test Client Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.test.sqlite.prisma 2>&1" `
  -LogFile "prisma-test-client-generate.log"

# Step 4: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 5: Backend build
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# Step 6: Strict real Prisma persistence tests
$env:TASK024_REQUIRE_REAL_PRISMA = "1"
Run-Step -Name "Strict Real Prisma Persistence Tests" `
  -Command "npx vitest run backend/src/tests/task-024-real-prisma-persistence.test.ts --reporter=verbose 2>&1" `
  -LogFile "strict-persistence-tests.log"
Remove-Item Env:\TASK024_REQUIRE_REAL_PRISMA -ErrorAction SilentlyContinue

# Step 7: Task 024 targeted tests (non-persistence)
Run-Step -Name "Task 024 Targeted Tests" `
  -Command "npx vitest run backend/src/tests/task-024- --reporter=verbose 2>&1" `
  -LogFile "task024-targeted-tests.log"

# Write intermediate verification summary BEFORE report generation
# so the report generator can consume real step results
$preSummary = @{
  TaskId = "024"
  TaskName = "Production Monitoring, Incident Response, Backup/Restore Drill, Operational Hardening, and Safe Operations Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $overallExit
  Steps = $results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-024-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$preSummaryJson = $preSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($summaryPath, $preSummaryJson, $utf8NoBom)

# Step 8: Generate report (consumes the verification summary written above)
Run-Step -Name "Generate Task 024 Report" `
  -Command "node scripts/gen-task024-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Update verification summary with report generation step result
$summary = @{
  TaskId = "024"
  TaskName = "Production Monitoring, Incident Response, Backup/Restore Drill, Operational Hardening, and Safe Operations Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $overallExit
  Steps = $results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-024-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$summaryJson = $summary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($summaryPath, $summaryJson, $utf8NoBom)

Write-Host "`n========================================"
Write-Host "Verification Summary"
Write-Host "========================================"
Write-Host "Overall result: $($summary.OverallResult)"
Write-Host "Overall exit code: $overallExit"
Write-Host "Summary log: $summaryPath"
Write-Host "========================================"

Pop-Location
exit $overallExit
