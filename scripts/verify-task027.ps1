$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path (Join-Path $rootDir "logs") "task-027"
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

# Step 3: Prisma generate (SQLite test client)
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

# Step 6: Task 027 targeted tests (including acceptance scenario)
Run-Step -Name "Task 027 Tests" `
  -Command "npx vitest run backend/src/tests/task-027- --reporter=verbose 2>&1" `
  -LogFile "task027-targeted-tests.log"

# Step 7: Write preliminary verification summary before report generation
$preSummary = @{
  TaskId = "027"
  TaskName = "Controlled Pilot Expansion Governance, Evidence-Based Scale Decision, Teacher Review Loop, and Expansion Safety Gates"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}
$preSummaryPath = Join-Path $logDir "task-027-verification-summary.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$preSummaryJson = $preSummary | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($preSummaryPath, $preSummaryJson, $utf8NoBom)
Write-Host "Preliminary verification summary written: $preSummaryPath"

# Step 8: Generate report (now reads verification summary + acceptance scenario)
Run-Step -Name "Generate Task 027 Report" `
  -Command "node scripts/gen-task027-report.cjs 2>&1" `
  -LogFile "report-generation.log"

# Step 9: JSON report validation
Run-Step -Name "JSON Report Validation" `
  -Command "node -e ""const fs=require('fs'); const p='docs/ops/task-027/task-027-pilot-expansion-report.json'; const raw=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''); const r=JSON.parse(raw); const allowed=['TASK_027_PASS_SAFE_TO_START_TASK_028','TASK_027_FAIL_NOT_SAFE_TO_START_TASK_028']; if(r.taskId!=='027') throw new Error('taskId must be 027'); if(typeof r.safeToStartTask028!=='boolean') throw new Error('safeToStartTask028 must be boolean, got '+typeof r.safeToStartTask028); if(!allowed.includes(r.finalDecision)) throw new Error('invalid finalDecision'); if(!Array.isArray(r.blockingIssues)) throw new Error('blockingIssues must be array'); if(!Array.isArray(r.knownLimitations)) throw new Error('knownLimitations must be array'); if(!Array.isArray(r.verificationCommands)) throw new Error('verificationCommands must be array'); if(!Array.isArray(r.testResults)) throw new Error('testResults must be array'); for(const k of ['expansionProposal','evidencePack','riskAssessment','reviewWorkflow','decisionService','cohortChange','routeProtection','privacyLeakChecks','securityGateChecks','deenGateChecks','socraticGateChecks','curriculumGateChecks','rollbackReadiness','persistence','acceptanceScenario']) if(!(k in r)) throw new Error('missing '+k); const text=JSON.stringify(r); const forbidden=[{p:'Bearer ',n:'Bearer'},{p:'postgres://',n:'postgres'},{p:'postgresql://',n:'postgresql'},{p:'mysql://',n:'mysql'},{p:'sk-proj-',n:'sk-proj- (OpenAI key)'},{p:'raw student chat',n:'raw student chat'},{p:'private learner memory',n:'private learner memory'},{p:'teacher-only notes',n:'teacher-only notes'},{p:'safeguarding raw details',n:'safeguarding raw details'},{p:'Deen-sensitive private text',n:'Deen-sensitive private text'},{p:'provider response',n:'provider response'},{p:'AI prompt',n:'AI prompt'}]; for(const f of forbidden){ if(text.includes(f.p)) throw new Error('forbidden phrase found: '+f.n); } console.log('TASK_027_REPORT_VALIDATION_PASS');"" 2>&1" `
  -LogFile "json-validation.log"

# Step 10: Privacy leak scan on generated artifacts
Run-Step -Name "Privacy Leak Scan" `
  -Command "node scripts/task027-privacy-scan.cjs 2>&1" `
  -LogFile "privacy-scan.log"

# Update verification summary with all steps including report generation and validation
$summary = @{
  TaskId = "027"
  TaskName = "Controlled Pilot Expansion Governance, Evidence-Based Scale Decision, Teacher Review Loop, and Expansion Safety Gates"
  GeneratedAt = (Get-Date -Format "o")
  OverallResult = if ($global:overallExit -eq 0) { "PASS" } else { "FAIL" }
  OverallExitCode = $global:overallExit
  Steps = $global:results
  LogDirectory = $logDir
}

$summaryPath = Join-Path $logDir "task-027-verification-summary.json"
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
