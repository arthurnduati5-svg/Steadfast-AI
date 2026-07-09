# Task 030 — Operations Runbook

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## 1. System Overview

The Controlled Staging Rehearsal Runtime orchestrates a synthetic dry-run validation of expansion operations. It depends on Task 029 proof and enforces a staging environment gate and no-live-student guard. All operations are dry-run only.

### Quick Reference

| Item | Value |
|------|-------|
| Base path | `/api/v1/rehearsal` |
| Health check | `GET /api/v1/rehearsal/health` |
| Documentation | `docs/architecture/TASK_030_*.md` |
| Dependency | Task 029 proof (must be accepted) |

---

## 2. Prerequisites

- [ ] Task 029 report exists at `docs/ops/task-029/task-029-expansion-operations-console-report.json`
- [ ] Task 029 `safeToStartTask030` is `true`
- [ ] Git commits `2ef56aa` and `4e3ed4c` are reachable
- [ ] Environment variables are set (see section 3)

---

## 3. Environment Setup

```powershell
$env:TASK030_STAGING_REHEARSAL = "1"
$env:TASK030_NO_LIVE_STUDENTS = "1"
$env:NODE_ENV = "development"
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TASK030_STAGING_REHEARSAL` | — | Must be `"1"` to enable rehearsal mode |
| `TASK030_NO_LIVE_STUDENTS` | — | Must be `"1"` to block live student data |
| `NODE_ENV` | `development` | Must NOT be `"production"` |

---

## 4. Task 029 Dependency Gate

### Check Gate Status

```bash
curl -s http://localhost:4001/api/v1/rehearsal/health | jq .
```

Response when blocked:

```json
{
  "status": "degraded",
  "task029DependencyGate": "blocked",
  "stagingEnvironmentGate": "unknown",
  "details": {
    "reportFound": false,
    "safeToStartTask030": false
  }
}
```

### Verify Task 029 Proof

```bash
node -e "
const fs = require('fs');
const p = 'docs/ops/task-029/task-029-expansion-operations-console-report.json';
const r = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
if (r.taskId !== '029') process.exit(1);
if (r.safeToStartTask030 !== true) process.exit(2);
if (r.finalDecision !== 'TASK_029_PASS_SAFE_TO_START_TASK_030') process.exit(3);
console.log('TASK_029_PROOF_VALID');
process.exit(0);
"
```

---

## 5. Staging Environment Gate

### Verify Gate

```bash
node -e "
const ok = process.env.TASK030_STAGING_REHEARSAL === '1'
  && process.env.TASK030_NO_LIVE_STUDENTS === '1'
  && process.env.NODE_ENV !== 'production';
console.log('TASK030_STAGING_REHEARSAL:' + (process.env.TASK030_STAGING_REHEARSAL || 'not_set'));
console.log('TASK030_NO_LIVE_STUDENTS:' + (process.env.TASK030_NO_LIVE_STUDENTS || 'not_set'));
console.log('NODE_ENV:' + (process.env.NODE_ENV || 'not_set'));
process.exit(ok ? 0 : 1);
"
```

---

## 6. Running the Full Rehearsal

```bash
# From project root, after environment setup
node scripts/run-task030-staging-rehearsal.cjs
```

Exit code 0 = PASS. Check `logs/task-030/staging-rehearsal.log` for details.

---

## 7. Running Journey Rehearsals Individually

```bash
# Synthetic fixture and role matrix
node -e "
const fixture = require('./backend/src/tests/fixtures/task030SyntheticSchoolFixture');
const school = fixture.loadSyntheticSchoolFixture();
console.log('School:', school.name);
console.log('Admins:', school.admins.length);
console.log('Teachers:', school.teachers.length);
console.log('Learners:', school.learners.length);
process.exit(0);
"
```

---

## 8. Dry-Run Console Operations

| Operation | Method | Path | Token Required |
|-----------|--------|------|---------------|
| View dashboard | GET | `/api/v1/rehearsal/console/dashboard` | admin/operator |
| View stages | GET | `/api/v1/rehearsal/console/stages` | admin/operator |
| View health | GET | `/api/v1/rehearsal/console/health` | admin/operator |
| View timeline | GET | `/api/v1/rehearsal/console/timeline` | admin/operator |
| View oversight | GET | `/api/v1/rehearsal/console/oversight` | admin/operator |
| Dry-run pause | POST | `/api/v1/rehearsal/action/pause` | admin/operator |
| Dry-run resume | POST | `/api/v1/rehearsal/action/resume` | admin/operator |
| Dry-run kill-switch | POST | `/api/v1/rehearsal/action/kill-switch/enable` | admin/operator |
| Dry-run kill-switch disable | POST | `/api/v1/rehearsal/action/kill-switch/disable` | admin/operator |
| Dry-run rollback | POST | `/api/v1/rehearsal/action/rollback` | admin/operator |

---

## 9. Evidence and Report Generation

### Capture Evidence

```bash
curl -s -X POST http://localhost:4001/api/v1/rehearsal/evidence/capture
```

### Generate Report

```bash
curl -s -X POST http://localhost:4001/api/v1/rehearsal/report/generate
```

### Export Report

```bash
curl -s http://localhost:4001/api/v1/rehearsal/report/export?format=json
```

---

## 10. Verification Summary

### Run Complete Verification

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-task030.ps1
```

### Expected Exit Codes

| Step | Exit Code | Pass Condition |
|------|-----------|---------------|
| Task 029 Proof Validation | 0 | PASS |
| Staging Environment Gate | 0 | PASS |
| No-Live-Student Guard | 0 | PASS |
| Prisma Validate | 0 | PASS |
| Backend Typecheck | 0 | PASS |
| Backend Build | 0 | PASS |
| Backend Tests (task-030-*) | 0 | PASS |
| Controlled Staging Rehearsal | 0 | PASS |
| Training Docs Validation | 0 | PASS |
| Privacy Scan | 0 | PASS |
| Report Generation | 0 | PASS |
| JSON Validation | 0 | PASS |

---

## 11. Post-Rehearsal Checklist

- [ ] Verification script exit code is 0
- [ ] All test files pass (17 test files, all results PASS)
- [ ] JSON report generated: `docs/ops/task-030/task-030-staging-rehearsal-report.json`
- [ ] Markdown report generated: `docs/ops/task-030/TASK_030_STAGING_REHEARSAL_REPORT.md`
- [ ] Handoff generated: `docs/ops/task-030/TASK_030_HANDOFF.md`
- [ ] JSON report in `reports/` directory: `reports/task-030-controlled-staging-rehearsal-v1.json`
- [ ] Markdown report in `reports/`: `reports/task-030-controlled-staging-rehearsal-v1.md`
- [ ] Evidence ledger entries recorded
- [ ] Privacy scan passes
- [ ] All blocking issues resolved
- [ ] Verdict recorded: `ACCEPTED_READY_YES`
- [ ] `safeToStartTask031` = `true`
- [ ] Final decision consistent

---

## 12. Troubleshooting

### "TASK029_DEPENDENCY_GATE_BLOCKED"

**Cause**: Task 029 proof not found or not valid.
**Fix**: Verify Task 029 report exists and `safeToStartTask030: true`, `finalDecision: TASK_029_PASS_SAFE_TO_START_TASK_030`.

### "STAGING_GATE_BLOCKED"

**Cause**: Environment variables not set correctly or NODE_ENV is production.
**Fix**: Set `TASK030_STAGING_REHEARSAL=1`, `TASK030_NO_LIVE_STUDENTS=1`, ensure `NODE_ENV` is not `production`.

### "NO_LIVE_STUDENT_GUARD_BLOCKED"

**Cause**: Live data detected in fixtures or database URL is production-like.
**Fix**: Ensure all fixture IDs use `task030_safe_` prefix and database URL is not production.

### "JOURNEY_FAILED"

**Cause**: Journey step returned unexpected result.
**Fix**: Check journey rehearsal logs. Verify permission matrix.

### "ROLLBACK_DRILL_FAILED"

**Cause**: Rollback drill validation not met.
**Fix**: Verify audit preservation, safe summary generation, and no destructive deletion.

### Privacy scan detects possible leak

**Cause**: Log or report may contain non-synthetic data.
**Fix**: Review privacy scan output. Remove any real data.