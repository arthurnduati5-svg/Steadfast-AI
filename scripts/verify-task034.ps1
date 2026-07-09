$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-034"
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

# Step 1: Validate Task 033 proof
Run-Step -Name "Task 033 Proof Validation" `
  -Command "node -e ""const fs=require('fs');const p='docs/ops/task-033/task-033-canary-observation-report.json';const r=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));if(r.taskId!=='033')process.exit(1);if(r.safeToStartTask034!==true)process.exit(2);if(r.finalDecision!=='TASK_033_PASS_SAFE_TO_START_TASK_034')process.exit(3);console.log('TASK_033_PROOF_VALID');process.exit(0);"" 2>&1" `
  -LogFile "task032-proof-validation.log"

# Step 2: Controlled rollout environment gate
Run-Step -Name "Controlled Rollout Environment Gate" `
  -Command "node -e ""const ok=process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT==='1'&&process.env.TASK034_REQUIRE_TASK033_PROOF==='1'&&process.env.TASK034_NO_OPEN_ROLLOUT==='1'&&process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT==='1'&&process.env.TASK034_PRIVACY_SAFE_EVIDENCE==='1'&&process.env.TASK034_REQUIRE_STAFF_READINESS==='1'&&process.env.TASK034_REQUIRE_ROLLBACK_READY==='1';console.log('TASK034_CONTROLLED_LIMITED_ROLLOUT:'+(process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT||'not_set'));console.log('TASK034_REQUIRE_TASK033_PROOF:'+(process.env.TASK034_REQUIRE_TASK033_PROOF||'not_set'));console.log('TASK034_NO_OPEN_ROLLOUT:'+(process.env.TASK034_NO_OPEN_ROLLOUT||'not_set'));console.log('TASK034_NO_SCHOOL_WIDE_ROLLOUT:'+(process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT||'not_set'));console.log('TASK034_PRIVACY_SAFE_EVIDENCE:'+(process.env.TASK034_PRIVACY_SAFE_EVIDENCE||'not_set'));console.log('TASK034_REQUIRE_STAFF_READINESS:'+(process.env.TASK034_REQUIRE_STAFF_READINESS||'not_set'));console.log('TASK034_REQUIRE_ROLLBACK_READY:'+(process.env.TASK034_REQUIRE_ROLLBACK_READY||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "rollout-environment-gate.log"

# Step 3: Rollout cap precheck
Run-Step -Name "Rollout Cap Precheck" `
  -Command "node -e ""const p=parseInt(process.env.TASK034_MAX_ROLLOUT_PERCENT||'25',10);const s=parseInt(process.env.TASK034_MAX_ROLLOUT_STUDENTS||'100',10);const ok=p<=25&&p>0&&s<=100&&s>0;console.log('TASK034_MAX_ROLLOUT_PERCENT:'+p);console.log('TASK034_MAX_ROLLOUT_STUDENTS:'+s);process.exit(ok?0:1)"" 2>&1" `
  -LogFile "rollout-cap-precheck.log"

# Step 4: Privacy-safe evidence precheck
Run-Step -Name "Privacy-Safe Evidence Precheck" `
  -Command "node -e ""const ok=process.env.TASK034_PRIVACY_SAFE_EVIDENCE==='1';console.log('TASK034_PRIVACY_SAFE_EVIDENCE:'+(process.env.TASK034_PRIVACY_SAFE_EVIDENCE||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "privacy-safe-evidence-precheck.log"

# Step 5: Staff readiness precheck
Run-Step -Name "Staff Readiness Precheck" `
  -Command "node -e ""const ok=process.env.TASK034_REQUIRE_STAFF_READINESS==='1';console.log('TASK034_REQUIRE_STAFF_READINESS:'+(process.env.TASK034_REQUIRE_STAFF_READINESS||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "staff-readiness-precheck.log"

# Step 6: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 7: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 8: SQLite test client generate if exists
if (Test-Path "backend/prisma/schema.test.sqlite.prisma") {
  Run-Step -Name "SQLite Test Client Generate" `
    -Command "npx prisma generate --schema backend/prisma/schema.test.sqlite.prisma 2>&1" `
    -LogFile "sqlite-test-client-generate.log"
}

# Step 9: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 10: Backend build
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# Step 11: Run controlled rollout runner BEFORE report generation
Run-Step -Name "Controlled Rollout Runner" `
  -Command "node scripts/run-task034-controlled-rollout.cjs 2>&1" `
  -LogFile "controlled-rollout-runner.log"

# Step 12: Generate Task 034 report BEFORE report-dependent tests
Run-Step -Name "Generate Task 034 Report" `
  -Command "node scripts/gen-task034-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 13: Task 034 backend tests
Run-Step -Name "Task 034 Backend Tests" `
  -Command "npx vitest run backend/src/tests/task-034- --reporter=verbose 2>&1" `
  -LogFile "task034-backend-tests.log"

# Step 14: Regenerate report after tests
Run-Step -Name "Regenerate Task 034 Report After Tests" `
  -Command "node scripts/gen-task034-report.cjs 2>&1" `
  -LogFile "report-generation-after-tests.log"

# Step 15: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node scripts/task034-json-validate.cjs 2>&1" `
  -LogFile "json-validation.log"

# Step 16: Privacy leak scan
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task034-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Step 17: Final JSON report validation
Run-Step -Name "Final JSON Report Validation" `
  -Command "node scripts/task034-json-validate.cjs 2>&1" `
  -LogFile "json-validation-final.log"

# Step 18: Final privacy leak scan
Run-Step -Name "Final Privacy Leak Scan" `
  -Command "node scripts/task034-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan-final.log"

# Write final verification summary
$summary = @{
  TaskId = "034"
  TaskName = "Controlled Limited Rollout Expansion, 25% Cohort Gate, Expanded Runtime Safety, Staff Readiness, Health Budget Escalation, and Rollback-Protected Release Decision"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-034-verification-summary.json"
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
