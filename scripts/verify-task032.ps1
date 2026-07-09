param(
  [switch]$SkipFullBackendSuite
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date
$logDir = "logs/task-032"
$null = New-Item -ItemType Directory -Force $logDir
$exitCode = 0
$results = @()

function Run-Step {
  param($Name, $ScriptBlock)
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  $stepStart = Get-Date
  try {
    & $ScriptBlock
    $duration = (Get-Date) - $stepStart
    Write-Host "PASS ($($duration.TotalSeconds.ToString('F2'))s)" -ForegroundColor Green
    $results += [PSCustomObject]@{ Step = $Name; Status = 'PASS'; Duration = $duration.TotalSeconds }
  } catch {
    $duration = (Get-Date) - $stepStart
    Write-Host "FAIL: $_" -ForegroundColor Red
    $results += [PSCustomObject]@{ Step = $Name; Status = 'FAIL'; Duration = $duration.TotalSeconds }
    $script:exitCode = 1
  }
}

# Step 1: Task 031 dependency proof
Run-Step -Name "Task 031 Dependency Proof" -ScriptBlock {
  node -e "
    const proof = require('./backend/src/services/task032Task031ProofLoaderService');
    proof.loadTask031ProofForTask032().then(p => { if (!p.ok) { console.error('Proof failed:', p.blockingIssues); process.exit(1); } });
  " 2>&1 | Out-Null
  if (-not (Test-Path "reports/task-031-staging-smoke-canary-readiness-v1.json")) { throw "Task 031 report not found" }
  if (-not (Test-Path "docs/ops/task-031/task-031-staging-smoke-canary-readiness-report.json")) { throw "Task 031 ops report not found" }
  $report = Get-Content "reports/task-031-staging-smoke-canary-readiness-v1.json" | ConvertFrom-Json
  if ($report.verdict -ne "ACCEPTED_READY_YES") { throw "Task 031 verdict not ACCEPTED_READY_YES" }
  if ($report.safeToStartTask032 -ne $true) { throw "Task 031 safeToStartTask032 not true" }
  Write-Host "Task 031 proof valid: verdict=$($report.verdict), safeToStartTask032=$($report.safeToStartTask032)" -ForegroundColor Green
}

# Step 2: TypeScript noEmit
Run-Step -Name "TypeScript noEmit" -ScriptBlock {
  $output = npx tsc -p backend/tsconfig.json --noEmit --incremental false 2>&1
  if ($LASTEXITCODE -ne 0) { throw "TypeScript errors:`n$output" }
  Write-Host "TypeScript: 0 errors"
}

# Step 3: Backend build
Run-Step -Name "Backend Build" -ScriptBlock {
  $output = npm --prefix backend run build 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Backend build failed: $output" }
}

# Step 4: Prisma validate
Run-Step -Name "Prisma Validate" -ScriptBlock {
  Push-Location backend
  $output = npx prisma validate --schema=prisma/schema.prisma 2>&1
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Prisma validate failed: $output" }
  Pop-Location
}

# Step 5: Prisma generate
Run-Step -Name "Prisma Generate" -ScriptBlock {
  Push-Location backend
  $output = npx prisma generate --schema=prisma/schema.prisma 2>&1
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Prisma generate failed: $output" }
  Pop-Location
}

# Step 6: Task 032 focused tests
Run-Step -Name "Task 032 Focused Tests" -ScriptBlock {
  $task032Files = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -like "task032-*.test.ts" -or $_.Name -like "task032-*.contract.test.ts" -or
    $_.Name -like "task-032-*.test.ts" -or $_.Name -like "task-032-*.contract.test.ts"
  } | ForEach-Object { $_.FullName }

  $count = ($task032Files | Measure-Object).Count
  if ($count -lt 65) { throw "Task 032 focused test set incomplete. Found $count, expected at least 65." }
  Write-Host "Found $count Task 032 test files" -ForegroundColor Green

  $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $task032Files 2>&1
  $output | Tee-Object -FilePath "$logDir/task032-focused-tests-final.txt" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Task 032 focused tests failed" }
}

# Step 7: Task 020-031 regression
Run-Step -Name "Task 020-031 Regression" -ScriptBlock {
  $task020To031Files = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -match "task-020|task020|task-021|task021|task-022|task022|task-023|task023|task-024|task024|task-025|task025|task-026|task026|task-027|task027|task-028|task028|task-029|task029|task-030|task030|task-031|task031"
  } | ForEach-Object { $_.FullName }
  $count = ($task020To031Files | Measure-Object).Count
  Write-Host "Found $count Task 020-031 files" -ForegroundColor Green

  if ($count -gt 0) {
    $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $task020To031Files 2>&1
    $output | Tee-Object -FilePath "$logDir/task020-to-task031-regression-final.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Task 020-031 regression failed" }
  } else {
    Write-Host "No Task 020-031 files found, skipping regression" -ForegroundColor Yellow
  }
}

# Step 8: Phase 3 regression
Run-Step -Name "Phase 3 Regression" -ScriptBlock {
  $phase3Files = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -match "phase3-objective|phase3-daily-objective|phase3-daily-learning-feed|phase3-study-plan|phase3-growth-page|phase3-living-revision|phase3-confidence|phase3-parent-support|phase3-peer-learning|phase3-peer"
  } | ForEach-Object { $_.FullName }
  $count = ($phase3Files | Measure-Object).Count
  Write-Host "Found $count Phase 3 files" -ForegroundColor Green

  if ($count -gt 0) {
    $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $phase3Files 2>&1
    $output | Tee-Object -FilePath "$logDir/phase3-regression-final.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Phase 3 regression failed" }
  } else {
    Write-Host "No Phase 3 files found, skipping regression" -ForegroundColor Yellow
  }
}

# Step 9: Full backend suite (skip if flag set)
if (-not $SkipFullBackendSuite) {
  Run-Step -Name "Full Backend Suite" -ScriptBlock {
    $output = npx vitest run --config backend/vitest.config.ts --reporter=verbose 2>&1
    $output | Tee-Object -FilePath "$logDir/full-backend-suite-final.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Full backend suite failed" }
  }
}

# Step 10: Generate report
Run-Step -Name "Generate Task 032 Report" -ScriptBlock {
  node scripts/gen-task032-report.cjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Report generation failed" }
}

# Summary
$totalDuration = (Get-Date) - $startTime
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TASK 032 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize
Write-Host "Total: $($results.Count) steps, $(($results | Where-Object { $_.Status -eq 'PASS' }).Count) passed, $(($results | Where-Object { $_.Status -eq 'FAIL' }).Count) failed" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })
Write-Host "Duration: $($totalDuration.TotalSeconds.ToString('F2'))s" -ForegroundColor Cyan

if ($exitCode -ne 0) {
  Write-Host "`nTASK 032 VERIFICATION FAILED" -ForegroundColor Red
  exit 1
}
Write-Host "`nTASK 032 VERIFICATION PASSED" -ForegroundColor Green
exit 0
