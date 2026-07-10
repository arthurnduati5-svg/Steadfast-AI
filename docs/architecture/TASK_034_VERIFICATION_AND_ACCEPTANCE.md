# Task 034 — Verification and Acceptance

## Purpose

This document describes the verification and acceptance criteria for Task 034. All gates must pass before `safeToStartTask035` is set to `true`.

## Core Constraints

- Task 034 is backend-only
- Task 034 is limited rollout only
- Task 034 does not launch school-wide
- Task 034 does not run 100 percent rollout
- Task 034 does not freeze backend
- Task 034 does not create frontend UI
- Task 034 does not deploy
- Task 034 does not send real notifications
- Task 034 does not call live AI
- Task 034 does not write live connectors
- Task 034 does not expose raw learner data
- Task 034 does not expose raw Deen/private/safeguarding/answer/provider data

## Verification Script

The `verify-task034.ps1` PowerShell script runs the full verification pipeline:

| Step | Check | Fail Condition |
|---|---|---|
| 1 | Task 033 dependency proof | Report missing or verdict not ACCEPTED_READY_YES |
| 2 | TypeScript noEmit check | TypeScript errors found |
| 3 | Backend build | Build fails |
| 4 | Prisma validate | Schema validation fails |
| 5 | Prisma generate | Client generation fails |
| 6 | Task 034 focused tests (matching task-034-* and task034-*) | Tests fail |
| 7 | Task 020-033 regression | Skipped (covered by full suite) |
| 8 | Phase 3 regression | Covered by full suite |
| 9 | Task 034 route contracts | Route contract tests fail |
| 10 | Role/security tests | Role/security tests fail |
| 11 | No-* safety tests | Safety tests fail |
| 12 | Continuity tests | Continuity tests fail |
| 13 | Full backend suite | Backend suite fails |
| 14 | JSON report validation | Report schema invalid |
| 15 | Privacy scan | Forbidden patterns found |
| 16 | No production mutation scan | Mutations found in task034 files |
| 17 | No live AI/connector scan | Live patterns found |
| 18 | No live notification scan | Notification patterns found |
| 19 | No frontend UI scan | Frontend patterns found in backend |
| 20 | No Task035/040 scan | Future task references found |
| 21 | No 100 percent rollout scan | 100% rollout patterns found |
| 22 | No false pass scan | False pass indicators found |
| 23 | Report truth check | Report inconsistencies found |

## Report Generation

After verification, `gen-task034-report.cjs` generates:
- `reports/task-034-controlled-limited-rollout-v1.json`
- `reports/task-034-controlled-limited-rollout-v1.md`
- `docs/ops/task-034/task-034-controlled-limited-rollout-report.json`
- `docs/ops/task-034/TASK_034_CONTROLLED_LIMITED_ROLLOUT_REPORT.md`
- `docs/ops/task-034/TASK_034_HANDOFF.md`

## Acceptance Criteria

| Criterion | Requirement |
|---|---|
| All verification steps pass | Exit code 0 |
| JSON report validates | Schema valid, all gates present |
| Privacy scan passes | No critical findings |
| No school-wide/100% rollout/freeze | Scans confirm boundary respected |
| No frontend UI in backend | Scans confirm no frontend patterns |
| No live AI/connector/notification | Scans confirm no live patterns |
| No Task035/040 references | Scans confirm no future task references |
| safeToStartTask035 | `true` when all criteria met |
| safeToStartTask040 | `false` (deferred to later) |
| verdict | `ACCEPTED_READY_YES` when all criteria met |
| remainingBlockers | Empty array when all criteria met |

## Report Truth Check

The final JSON report must pass all validations:
- All boolean gates are `true`
- All no-* fields are `false`
- `safeToStartTask035` matches `verdict`
- `remainingBlockers` is empty when `verdict` is `ACCEPTED_READY_YES`
- No stale template tokens
- No forbidden private data patterns
- No false pass indicators
