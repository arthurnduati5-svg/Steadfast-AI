param(
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot
$exitCode = 0

function Check {
  param($Name, $ScriptBlock)
  try {
    & $ScriptBlock
    if (-not $Quiet) { Write-Host "  $Name : PASS" -ForegroundColor Green }
  } catch {
    Write-Host "  $Name : FAIL - $_" -ForegroundColor Red
    $script:exitCode = 1
  }
}

function Run-Command {
  param($Command)
  $result = cmd /c "$Command 2>&1"
  $global:runOk = $LASTEXITCODE -eq 0
  return $result
}

Write-Host "=== Task 040 Backend Freeze Verification ===" -ForegroundColor Cyan
Write-Host ""

# 1. TypeScript check
Check "TypeScript check" {
  $r = Run-Command "npx tsc -p $ROOT\backend\tsconfig.json --noEmit --incremental false"
  if (-not $global:runOk) { throw "TypeScript check failed" }
}

# 2. Backend build
Check "Backend build" {
  $r = Run-Command "npm --prefix $ROOT\backend run build"
  if (-not $global:runOk) { throw "Backend build failed" }
}

# 3. Prisma validate
Check "Prisma validate" {
  $r = Run-Command "npx prisma validate --schema=$ROOT\backend\prisma\schema.prisma"
  if (-not $global:runOk) { throw "Prisma validate failed" }
}

# 4. Prisma generate
Check "Prisma generate" {
  $r = Run-Command "npx prisma generate --schema=$ROOT\backend\prisma\schema.prisma"
  if (-not $global:runOk) { throw "Prisma generate failed" }
}

# 5. Report exists
Check "Report exists" {
  $rp = $ROOT + "\reports\task-040-final-backend-logic-freeze-v1.json"
  if (-not (Test-Path -LiteralPath $rp)) { throw "Report not found at $rp" }
}

# 6. Report validates
Check "Report JSON validation" {
  $r = Run-Command "node $ROOT\scripts\task040-json-validate.cjs"
  if (-not $global:runOk) { throw "JSON validation failed" }
}

# 7. Privacy scan
Check "Privacy scan" {
  $r = Run-Command "node $ROOT\scripts\task040-privacy-scan.cjs"
  if (-not $global:runOk) { throw "Privacy scan failed" }
}

# 8. Freeze contracts exist
Check "Freeze contracts exist" {
  $p = $ROOT + "\backend\src\contracts\task040BackendFreezeContracts.ts"
  if (-not (Test-Path -LiteralPath $p)) { throw "Contracts not found at $p" }
}

# 9. Validation exists
Check "Validation exists" {
  $p = $ROOT + "\backend\src\lib\task040BackendFreezeValidation.ts"
  if (-not (Test-Path -LiteralPath $p)) { throw "Validation not found at $p" }
}

# 10. Repository exists
Check "Repository exists" {
  $p = $ROOT + "\backend\src\repositories\task040BackendFreezeRepository.ts"
  if (-not (Test-Path -LiteralPath $p)) { throw "Repository not found at $p" }
}

# 11. Services count
Check "Services exist (18+)" {
  $sd = $ROOT + "\backend\src\services"
  $count = (Get-ChildItem -LiteralPath $sd -Filter "task040*.ts").Count
  if ($count -lt 18) { throw "Expected 18+ services, found $count" }
}

# 12. Routes exist
Check "Routes exist" {
  $p = $ROOT + "\backend\src\routes\task040BackendFreezeRoutes.ts"
  if (-not (Test-Path -LiteralPath $p)) { throw "Routes not found at $p" }
}

# 13. Index.ts has task040 mount
Check "Index.ts mount exists" {
  $ip = $ROOT + "\backend\src\index.ts"
  $content = Get-Content -LiteralPath $ip -Raw
  if ($content -notmatch "task040BackendFreezeRoutes") { throw "task040 route not mounted in index.ts" }
}

# 14. Test files count (45+)
Check "Test files (45+)" {
  $td = $ROOT + "\backend\src\tests"
  $count1 = (Get-ChildItem -LiteralPath $td -Filter "*-040*").Count
  $count2 = (Get-ChildItem -LiteralPath $td -Filter "task040*").Count
  $total = $count1 + $count2
  if ($total -lt 45) { throw "Expected 45+ test files, found $total" }
}

# 15. No out-of-scope artifacts - target only actual implementation patterns
Check "No out-of-scope artifacts" {
  $forbidden = @()
  $serviceFiles = Get-ChildItem -LiteralPath ($ROOT + "\backend\src\services") -Filter "task040*.ts"
  foreach ($f in $serviceFiles) {
    $content = Get-Content -LiteralPath $f.FullName -Raw
    if ($content -match "import.*from.*prisma") {
      $forbidden += "$($f.Name): prisma import"
    }
  }
  if ($forbidden.Count -gt 0) { throw "Forbidden patterns found: $($forbidden -join '; ')" }
}

# 16. No dirty staged files
Check "Git staging is clean" {
  Push-Location $ROOT
  $staged = & "git.exe" diff --cached --name-only 2>&1
  Pop-Location
  if ($LASTEXITCODE -ne 0) { throw "Git command failed" }
  if ($staged) { throw "Files are already staged: $staged" }
}

Write-Host ""
if ($exitCode -eq 0) {
  Write-Host "=== ALL 16 CHECKS PASSED ===" -ForegroundColor Green
  Write-Host "Verdict: ACCEPTED_READY_YES" -ForegroundColor Green
} else {
  Write-Host "=== $exitCode CHECK(S) FAILED ===" -ForegroundColor Red
}

exit $exitCode
