# Task 032 Controlled Canary Activation Report

**Generated:** 2026-07-09T00:00:00.000Z

## Activation Status

| Metric | Value |
|--------|-------|
| Task | 032 |
| Scenario | Controlled Canary Dry Run |
| Status | PASS |
| safeToStartTask033 | true |
| Final Decision | ACCEPTED_READY_YES |
| Blocking Issues | None |

## Gate Results

| Gate | Status |
|------|--------|
| Task 031 Proof | PASS |
| Canary Environment Gate | PASS |
| Approved School Canary Config | PASS |
| Consent/Authorization Matrix | PASS |
| Cohort Eligibility | PASS |
| Canary Cap | PASS |
| Privacy Boundary | PASS |
| Activation State Machine | PASS |
| Runtime Guard | PASS |
| AI/Memory Before Gates | PASS |
| Teacher Boundary | PASS |
| Student Boundary | PASS |
| Unknown Role Denial | PASS |
| Monitoring Snapshot | PASS |
| Health Budget | PASS |
| Control Actions | PASS |
| Rollback Proof | PASS |
| Incident Bridge | PASS |
| Socratic Gate | PASS |
| Deen Gate | PASS |
| Curriculum Gate | PASS |

## Privacy Boundary

| Check | Status |
|-------|--------|
| Raw student profiles blocked | PASS |
| Real emails blocked | PASS |
| Real phones blocked | PASS |
| Parent contact data blocked | PASS |
| Raw chat blocked | PASS |
| Raw student answers blocked | PASS |
| Safeguarding raw notes blocked | PASS |
| Private Deen text blocked | PASS |
| Answer keys blocked | PASS |
| Provider prompts/responses blocked | PASS |
| Hidden reasoning blocked | PASS |

## Control Actions Verified

| Action | Status |
|--------|--------|
| Pause | PASS |
| Resume | PASS |
| Kill-switch enable | PASS |
| Kill-switch disable recheck | PASS |
| Rollback start | PASS |
| Rollback completion | PASS |

## Environment Flags

| Flag | Value |
|------|-------|
| TASK032_CONTROLLED_CANARY | 1 |
| TASK032_LIVE_STUDENT_PROTECTION | 1 |

## Test Results

- **Test count:** 27219
- **Passed:** 27219
- **Failed:** 0
- **Skipped:** 2 (pre-existing)

## Artifacts

- JSON report: `reports/task-032-controlled-canary-activation-v1.json`
- Handoff: `docs/ops/task-032/TASK_032_HANDOFF.md`

