# Task 034 Controlled Limited Rollout Report

**Generated:** 2026-07-10T00:00:00.000Z
**Branch:** main
**Commit:** a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
**safeToStartTask035:** true
**safeToStartTask040:** false
**Final Decision:** TASK_034_PASS_SAFE_TO_START_TASK_035
**Verdict:** ACCEPTED_READY_YES

## Gates Summary

| Gate | Status |
|------|--------|
| Task 033 Proof | PASS |
| Controlled Rollout Config | PASS |
| Rollout Cap | PASS |
| Expanded Cohort Eligibility | PASS |
| Staff Readiness | PASS |
| Learner Notice Readiness | PASS |
| Activation State Machine | PASS |
| Expanded Runtime Guard | PASS |
| Expanded Privacy Boundary | PASS |
| Health Budget | PASS |
| Canary Baseline Comparison | PASS |
| Expanded Monitoring Snapshot | PASS |
| Teacher/Admin Review | PASS |
| Student Safe Feedback | PASS |
| Incident Rollback Bridge | PASS |
| Rollback Proof | PASS |
| Socratic Integrity | PASS |
| Deen Governance | PASS |
| Curriculum/Source | PASS |
| Role Boundary | PASS |
| Post-Limited-Rollout Decision | PASS |

**Blocking Issues:** None

## Rollout Scope Summary

| Check | Value |
|-------|-------|
| Rollout Percent | 20% (cap: 25%) |
| Student Count | 80 (cap: 100) |
| School-Wide Launch Blocked | yes |
| 100% Rollout Blocked | yes |
| Open Registration Blocked | yes |
| Unknown Cohort Blocked | yes |

## Verification Commands

| Command | Exit Code | Result |
|---------|-----------|--------|
| task-034-proof-loader-test... | 0 | PASS |
| controllled-rollout-environment-gate... | 0 | PASS |
| privacy-safe-evidence-precheck... | 0 | PASS |
| npx prisma validate --schema backend/prisma/schema.prisma... | 0 | PASS |
| npx prisma generate --schema backend/prisma/schema.prisma... | 0 | PASS |
| npx prisma generate --schema backend/prisma/schema.test.sqlite.prisma... | 0 | PASS |
| npx tsc --noEmit -p backend/tsconfig.json... | 0 | PASS |
| npx tsc -p backend/tsconfig.json... | 0 | PASS |
| node scripts/run-task034-controlled-rollout.cjs... | 0 | PASS |
| node scripts/gen-task034-report.cjs... | 0 | PASS |
| npx vitest run backend/src/tests/task-034- --reporter=verbose... | 0 | PASS |

## Report Artifacts

- **JSON report:** docs/ops/task-034/task-034-controlled-limited-rollout-report.json
- **Handoff:** docs/ops/task-034/TASK_034_HANDOFF.md
- **Verification logs:** logs/task-034/
