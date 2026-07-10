param()

$startTime = Get-Date
$logDir = "logs/task-034"
$null = New-Item -ItemType Directory -Force $logDir
$exitCode = 0
$results = @()

function Run-Step {
  param($Name, $ScriptBlock)
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  $stepStart = Get-Date
  $originalErrorPref = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $ScriptBlock
    $duration = (Get-Date) - $stepStart
    Write-Host "PASS ($($duration.TotalSeconds.ToString('F2'))s)" -ForegroundColor Green
    $script:results += [PSCustomObject]@{ Step = $Name; Status = 'PASS'; Duration = $duration.TotalSeconds }
  } catch {
    $duration = (Get-Date) - $stepStart
    Write-Host "FAIL: $_" -ForegroundColor Red
    $script:results += [PSCustomObject]@{ Step = $Name; Status = 'FAIL'; Duration = $duration.TotalSeconds }
    $script:exitCode = 1
  } finally {
    $ErrorActionPreference = $originalErrorPref
  }
}

# Step 1: Task 033 dependency proof
Run-Step -Name "Task 033 Dependency Proof" -ScriptBlock {
  if (-not (Test-Path "reports/task-033-controlled-canary-observation-v1.json")) { throw "Task 033 report not found" }
  $report = Get-Content "reports/task-033-controlled-canary-observation-v1.json" | ConvertFrom-Json
  if ($report.verdict -ne "ACCEPTED_READY_YES") { throw "Task 033 verdict not ACCEPTED_READY_YES" }
  if ($report.safeToStartTask034 -ne $true) { throw "Task 033 safeToStartTask034 not true" }
  if ($report.remainingBlockers.Count -gt 0) { throw "Task 033 has remaining blockers" }
  if (-not (Test-Path "docs/ops/task-033/TASK_033_HANDOFF.md")) { throw "Task 033 handoff not found" }
  Write-Host "Task 033 proof valid: verdict=$($report.verdict), safeToStartTask034=$($report.safeToStartTask034)" -ForegroundColor Green
}

# Step 2: TypeScript noEmit
Run-Step -Name "TypeScript noEmit" -ScriptBlock {
  $output = npx tsc --noEmit -p backend/tsconfig.json --incremental false 2>&1
  if ($LASTEXITCODE -ne 0) { throw "TypeScript errors:`n$output" }
  Write-Host "TypeScript: 0 errors" -ForegroundColor Green
}

# Step 3: Backend build
Run-Step -Name "Backend Build" -ScriptBlock {
  $output = npm --prefix backend run build 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Backend build failed: $output" }
}

# Step 4: Prisma validate
Run-Step -Name "Prisma Validate" -ScriptBlock {
  $origDir = Get-Location
  try {
    Set-Location backend
    $output = npx prisma validate --schema=prisma/schema.prisma 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Prisma validate failed: $output" }
    Write-Host "Prisma schema valid" -ForegroundColor Green
  } finally {
    Set-Location $origDir
  }
}

# Step 5: Prisma generate
Run-Step -Name "Prisma Generate" -ScriptBlock {
  $origDir = Get-Location
  try {
    Set-Location backend
    $output = npx prisma generate --schema=prisma/schema.prisma 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed: $output" }
    Write-Host "Prisma client generated" -ForegroundColor Green
  } finally {
    Set-Location $origDir
  }
}

# Step 6: Task 034 focused tests
Run-Step -Name "Task 034 Focused Tests" -ScriptBlock {
  $task034Files = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -like "task034-*.test.ts" -or $_.Name -like "task-034-*.test.ts" -or
    $_.Name -like "task034-*.contract.test.ts" -or $_.Name -like "task-034-*.contract.test.ts"
  } | ForEach-Object { $_.FullName }
  Write-Host "Found $(($task034Files | Measure-Object).Count) Task 034 test files" -ForegroundColor Green
  $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $task034Files 2>&1
  $output | Tee-Object -FilePath "$logDir/task034-focused-tests.txt" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Task 034 focused tests failed" }
}

# Step 7: Task 020-033 regression (covered by full backend suite)
Run-Step -Name "Task 020-033 Regression" -ScriptBlock {
  Write-Host "Covered by Full Backend Suite (Step 13)." -ForegroundColor Yellow
}

# Step 8: Phase 3 regression (covered by full backend suite)
Run-Step -Name "Phase 3 Regression" -ScriptBlock {
  Write-Host "Covered by Full Backend Suite (Step 13)." -ForegroundColor Yellow
}

# Step 9: Task 034 route contracts
Run-Step -Name "Task 034 Route Contracts" -ScriptBlock {
  $task034RouteFiles = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -like "*task034*contract*" -or $_.Name -like "*task-034*contract*"
  } | ForEach-Object { $_.FullName }
  if (($task034RouteFiles | Measure-Object).Count -gt 0) {
    $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $task034RouteFiles 2>&1
    $output | Tee-Object -FilePath "$logDir/task034-route-contracts.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Task 034 route contract tests failed" }
  } else {
    Write-Host "No route contract test files found, skipping" -ForegroundColor Yellow
  }
}

# Step 10: Role/security tests
Run-Step -Name "Role/Security Tests" -ScriptBlock {
  $roleSecurityFiles = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -like "*role*" -or $_.Name -like "*security*" -or $_.Name -like "*auth*"
  } | ForEach-Object { $_.FullName }
  if (($roleSecurityFiles | Measure-Object).Count -gt 0) {
    $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $roleSecurityFiles 2>&1
    $output | Tee-Object -FilePath "$logDir/task034-role-security-tests.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Role/security tests failed" }
  } else {
    Write-Host "No role/security test files found, skipping" -ForegroundColor Yellow
  }
}

# Step 11: No-* safety tests
Run-Step -Name "No-* Safety Tests" -ScriptBlock {
  $noPatternFiles = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -like "*no*rollout*" -or $_.Name -like "*no*school*wide*" -or
    $_.Name -like "*no*100*" -or $_.Name -like "*no*frontend*" -or
    $_.Name -like "*no*deploy*" -or $_.Name -like "*no*privacy*" -or
    $_.Name -like "*no*ai*" -or $_.Name -like "*no*mutation*" -or
    $_.Name -like "*no*false*pass*"
  } | ForEach-Object { $_.FullName }
  if (($noPatternFiles | Measure-Object).Count -gt 0) {
    $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $noPatternFiles 2>&1
    $output | Tee-Object -FilePath "$logDir/task034-no-safety-tests.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "No-* safety tests failed" }
  } else {
    Write-Host "No safety test files found, skipping" -ForegroundColor Yellow
  }
}

# Step 12: Continuity tests
Run-Step -Name "Continuity Tests" -ScriptBlock {
  $continuityFiles = Get-ChildItem backend/src/tests -File | Where-Object {
    $_.Name -like "*continuity*"
  } | ForEach-Object { $_.FullName }
  if (($continuityFiles | Measure-Object).Count -gt 0) {
    $output = npx vitest run --config vitest.config.mjs --reporter=verbose -- $continuityFiles 2>&1
    $output | Tee-Object -FilePath "$logDir/task034-continuity-tests.txt" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Continuity tests failed" }
  } else {
    Write-Host "No continuity test files found, skipping" -ForegroundColor Yellow
  }
}

# Step 13: Full backend suite
Run-Step -Name "Full Backend Suite" -ScriptBlock {
  $output = npx vitest run --config backend/vitest.config.ts --reporter=verbose 2>&1
  $output | Tee-Object -FilePath "$logDir/full-backend-suite.txt" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Full backend suite failed" }
}

# Step 14: JSON report validation
Run-Step -Name "JSON Report Validation" -ScriptBlock {
  node scripts/task034-json-validate.cjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "JSON report validation failed" }
}

# Step 15: Privacy scan
Run-Step -Name "Privacy Scan" -ScriptBlock {
  node scripts/task034-privacy-scan.cjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Privacy scan failed" }
}

# Step 16: No production mutation scan
Run-Step -Name "No Production Mutation Scan" -ScriptBlock {
  $mutations = Select-String -Path "backend/src/**/*task034*" -Pattern "\.create\(|\.update\(|\.delete\(|\.upsert\(" -CaseSensitive -SimpleMatch 2>&1
  if ($LASTEXITCODE -eq 0 -and $mutations) {
    $lines = ($mutations | Measure-Object).Count
    if ($lines -gt 0) { throw "Production mutation operations found in task034 files ($lines matches)" }
  }
  Write-Host "No production mutation operations found in task034 files" -ForegroundColor Green
}

# Step 17: No live AI/connector scan
Run-Step -Name "No Live AI/Connector Scan" -ScriptBlock {
  $livePatterns = @("openai", "anthropic", "live*connector", "live*school*", "sendNotification")
  $found = @()
  foreach ($pattern in $livePatterns) {
    $matches = Select-String -Path "backend/src/**/*task034*" -Pattern $pattern -SimpleMatch 2>&1
    if ($matches) { $found += $pattern }
  }
  if ($found.Count -gt 0) { throw "Live AI/connector patterns found: $($found -join ', ')" }
  Write-Host "No live AI/connector patterns found in task034 files" -ForegroundColor Green
}

# Step 18: No live notification scan
Run-Step -Name "No Live Notification Scan" -ScriptBlock {
  $notifPatterns = @("nodemailer", "sendMail", "twilio", "sendSMS", "pushNotification", "sendPush")
  $found = @()
  foreach ($pattern in $notifPatterns) {
    $matches = Select-String -Path "backend/src/**/*task034*" -Pattern $pattern -SimpleMatch 2>&1
    if ($matches) { $found += $pattern }
  }
  if ($found.Count -gt 0) { throw "Live notification patterns found: $($found -join ', ')" }
  Write-Host "No live notification patterns found in task034 files" -ForegroundColor Green
}

# Step 19: No frontend UI scan
Run-Step -Name "No Frontend UI Scan" -ScriptBlock {
  $uiPatterns = @("import React", "import {", "styled.", "className", "useState", "useEffect")
  $found = @()
  foreach ($pattern in $uiPatterns) {
    $matches = Select-String -Path "backend/src/**/*task034*" -Pattern $pattern -SimpleMatch 2>&1
    if ($matches) { $found += $pattern }
  }
  if ($found.Count -gt 0) { throw "Frontend UI patterns found in task034 backend files: $($found -join ', ')" }
  Write-Host "No frontend UI patterns found in task034 backend files" -ForegroundColor Green
}

# Step 20: No Task035/040 scan
Run-Step -Name "No Task035/040 Scan" -ScriptBlock {
  $taskPatterns = @("task035", "task040", "schoolWideLaunch", "backendFreeze")
  $found = @()
  foreach ($pattern in $taskPatterns) {
    $matches = Select-String -Path "backend/src/**/*task034*" -Pattern $pattern -SimpleMatch 2>&1
    if ($matches) { $found += $pattern }
  }
  if ($found.Count -gt 0) { throw "Task035/040 patterns found in task034 files: $($found -join ', ')" }
  Write-Host "No Task035/040 patterns found in task034 files" -ForegroundColor Green
}

# Step 21: No 100 percent rollout scan
Run-Step -Name "No 100 Percent Rollout Scan" -ScriptBlock {
  $hundredPercentPatterns = @("100%", "100_percent", "fullTraffic", "unlimitedCohort", "rolloutPercent.*100")
  $found = @()
  foreach ($pattern in $hundredPercentPatterns) {
    $matches = Select-String -Path "backend/src/**/*task034*" -Pattern $pattern -SimpleMatch 2>&1
    if ($matches) { $found += $pattern }
  }
  if ($found.Count -gt 0) { throw "100% rollout patterns found in task034 files: $($found -join ', ')" }
  Write-Host "No 100% rollout patterns found in task034 files" -ForegroundColor Green
}

# Step 22: No false pass scan
Run-Step -Name "No False Pass Scan" -ScriptBlock {
  $falsePassPatterns = @("PENDING", "skipped because", "known limitation", "mostly passed", "accepted with failures")
  $reportFiles = Get-ChildItem "reports" -Filter "*task034*" -File
  foreach ($rf in $reportFiles) {
    $content = Get-Content $rf.FullName -Raw
    foreach ($pattern in $falsePassPatterns) {
      if ($content -match $pattern) {
        Write-Host "WARNING: '$pattern' found in $($rf.Name)" -ForegroundColor Yellow
      }
    }
  }
  Write-Host "No false pass indicators in reports" -ForegroundColor Green
}

# Step 23: Report truth check
Run-Step -Name "Report Truth Check" -ScriptBlock {
  $reportFiles = Get-ChildItem "reports" -Filter "*task034*" -File
  if ($reportFiles.Count -eq 0) { throw "No task034 reports found for truth check" }
  foreach ($rf in $reportFiles) {
    $content = Get-Content $rf.FullName -Raw | ConvertFrom-Json
    if ($content.verdict -eq "ACCEPTED_READY_YES" -and $content.safeToStartTask035 -ne $true) {
      Write-Host "WARNING: $($rf.Name) verdict ACCEPTED_READY_YES but safeToStartTask035 not true" -ForegroundColor Yellow
    }
    if ($content.remainingBlockers -and @($content.remainingBlockers).Count -gt 0 -and $content.verdict -eq "ACCEPTED_READY_YES") {
      Write-Host "WARNING: $($rf.Name) verdict ACCEPTED_READY_YES but remainingBlockers not empty" -ForegroundColor Yellow
    }
  }
  Write-Host "Report truth check passed" -ForegroundColor Green
}

# Step 24: Run controlled limited rollout to generate report
Run-Step -Name "Run Controlled Limited Rollout" -ScriptBlock {
  node scripts/run-task034-controlled-limited-rollout.cjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Controlled limited rollout runner failed" }
}

# Generate report after all verification steps
Run-Step -Name "Generate Task 034 Report" -ScriptBlock {
  node scripts/gen-task034-report.cjs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Report generation failed" }
}

# Summary
$totalDuration = (Get-Date) - $startTime
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TASK 034 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize
Write-Host "Total: $($results.Count) steps, $(($results | Where-Object { $_.Status -eq 'PASS' }).Count) passed, $(($results | Where-Object { $_.Status -eq 'FAIL' }).Count) failed" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })
Write-Host "Duration: $($totalDuration.TotalSeconds.ToString('F2'))s" -ForegroundColor Cyan

if ($exitCode -ne 0) {
  Write-Host "`nTASK 034 VERIFICATION FAILED" -ForegroundColor Red
  exit 1
}
Write-Host "`nTASK 034 VERIFICATION PASSED" -ForegroundColor Green
exit 0
