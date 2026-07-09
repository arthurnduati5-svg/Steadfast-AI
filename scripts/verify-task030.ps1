$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-030"
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

function Run-StepRaw {
  param($Name, $ScriptBlock, $LogFile)
  $logPath = Join-Path $logDir $LogFile
  Write-Host "`n=== $Name ==="
  Write-Host "Script: $($ScriptBlock.ToString())"
  $start = Get-Date
  try {
    $output = & $ScriptBlock 2>&1 | Out-String
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
    LogPath = $logPath
    ExitCode = $exitCode
    Result = $result
    DurationSeconds = $duration
  }
  if ($exitCode -ne 0) { $global:overallExit = 1 }
}

Write-Host "=== Task 030 Verification Script ==="
Push-Location $rootDir

# Step 1: Backend typecheck
Run-Step -Name "Backend Typecheck" `
  -Command "npx tsc -p backend/tsconfig.json --noEmit --incremental false 2>&1" `
  -LogFile "backend-typecheck.log"

# Step 2: Backend build
Run-Step -Name "Backend Build" `
  -Command "npm --prefix backend run build 2>&1" `
  -LogFile "backend-build.log"

# Step 3: Prisma validate
Run-Step -Name "Prisma Validate" `
  -Command "Push-Location backend; npx prisma validate --schema=prisma/schema.prisma 2>&1; Pop-Location" `
  -LogFile "prisma-validate.log"

# Step 4: Prisma generate
Run-Step -Name "Prisma Generate" `
  -Command "Push-Location backend; npx prisma generate --schema=prisma/schema.prisma 2>&1; Pop-Location" `
  -LogFile "prisma-generate.log"

# Step 5: Collect Task 030 test files and run
Run-Step -Name "Task 030 Test Collection and Run" `
  -Command "npx vitest run --config vitest.config.mjs --reporter=verbose -- $(Get-ChildItem backend/src/tests -File | Where-Object { $_.Name -like 'task030-*.test.ts' -or $_.Name -like 'task030-*.contract.test.ts' -or $_.Name -like 'task-030-*.test.ts' -or $_.Name -like 'task-030-*.contract.test.ts' } | ForEach-Object { $_.FullName } ) 2>&1" `
  -LogFile "task030-tests.log"

# Step 6: Task 020-029 regression
Run-Step -Name "Task 020-029 Regression" `
  -Command "npx vitest run --config vitest.config.mjs --reporter=verbose 2>&1" `
  -LogFile "task020-029-regression.log"

# Step 7: Phase 3 regression
Run-Step -Name "Phase 3 Regression" `
  -Command "npx vitest run --config backend/vitest.config.ts --reporter=verbose 2>&1" `
  -LogFile "phase3-regression.log"

# Step 8: Full backend suite
Run-Step -Name "Full Backend Suite" `
  -Command "npx vitest run --config backend/vitest.config.ts --reporter=verbose 2>&1" `
  -LogFile "full-backend-suite.log"

# Step 9: Privacy scan
Run-Step -Name "Privacy Scan (task030 source files)" `
  -Command "node scripts/task030-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Step 10: No production mutation scan
Run-Step -Name "No Production Mutation Scan" `
  -Command "node -e ""const fs=require('fs'); const dir='backend/src/tests'; const files=fs.readdirSync(dir).filter(f=>f.includes('task030')||f.includes('task-030')); let leaks=0; for(const f of files){const c=fs.readFileSync(dir+'/'+f,'utf8'); if(/production.*mutation|UPDATE.*production|DELETE.*production|INSERT.*production/i.test(c)){console.log('LEAK: production mutation in '+f);leaks++}} process.exit(leaks>0?1:0); console.log('No production mutation detected');"" 2>&1" `
  -LogFile "no-production-mutation-scan.log"

# Step 11: No live AI connector scan
Run-Step -Name "No Live AI Connector Scan" `
  -Command "node -e ""const fs=require('fs'); const dir='backend/src/tests'; const files=fs.readdirSync(dir).filter(f=>f.includes('task030')||f.includes('task-030')); let leaks=0; for(const f of files){const c=fs.readFileSync(dir+'/'+f,'utf8'); if(/liveAI|LiveAI|live_ai|realAI|real_ai|gpt-4|claude|gemini/i.test(c)){console.log('LEAK: live AI connector in '+f);leaks++}} process.exit(leaks>0?1:0); console.log('No live AI connector found');"" 2>&1" `
  -LogFile "no-live-ai-connector-scan.log"

# Step 12: No live notification scan
Run-Step -Name "No Live Notification Scan" `
  -Command "node -e ""const fs=require('fs'); const dir='backend/src/tests'; const files=fs.readdirSync(dir).filter(f=>f.includes('task030')||f.includes('task-030')); let leaks=0; for(const f of files){const c=fs.readFileSync(dir+'/'+f,'utf8'); if(/sendNotification|sendMail|sendEmail|pushNotify|pushNotify|live.*notification/i.test(c)){console.log('LEAK: live notification in '+f);leaks++}} process.exit(leaks>0?1:0); console.log('No live notification found');"" 2>&1" `
  -LogFile "no-live-notification-scan.log"

# Step 13: No frontend UI scan
Run-Step -Name "No Frontend UI Scan" `
  -Command "node -e ""const fs=require('fs'); const dir='backend/src/tests'; const files=fs.readdirSync(dir).filter(f=>f.includes('task030')||f.includes('task-030')); let leaks=0; for(const f of files){const c=fs.readFileSync(dir+'/'+f,'utf8'); if(/jsx|tsx|React|useState|useEffect|render|component/i.test(c)&&!f.includes('contract')){console.log('LEAK: frontend UI code in '+f);leaks++}} process.exit(leaks>0?1:0); console.log('No frontend UI code found');"" 2>&1" `
  -LogFile "no-frontend-ui-scan.log"

# Step 14: No task031-task040 scan
Run-Step -Name "No Task031-040 Implementation Scan" `
  -Command "node -e ""const fs=require('fs'); const dir='backend/src/tests'; const files=fs.readdirSync(dir).filter(f=>f.includes('task030')||f.includes('task-030')); let leaks=0; for(const f of files){const c=fs.readFileSync(dir+'/'+f,'utf8'); if(/task[-_]?03[1-9]|task[-_]?040/i.test(c)){console.log('LEAK: task031-040 reference in '+f);leaks++}} process.exit(leaks>0?1:0); console.log('No task031-040 references found');"" 2>&1" `
  -LogFile "no-task031-040-scan.log"

# Step 15: No false pass scan
Run-Step -Name "No False Pass Scan" `
  -Command "node -e ""const fs=require('fs'); const dir='.'; const files=fs.readdirSync('backend/src/tests').filter(f=>f.includes('task030')||f.includes('task-030')); let found=0; for(const f of files){const c=fs.readFileSync('backend/src/tests/'+f,'utf8'); if(/\.skip\b|\.todo\b|xit\(|xdescribe\(/g.test(c)){console.log('FALSE PASS RISK: '+f);found++}} process.exit(found>0?1:0); console.log('No false pass markers found');"" 2>&1" `
  -LogFile "no-false-pass-scan.log"

# Write preliminary verification summary
$preSummary = @{
  TaskId = "030"
  TaskName = "Controlled Staging Rehearsal, School Role Token Matrix, Staff Training Pack, and No-Live-Student Release Gate"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}
$preSummaryPath = Join-Path $logDir "task-030-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$preSummaryJson = $preSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($preSummaryPath, $preSummaryJson, $utf8NoBom)
Write-Host "Preliminary verification summary written: $preSummaryPath"

# Step 16: Generate Task 030 report
Run-Step -Name "Generate Task 030 Report" `
  -Command "node scripts/gen-task030-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Write final verification summary
$summary = @{
  TaskId = "030"
  TaskName = "Controlled Staging Rehearsal, School Role Token Matrix, Staff Training Pack, and No-Live-Student Release Gate"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-030-verification-summary.json"
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