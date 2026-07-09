$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-033"
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

# Step 1: Validate Task 032 proof
Run-Step -Name "Task 032 Proof Validation" `
  -Command "node -e ""const fs=require('fs');const p='docs/ops/task-032/task-032-controlled-canary-report.json';const r=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));if(r.taskId!=='032')process.exit(1);if(r.safeToStartTask033!==true)process.exit(2);if(r.finalDecision!=='TASK_032_PASS_SAFE_TO_START_TASK_033')process.exit(3);console.log('TASK_032_PROOF_VALID');process.exit(0);"" 2>&1" `
  -LogFile "task032-proof-validation.log"

# Step 2: Observation environment gate
Run-Step -Name "Observation Environment Gate" `
  -Command "node -e ""const ok=process.env.TASK033_CANARY_OBSERVATION==='1'&&process.env.TASK033_REQUIRE_TASK032_PROOF==='1'&&process.env.TASK033_NO_OPEN_ROLLOUT==='1'&&process.env.TASK033_PRIVACY_SAFE_EVIDENCE==='1'&&process.env.TASK033_REQUIRE_ROLLBACK_READY==='1';console.log('TASK033_CANARY_OBSERVATION:'+(process.env.TASK033_CANARY_OBSERVATION||'not_set'));console.log('TASK033_REQUIRE_TASK032_PROOF:'+(process.env.TASK033_REQUIRE_TASK032_PROOF||'not_set'));console.log('TASK033_NO_OPEN_ROLLOUT:'+(process.env.TASK033_NO_OPEN_ROLLOUT||'not_set'));console.log('TASK033_PRIVACY_SAFE_EVIDENCE:'+(process.env.TASK033_PRIVACY_SAFE_EVIDENCE||'not_set'));console.log('TASK033_REQUIRE_ROLLBACK_READY:'+(process.env.TASK033_REQUIRE_ROLLBACK_READY||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "observation-environment-gate.log"

# Step 3: Privacy-safe evidence precheck
Run-Step -Name "Privacy-Safe Evidence Precheck" `
  -Command "node -e ""const ok=process.env.TASK033_PRIVACY_SAFE_EVIDENCE==='1';console.log('TASK033_PRIVACY_SAFE_EVIDENCE:'+(process.env.TASK033_PRIVACY_SAFE_EVIDENCE||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "privacy-safe-evidence-precheck.log"

# Step 4: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 5: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 6: SQLite test client generate if exists
if (Test-Path "backend/prisma/schema.test.sqlite.prisma") {
  Run-Step -Name "SQLite Test Client Generate" `
    -Command "npx prisma generate --schema backend/prisma/schema.test.sqlite.prisma 2>&1" `
    -LogFile "sqlite-test-client-generate.log"
}

# Step 7: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 8: Backend build
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# Step 9: Run controlled canary observation runner BEFORE report generation
Run-Step -Name "Controlled Canary Observation Runner" `
  -Command "node scripts/run-task033-canary-observation.cjs 2>&1" `
  -LogFile "controlled-canary-observation-runner.log"

# Step 10: Generate Task 033 report BEFORE report-dependent tests
Run-Step -Name "Generate Task 033 Report" `
  -Command "node scripts/gen-task033-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 11: Task 033 backend tests (report-dependent tests need report already generated)
Run-Step -Name "Task 033 Backend Tests" `
  -Command "npx vitest run backend/src/tests/task-033- --reporter=verbose 2>&1" `
  -LogFile "task033-backend-tests.log"

# Step 12: Regenerate report after tests
Run-Step -Name "Regenerate Task 033 Report After Tests" `
  -Command "node scripts/gen-task033-report.cjs 2>&1" `
  -LogFile "report-generation-after-tests.log"

# Step 13: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node scripts/task033-json-validate.cjs 2>&1" `
  -LogFile "json-validation.log"

# Step 14: Privacy leak scan
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task033-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Step 15: Final JSON report validation
Run-Step -Name "Final JSON Report Validation" `
  -Command "node scripts/task033-json-validate.cjs 2>&1" `
  -LogFile "json-validation-final.log"

# Step 16: Final privacy leak scan
Run-Step -Name "Final Privacy Leak Scan" `
  -Command "node scripts/task033-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan-final.log"

# Write final verification summary
$summary = @{
  TaskId = "033"
  TaskName = "Controlled Canary Observation, Live Evidence Review, Staff Feedback Loop, Health Budget Enforcement, and Post-Canary Decision Gate"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-033-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$summaryJson = $summary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($summaryPath, $summaryJson, $utf8NoBom)

Write-Host "`n========================================"
Write-Host "Verification Summary"
Write-Host "========================================"
Write-Host "Overall result: $($summary.OverallResult)"
Write-Host "Overall exit code: $global:overallExit"
Write-Host "Summary log: $summaryPath"
Write-Host "========================================"

Pop-Location
exit $global:overallExit
