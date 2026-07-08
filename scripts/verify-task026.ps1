$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-026"
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

function Scan-ForbiddenPattern {
  param($Name, $Pattern, $IncludePattern, $LogFile)
  $logPath = Join-Path $logDir $LogFile
  Write-Host "`n=== $Name ==="
  Write-Host "Scan: $Pattern"
  $start = Get-Date
  $excludeDirs = @('node_modules', '.next', 'dist', '.git', 'logs')
  $excludeStr = ($excludeDirs | ForEach-Object { "--exclude-dir=$_" }) -join ' '
  $cmd = "rg --no-heading -n $excludeStr"
  if ($IncludePattern) { $cmd += " --include '$IncludePattern'" }
  $cmd += " '$Pattern' '$rootDir' 2>&1"
  try {
    $output = cmd /c $cmd 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
    if ($LASTEXITCODE -eq $null) { $exitCode = 0 }
  } catch {
    $output = $_.Exception.Message
    $exitCode = 1
  }
  $end = Get-Date
  $output | Out-File -FilePath $logPath -Encoding utf8
  $lines = ($output -split "`r`n" | Where-Object { $_ -ne '' }).Count
  if ($exitCode -eq 0 -and $lines -eq 0) {
    $result = "PASS"
    $exitCode = 0
  } elseif ($exitCode -eq 1 -and $lines -eq 0) {
    $result = "PASS"
    $exitCode = 0
  } elseif ($exitCode -eq 0 -and $lines -gt 0) {
    $result = "FAIL"
    $exitCode = 1
  } else {
    $result = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
  }
  $duration = ($end - $start).TotalSeconds
  Write-Host "Matches found: $lines"
  Write-Host "Result: $result"
  Write-Host "Duration: ${duration}s"
  Write-Host "Log: $logPath"
  $global:results += @{
    Name = $Name
    Command = "rg $Pattern"
    LogPath = $logPath
    ExitCode = $exitCode
    Result = $result
    DurationSeconds = $duration
  }
  if ($exitCode -ne 0) { $global:overallExit = 1 }
}

Push-Location $rootDir

Write-Host "========================================"
Write-Host "Task 026 Verification Script"
Write-Host "========================================"
Write-Host "Root: $rootDir"
Write-Host "Logs: $logDir"
Write-Host "Date: $now"

# ---- STEP 0: Check test file count ----
Write-Host "`n=== Step 0: Test File Count ==="
$testFiles = Get-ChildItem -LiteralPath "backend/src/tests" -Filter "task-026*.test.ts"
$testFileCount = $testFiles.Count
$totalAssertions = 0
foreach ($f in $testFiles) {
  $content = Get-Content -LiteralPath $f.FullName -Raw
  $matches = [regex]::Matches($content, '(it\(|test\(|expect\(|assert\.)')
  $totalAssertions += $matches.Count
}
Write-Host "Task 026 test files: $testFileCount"
Write-Host "Total assertions: $totalAssertions"
if ($testFileCount -ge 45) {
  Write-Host "Test file threshold (45): MET"
} else {
  Write-Host "Test file threshold (45): NOT MET ($testFileCount/45)"
  Write-Host "WARNING: Expected 45+ test files, found $testFileCount. This is informational only."
}
$global:results += @{
  Name = "Test File Count Check"
  Command = "Get-ChildItem task-026*.test.ts"
  LogPath = ""
  ExitCode = 0
  Result = "INFO"
  DurationSeconds = 0
  TestFileCount = $testFileCount
  TotalAssertions = $totalAssertions
}

# ---- STEP 1: Prisma validate (PostgreSQL schema) ----
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# ---- STEP 2: Prisma generate (PostgreSQL client) ----
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# ---- STEP 3: Prisma generate (SQLite test client) ----
Run-Step -Name "Prisma Test Client Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.test.sqlite.prisma 2>&1" `
  -LogFile "prisma-test-client-generate.log"

# ---- STEP 4: Backend typecheck ----
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc --noEmit -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-typecheck.log"

# ---- STEP 5: Backend build ----
Run-Step -Name "Backend Build" `
  -Command "npx tsc -p backend/tsconfig.json 2>&1" `
  -LogFile "backend-build.log"

# ---- STEP 6: Task 026 targeted tests ----
Run-Step -Name "Task 026 Tests" `
  -Command "npx vitest run backend/src/tests/task-026- --reporter=verbose 2>&1" `
  -LogFile "task026-targeted-tests.log"

# ---- STEP 7: Safety scans ----
Scan-ForbiddenPattern -Name "Privacy Leak Scan" `
  -Pattern "(rawStudentChat|privateLearnerMemory|teacherOnlyNotes|safeguardingRawDetails|deenSensitivePrivateText|answerKeys|teacherOnlyContent|protectedRubrics)" `
  -IncludePattern "*.ts" `
  -LogFile "privacy-leak-scan.log"

Scan-ForbiddenPattern -Name "Production Mutation Scan" `
  -Pattern "production\.(update|delete|create)|liveDb\.(update|delete|create)|prisma\.\$executeRaw" `
  -IncludePattern "*.ts" `
  -LogFile "production-mutation-scan.log"

Scan-ForbiddenPattern -Name "Live Connector/AI Scan" `
  -Pattern "liveSchoolConnector\.(send|write|update)|liveAi\.(call|invoke|stream)|realNotification\.(send|push|dispatch)" `
  -IncludePattern "*.ts" `
  -LogFile "live-connector-ai-scan.log"

Scan-ForbiddenPattern -Name "Live Notification Scan" `
  -Pattern "fcm\.(send|sendMulticast|sendEachForMulticast)|pushNotification\.(send|dispatch)|emailService\.(send|sendMail)" `
  -IncludePattern "*.ts" `
  -LogFile "live-notification-scan.log"

Scan-ForbiddenPattern -Name "Task 027 Expansion Scan" `
  -Pattern "pilotExpansion|schoolWideRollout|task027|Task027|task-027" `
  -IncludePattern "*.ts" `
  -LogFile "task027-expansion-scan.log"

Scan-ForbiddenPattern -Name "False Pass Scan" `
  -Pattern "expect\.(resolve|reject)\(true\)|expect\(true\)\.toBe\(true\)|expect\(false\)\.toBe\(false\)" `
  -IncludePattern "*.test.ts" `
  -LogFile "false-pass-scan.log"

# ---- STEP 8: Generate report ----
Run-Step -Name "Generate Task 026 Report" `
  -Command "node scripts/gen-task026-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# ---- Compute verdict ----
$allStepsPassed = ($global:results | Where-Object { $_.Result -eq "FAIL" }).Count -eq 0
$verdict = if ($allStepsPassed) { "PASS" } else { "FAIL" }

# Update verification summary
$summary = @{
  TaskId = "026"
  TaskName = "Controlled Pilot Execution Runtime, Live Pilot Guards, Feedback Loop, Pilot Metrics, and Post-Pilot Review Gate"
  GeneratedAt = $now
  OverallResult = $verdict
  OverallExitCode = $global:overallExit
  TestFileCount = $testFileCount
  TotalAssertions = $totalAssertions
  TestFileThresholdMet = ($testFileCount -ge 45)
  Steps = $global:results
  SafeToStartTask027 = ($verdict -eq "PASS")
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-026-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$summaryJson = $summary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($summaryPath, $summaryJson, $utf8NoBom)

Write-Host "`n========================================"
Write-Host "Verification Summary"
Write-Host "========================================"
Write-Host "Test files: $testFileCount (threshold: 45, met: $($testFileCount -ge 45))"
Write-Host "Total assertions: $totalAssertions"
Write-Host "Steps passed: $($global:results | Where-Object { $_.Result -eq 'PASS' } | Measure-Object | Select-Object -ExpandProperty Count) / $($global:results.Count)"
Write-Host "Overall result: $($summary.OverallResult)"
Write-Host "Overall exit code: $global:overallExit"
Write-Host "safeToStartTask027: $($summary.SafeToStartTask027)"
Write-Host "Summary log: $summaryPath"
Write-Host "========================================"

Pop-Location
exit $global:overallExit
