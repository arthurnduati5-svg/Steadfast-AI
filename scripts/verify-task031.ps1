$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-031"
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

# Step 1: Validate Task 030 proof exists
Run-Step -Name "Task 030 Proof Validation" `
  -Command "node -e ""const fs=require('fs'); const p='docs/ops/task-030/task-030-staging-rehearsal-report.json'; const r=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')); if(r.taskId!=='030') process.exit(1); if(r.safeToStartTask031!==true) process.exit(2); if(r.finalDecision!=='TASK_030_PASS_SAFE_TO_START_TASK_031') process.exit(3); console.log('TASK_030_PROOF_VALID'); process.exit(0);"" 2>&1" `
  -LogFile "task030-proof-validation.log"

# Step 2: Staging Environment Gate check
Run-Step -Name "Staging Environment Gate" `
  -Command "node -e ""const ok=process.env.TASK031_STAGING_SMOKE==='1'&&process.env.TASK031_NO_LIVE_STUDENTS==='1'&&process.env.TASK031_SYNTHETIC_SCHOOL_IDENTITY==='1'&&process.env.NODE_ENV!=='production';console.log('TASK031_STAGING_SMOKE:'+(process.env.TASK031_STAGING_SMOKE||'not_set'));console.log('TASK031_NO_LIVE_STUDENTS:'+(process.env.TASK031_NO_LIVE_STUDENTS||'not_set'));console.log('TASK031_SYNTHETIC_SCHOOL_IDENTITY:'+(process.env.TASK031_SYNTHETIC_SCHOOL_IDENTITY||'not_set'));console.log('NODE_ENV:'+(process.env.NODE_ENV||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "staging-environment-gate.log"

# Step 3: No-Live-Student Guard check
Run-Step -Name "No-Live-Student Guard" `
  -Command "node -e ""const ok=process.env.TASK031_NO_LIVE_STUDENTS==='1'&&process.env.TASK031_STAGING_SMOKE==='1';console.log('TASK031_NO_LIVE_STUDENTS:'+(process.env.TASK031_NO_LIVE_STUDENTS||'not_set'));console.log('TASK031_STAGING_SMOKE:'+(process.env.TASK031_STAGING_SMOKE||'not_set'));process.exit(ok?0:1)"" 2>&1" `
  -LogFile "no-live-student-guard.log"

# Step 4: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 5: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 6: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 7: Backend build
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# Step 8: Task 031 backend tests
Run-Step -Name "Task 031 Backend Tests" `
  -Command "npx vitest run backend/src/tests/task-031- --reporter=verbose 2>&1" `
  -LogFile "task031-backend-tests.log"

# Step 9: Run staging smoke
Run-Step -Name "Run Task 031 Staging Smoke" `
  -Command "node scripts/run-task031-staging-smoke.cjs 2>&1" `
  -LogFile "staging-smoke.log"

# Write intermediate verification summary
$interimSummary = @{
  TaskId = "031"
  TaskName = "Authenticated Staging School Smoke, Embed Handoff Validation, Observability Baseline, and No-Live-Student Canary Release Gate"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}
$interimSummaryPath = Join-Path $logDir "task-031-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$interimSummaryJson = $interimSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($interimSummaryPath, $interimSummaryJson, $utf8NoBom)

# Step 10: Generate Task 031 report
Run-Step -Name "Generate Task 031 Final Report" `
  -Command "node scripts/gen-task031-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 11: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node scripts/task031-json-validate.cjs 2>&1" `
  -LogFile "json-validation.log"

# Step 12: Privacy leak scan
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task031-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Write interim final verification summary
$summary = @{
  TaskId = "031"
  TaskName = "Authenticated Staging School Smoke, Embed Handoff Validation, Observability Baseline, and No-Live-Student Canary Release Gate"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-031-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$summaryJson = $summary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($summaryPath, $summaryJson, $utf8NoBom)

# ── Pass 2: Regenerate report from final summary ──
Run-Step -Name "Regenerate Task 031 Final Report (Pass 2)" `
  -Command "node scripts/gen-task031-report.cjs 2>&1" `
  -LogFile "report-generation-pass2.log"

Run-Step -Name "Final JSON Report Validation (Pass 2)" `
  -Command "node scripts/task031-json-validate.cjs 2>&1" `
  -LogFile "json-validation-pass2.log"

Run-Step -Name "Final Privacy Leak Scan (Pass 2)" `
  -Command "node scripts/task031-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan-pass2.log"

# Write final final verification summary
$finalSummary = @{
  TaskId = "031"
  TaskName = "Authenticated Staging School Smoke, Embed Handoff Validation, Observability Baseline, and No-Live-Student Canary Release Gate"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$finalSummaryPath = Join-Path $logDir "task-031-verification-summary.json"
$finalSummaryJson = $finalSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($finalSummaryPath, $finalSummaryJson, $utf8NoBom)

Write-Host "`n========================================"
Write-Host "Verification Summary"
Write-Host "========================================"
Write-Host "Overall result: $($finalSummary.OverallResult)"
Write-Host "Overall exit code: $global:overallExit"
Write-Host "Summary log: $finalSummaryPath"
Write-Host "========================================"

Pop-Location
exit $global:overallExit
