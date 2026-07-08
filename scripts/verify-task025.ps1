$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-025"
$null = New-Item -ItemType Directory -Force $logDir

$global:results = @()
$global:overallExit = 0

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

# Step 6: Task 025 targeted tests
Run-Step -Name "Task 025 Tests" `
  -Command "npx vitest run backend/src/tests/task-025- --reporter=verbose 2>&1" `
  -LogFile "task025-targeted-tests.log"

# Write intermediate verification summary BEFORE report generation
$preSummary = @{
  TaskId = "025"
  TaskName = "Controlled School Pilot Readiness, Safe Rollout Gates, Pilot Cohort Control, and End-to-End Pilot Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $overallExit
  Steps = $results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-025-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$preSummaryJson = $preSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($summaryPath, $preSummaryJson, $utf8NoBom)

# Step 7: Generate report
Run-Step -Name "Generate Task 025 Report" `
  -Command "node scripts/gen-task025-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Update verification summary with report generation
$summary = @{
  TaskId = "025"
  TaskName = "Controlled School Pilot Readiness, Safe Rollout Gates, Pilot Cohort Control, and End-to-End Pilot Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $overallExit
  Steps = $results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-025-verification-summary.json"
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
