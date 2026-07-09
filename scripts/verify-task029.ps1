$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-029"
$null = New-Item -ItemType Directory -Force $logDir

$global:results = @()
$global:overallExit = 0
$now = Get-Date -Format "o"

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

# Step 1: Validate Task 028 proof exists
Run-Step -Name "Task 028 Proof Validation" `
  -Command "node -e ""const fs=require('fs'); const p='docs/ops/task-028/task-028-expansion-execution-report.json'; const r=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')); if(r.taskId!=='028') process.exit(1); if(r.safeToStartTask029!==true) process.exit(2); if(r.finalDecision!=='TASK_028_PASS_SAFE_TO_START_TASK_029') process.exit(3); console.log('TASK_028_PROOF_VALID'); process.exit(0);"" 2>&1" `
  -LogFile "task028-proof-validation.log"

# Step 2: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 3: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 4: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 5: Backend build
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# Step 6: Task 029 backend tests (all 73 files)
Run-Step -Name "Task 029 Backend Tests" `
  -Command "npx vitest run --config backend/vitest.config.ts --reporter=verbose -- backend/src/tests/task-029-*.test.ts backend/src/tests/task-029-smoke.test.ts backend/src/tests/task-028-no-task029-console.contract.test.ts 2>&1" `
  -LogFile "task029-backend-tests.log"

# Step 7: Task 029 UI/API proof (contract + scope tests)
Run-Step -Name "Task 029 UI/API Proof" `
  -Command "npx vitest run --config backend/vitest.config.ts --reporter=verbose -- backend/src/tests/task-029-routes-*.contract.test.ts backend/src/tests/task-029-learner-denied-operations-console.contract.test.ts backend/src/tests/task-029-safe-error-envelope.contract.test.ts 2>&1" `
  -LogFile "task029-uiapi-proof.log"

# Write preliminary verification summary
$preSummary = @{
  TaskId = "029"
  TaskName = "Expansion Operations Console, School Staff Rollout UX, Student-Safe Expansion Status, and End-to-End UI/API Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}
$preSummaryPath = Join-Path $logDir "task-029-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$preSummaryJson = $preSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($preSummaryPath, $preSummaryJson, $utf8NoBom)
Write-Host "Preliminary verification summary written: $preSummaryPath"

# Step 8: Generate Task 029 report
Run-Step -Name "Generate Task 029 Report" `
  -Command "node scripts/gen-task029-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 9: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node scripts/task029-json-validate.cjs 2>&1" `
  -LogFile "json-validation.log"

# Step 10: Privacy leak scan
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task029-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Write final verification summary
$summary = @{
  TaskId = "029"
  TaskName = "Expansion Operations Console, School Staff Rollout UX, Student-Safe Expansion Status, and End-to-End UI/API Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-029-verification-summary.json"
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
