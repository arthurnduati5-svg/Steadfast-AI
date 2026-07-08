$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-028"
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

# Step 1: Prisma validate (PostgreSQL schema)
Run-Step -Name "Prisma Validate" `
  -Command "npx prisma validate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-validate.log"

# Step 2: Prisma generate (PostgreSQL client)
Run-Step -Name "Prisma Generate" `
  -Command "npx prisma generate --schema backend/prisma/schema.prisma 2>&1" `
  -LogFile "prisma-generate.log"

# Step 3: Prisma generate (SQLite test client) - optional, catch if fails
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

# Step 6: Task 028 tests
Run-Step -Name "Task 028 Tests" `
  -Command "npx vitest run backend/src/tests/task-028- --reporter=verbose 2>&1" `
  -LogFile "task028-targeted-tests.log"

# Step 7: Acceptance scenario
Run-Step -Name "Task 028 Acceptance Scenario" `
  -Command "npx vitest run backend/src/tests/task-028-acceptance-scenario.test.ts --reporter=verbose 2>&1" `
  -LogFile "acceptance-scenario.log"

# Write preliminary verification summary before report generation
$preSummary = @{
  TaskId = "028"
  TaskName = "Controlled Expansion Execution, Staged Cohort Activation, Live Expansion Monitoring, and Expansion Rollback Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}
$preSummaryPath = Join-Path $logDir "task-028-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$preSummaryJson = $preSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($preSummaryPath, $preSummaryJson, $utf8NoBom)
Write-Host "Preliminary verification summary written: $preSummaryPath"

# Step 8: Generate report
Run-Step -Name "Generate Task 028 Report" `
  -Command "node scripts/gen-task028-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 9: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node -e ""const fs=require('fs'); const p='docs/ops/task-028/task-028-expansion-execution-report.json'; const raw=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''); const r=JSON.parse(raw); const allowed=['TASK_028_PASS_SAFE_TO_START_TASK_029','TASK_028_FAIL_NOT_SAFE_TO_START_TASK_029']; if(r.taskId!=='028') throw new Error('taskId must be 028'); if(typeof r.safeToStartTask029!=='boolean') throw new Error('safeToStartTask029 must be boolean, got '+typeof r.safeToStartTask029); if(!allowed.includes(r.finalDecision)) throw new Error('invalid finalDecision'); if(!Array.isArray(r.blockingIssues)) throw new Error('blockingIssues must be array'); if(!Array.isArray(r.knownLimitations)) throw new Error('knownLimitations must be array'); if(!Array.isArray(r.verificationCommands)) throw new Error('verificationCommands must be array'); if(!Array.isArray(r.testResults)) throw new Error('testResults must be array'); for(const k of['task027Proof','executionRun','stageActivation','expandedParticipants','runtimeGuard','sessionPreflight','monitoringEvents','healthSnapshots','oversightQueue','interventions','rollbackExecution','completionReview','routeProtection','privacyLeakChecks','securityGateChecks','deenGateChecks','socraticGateChecks','curriculumGateChecks','persistence','acceptanceScenario']) if(!(k in r)) throw new Error('missing '+k); const text=JSON.stringify(r); const forbidden=[{p:'Bearer ',n:'Bearer'},{p:'postgres://',n:'postgres'},{p:'postgresql://',n:'postgresql'},{p:'mysql://',n:'mysql'},{p:'sk-proj-',n:'sk-proj- (OpenAI key)'},{p:'raw student chat',n:'raw student chat'},{p:'private learner memory',n:'private learner memory'},{p:'teacher-only notes',n:'teacher-only notes'},{p:'safeguarding raw details',n:'safeguarding raw details'},{p:'Deen-sensitive private text',n:'Deen-sensitive private text'},{p:'AI prompt',n:'AI prompt'},{p:'provider response',n:'provider response'},{p:'answer key',n:'answer key'},{p:'teacher-only content',n:'teacher-only content'},{p:'protected rubric',n:'protected rubric'}]; for(const f of forbidden){ if(text.includes(f.p)) throw new Error('forbidden phrase found: '+f.n); } console.log('TASK_028_REPORT_VALIDATION_PASS');"" 2>&1" `
  -LogFile "json-validation.log"

# Step 10: Privacy leak scan
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task028-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Update verification summary with all steps
$summary = @{
  TaskId = "028"
  TaskName = "Controlled Expansion Execution, Staged Cohort Activation, Live Expansion Monitoring, and Expansion Rollback Proof"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-028-verification-summary.json"
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
