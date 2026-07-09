# Task 034 Controlled Rollout Report

**Generated:** 2026-06-29T11:09:43.737Z
**Branch:** main
**Commit:** 16bf88679c8b120912cd600e53722dd0768e3e6f
**safeToStartTask035:** true
**Final Decision:** TASK_034_PASS_SAFE_TO_START_TASK_035

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
