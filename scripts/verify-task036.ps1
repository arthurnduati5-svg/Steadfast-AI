$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-036"
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

# Step 1: Validate Task 035 proof
Run-Step -Name "Task 035 Proof Validation" `
  -Command "node -e ""const fs=require('fs');const p='docs/ops/task-035/task-035-school-wide-readiness-report.json';const r=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));if(r.taskId!=='035')process.exit(1);if(r.safeToStartTask036!==true)process.exit(2);if(r.finalDecision!=='TASK_035_PASS_SAFE_TO_START_TASK_036')process.exit(3);console.log('TASK_035_PROOF_VALID');process.exit(0);"" 2>&1" `
  -LogFile "task035-proof-validation.log"

# Step 2: Launch environment gate
Run-Step -Name "Launch Environment Gate" `
  -Command "node -e ""const ok=process.env.TASK036_LIVE_SCHOOL_LAUNCH==='1'&&process.env.TASK036_REQUIRE_TASK035_PROOF==='1'&&process.env.TASK036_SINGLE_SCHOOL_ONLY==='1'&&process.env.TASK036_NO_PUBLIC_LAUNCH==='1'&&process.env.TASK036_NO_MULTI_SCHOOL==='1'&&process.env.TASK036_NO_BACKEND_FREEZE==='1'&&process.env.TASK036_PRIVACY_SAFE_EVIDENCE==='1'&&process.env.TASK036_REQUIRE_APPROVAL==='1'&&process.env.TASK036_REQUIRE_LAUNCH_WINDOW==='1'&&process.env.TASK036_MONITORING_ENABLED==='1'&&process.env.TASK036_HEALTH_CHECKS_ENABLED==='1'&&process.env.TASK036_KILL_SWITCH_ENABLED==='1'&&process.env.TASK036_ROLLBACK_ENABLED==='1';console.log('TASK036_LIVE_SCHOOL_LAUNCH:'+(process.env.TASK036_LIVE_SCHOOL_LAUNCH||'not_set'));console.log('TASK036_REQUIRE_TASK035_PROOF:'+(process.env.TASK036_REQUIRE_TASK035_PROOF||'not_set'));console.log('TASK036_SINGLE_SCHOOL_ONLY:'+(process.env.TASK036_SINGLE_SCHOOL_ONLY||'not_set'));console.log('TASK036_NO_PUBLIC_LAUNCH:'+(process.env.TASK036_NO_PUBLIC_LAUNCH||'not_set'));console.log('TASK036_NO_MULTI_SCHOOL:'+(process.env.TASK036_NO_MULTI_SCHOOL||'not_set'));console.log('TASK036_NO_BACKEND_FREEZE:'+(process.env.TASK036_NO_BACKEND_FREEZE||'not_set'));console.log('TASK036_PRIVACY_SAFE_EVIDENCE:'+(process.env.TASK036_PRIVACY_SAFE_EVIDENCE||'not_set'));console.log('TASK036_REQUIRE_APPROVAL:'+(process.env.TASK036_REQUIRE_APPROVAL||'not_set'));console.log('TASK036_REQUIRE_LAUNCH_WINDOW:'+(process.env.TASK036_REQUIRE_LAUNCH_WINDOW||'not_set'));console.log('TASK036_MONITORING_ENABLED:'+(process.env.TASK036_MONITORING_ENABLED||'not_set'));console.log('TASK036_HEALTH_CHECKS_ENABLED:'+(process.env.TASK036_HEALTH_CHECKS_ENABLED||'not_set'));console.log('TASK036_KILL_SWITCH_ENABLED:'+(process.env.TASK036_KILL_SWITCH_ENABLED||'not_set'));console.log('TASK036_ROLLBACK_ENABLED:'+(process.env.TASK036_ROLLBACK_ENABLED||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "launch-environment-gate.log"

# Step 3: Launch window validation
Run-Step -Name "Launch Window Validation" `
  -Command "node -e ""const ws=process.env.TASK036_LAUNCH_WINDOW_START||'2026-07-13T00:00:00.000Z';const we=process.env.TASK036_LAUNCH_WINDOW_END||'2026-07-14T00:00:00.000Z';const now=new Date();const start=new Date(ws);const end=new Date(we);const ok=now>=start&&now<=end;console.log('Window start:'+ws);console.log('Window end:'+we);console.log('Now:'+now.toISOString());console.log('Within window:'+ok);process.exit(ok?0:1)"" 2>&1" `
  -LogFile "launch-window-validation.log"

# Step 4: Launch approval check
Run-Step -Name "Launch Approval Check" `
  -Command "node -e ""const ok=process.env.TASK036_ADMIN_APPROVED==='1'&&process.env.TASK036_PRIVACY_OFFICER_APPROVED==='1'&&process.env.TASK036_DEEN_OFFICER_APPROVED==='1'&&process.env.TASK036_SAFEGUARDING_APPROVED==='1'&&process.env.TASK036_OPS_LEAD_READY==='1'&&process.env.TASK036_TEACHER_LEAD_READY==='1'&&process.env.TASK036_ROLLBACK_OWNER_ASSIGNED==='1'&&process.env.TASK036_KILL_SWITCH_OWNER_ASSIGNED==='1';console.log('Admin approved:'+(process.env.TASK036_ADMIN_APPROVED||'not_set'));console.log('Privacy officer:'+(process.env.TASK036_PRIVACY_OFFICER_APPROVED||'not_set'));console.log('Deen officer:'+(process.env.TASK036_DEEN_OFFICER_APPROVED||'not_set'));console.log('Safeguarding:'+(process.env.TASK036_SAFEGUARDING_APPROVED||'not_set'));console.log('Ops lead:'+(process.env.TASK036_OPS_LEAD_READY||'not_set'));console.log('Teacher lead:'+(process.env.TASK036_TEACHER_LEAD_READY||'not_set'));console.log('Rollback owner:'+(process.env.TASK036_ROLLBACK_OWNER_ASSIGNED||'not_set'));console.log('Kill-switch owner:'+(process.env.TASK036_KILL_SWITCH_OWNER_ASSIGNED||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "launch-approval-check.log"

# Step 5: Single school scope check
Run-Step -Name "Single School Scope Check" `
  -Command "node -e ""const ok=process.env.TASK036_SINGLE_SCHOOL_ONLY==='1'&&process.env.OPEN_REGISTRATION_ENABLED!=='true'&&process.env.PUBLIC_SIGNUP_ENABLED!=='true'&&process.env.ALL_SCHOOLS_ENABLED!=='true';console.log('Single school only:'+(process.env.TASK036_SINGLE_SCHOOL_ONLY||'not_set'));console.log('Open registration blocked:'+(!(process.env.OPEN_REGISTRATION_ENABLED==='true')));console.log('Public signup blocked:'+(!(process.env.PUBLIC_SIGNUP_ENABLED==='true')));console.log('All schools blocked:'+(!(process.env.ALL_SCHOOLS_ENABLED==='true')));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "single-school-scope-check.log"

# Step 6: Runtime monitoring check
Run-Step -Name "Runtime Monitoring Check" `
  -Command "node -e ""const ok=process.env.TASK036_MONITORING_ENABLED==='1'&&process.env.TASK036_HEALTH_CHECKS_ENABLED==='1';console.log('Monitoring enabled:'+(process.env.TASK036_MONITORING_ENABLED||'not_set'));console.log('Health checks enabled:'+(process.env.TASK036_HEALTH_CHECKS_ENABLED||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "runtime-monitoring-check.log"

# Step 7: Health/safety controls check
Run-Step -Name "Health/Safety Controls Check" `
  -Command "node -e ""const ok=process.env.TASK036_KILL_SWITCH_ENABLED==='1'&&process.env.TASK036_ROLLBACK_ENABLED==='1'&&process.env.TASK036_HEALTH_CHECKS_ENABLED==='1';console.log('Kill switch enabled:'+(process.env.TASK036_KILL_SWITCH_ENABLED||'not_set'));console.log('Rollback enabled:'+(process.env.TASK036_ROLLBACK_ENABLED||'not_set'));console.log('Health checks enabled:'+(process.env.TASK036_HEALTH_CHECKS_ENABLED||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "health-safety-controls-check.log"

# Step 8: Boundaries check
Run-Step -Name "Boundaries Check" `
  -Command "node -e ""const ok=process.env.TASK036_NO_PUBLIC_LAUNCH==='1'&&process.env.TASK036_NO_MULTI_SCHOOL==='1'&&process.env.TASK036_NO_BACKEND_FREEZE==='1'&&process.env.TASK036_PRIVACY_SAFE_EVIDENCE==='1';console.log('No public launch:'+(process.env.TASK036_NO_PUBLIC_LAUNCH||'not_set'));console.log('No multi-school:'+(process.env.TASK036_NO_MULTI_SCHOOL||'not_set'));console.log('No backend freeze:'+(process.env.TASK036_NO_BACKEND_FREEZE||'not_set'));console.log('Privacy safe evidence:'+(process.env.TASK036_PRIVACY_SAFE_EVIDENCE||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "boundaries-check.log"

# Step 9: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 10: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 11: SQLite test client generate if exists
if (Test-Path "backend/prisma/schema.test.sqlite.prisma") {
  Run-Step -Name "SQLite Test Client Generate" `
    -Command "npx prisma generate --schema backend/prisma/schema.test.sqlite.prisma 2>&1" `
    -LogFile "sqlite-test-client-generate.log"
}

# Step 12: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 13: Backend build
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# Step 14: Run Task 036 live school launch runner
Run-Step -Name "Live School Launch Runner" `
  -Command "node scripts/run-task036-live-school-launch.cjs 2>&1" `
  -LogFile "live-school-launch-runner.log"

# Step 15: Generate Task 036 report
Run-Step -Name "Generate Task 036 Report" `
  -Command "node scripts/gen-task036-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 16: Task 036 backend tests
Run-Step -Name "Task 036 Backend Tests" `
  -Command "npx vitest run backend/src/tests/task-036- --reporter=verbose 2>&1" `
  -LogFile "task036-backend-tests.log"

# Step 17: Regenerate report after tests
Run-Step -Name "Regenerate Task 036 Report After Tests" `
  -Command "node scripts/gen-task036-report.cjs 2>&1" `
  -LogFile "report-generation-after-tests.log"

# Step 18: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node scripts/task036-json-validate.cjs 2>&1" `
  -LogFile "json-validation.log"

# Step 19: Privacy leak scan
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task036-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Step 20: Final JSON report validation
Run-Step -Name "Final JSON Report Validation" `
  -Command "node scripts/task036-json-validate.cjs 2>&1" `
  -LogFile "json-validation-final.log"

# Step 21: Final privacy leak scan
Run-Step -Name "Final Privacy Leak Scan" `
  -Command "node scripts/task036-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan-final.log"

# Write final verification summary
$summary = @{
  TaskId = "036"
  TaskName = "Controlled Live School Launch Runtime"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-036-verification-summary.json"
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
