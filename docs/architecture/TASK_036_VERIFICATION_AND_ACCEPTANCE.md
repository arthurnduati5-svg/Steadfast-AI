# Task 036: Verification and Acceptance

## Identity

- **Task:** 036
- **Component:** Verification and Acceptance
- **Type:** Backend-only verification and acceptance framework

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Define the verification and acceptance criteria for Task 036. All gates must pass, all scans must pass, and the report must be internally consistent for the task to be accepted.

## Acceptance Criteria

### Mandatory Gates

| Gate | Required Status |
|------|-----------------|
| Task 035 Dependency Gate | PASS |
| Launch Environment Gate | PASS |
| Launch Window Control | PASS |
| Launch Approval | PASS |
| Single School Scope Guard | PASS |
| Runtime Monitoring Readiness | PASS |
| Health/Incident/Pause/Rollback/Kill-Switch Readiness | PASS |
| Privacy/Content/Socratic/Deen Boundaries | PASS |
| Safe Launch Read Model (no mutation) | PASS |
| No Public / No Multi-School / No Backend Freeze Boundaries | PASS |

### Required Verification Script Steps

| Step | Expected Exit Code |
|------|-------------------|
| Task 035 dependency proof validation | 0 |
| Launch environment gate | 0 |
| Launch window validation | 0 |
| Launch approval check | 0 |
| Single school scope check | 0 |
| Runtime monitoring check | 0 |
| Health/incident/pause/rollback/kill-switch check | 0 |
| Privacy/content/Socratic/Deen boundaries check | 0 |
| Prisma validate | 0 |
| Prisma generate | 0 |
| TypeScript typecheck | 0 |
| TypeScript build | 0 |
| Task 036 runner | 0 |
| Report generation | 0 |
| JSON validation | 0 |
| Privacy scan | 0 |
| Final JSON validation | 0 |
| Final privacy scan | 0 |

### Required Test Results

| Test | Minimum |
|------|---------|
| Test count | >= 1 |
| Passed | >= 1 |
| Failed | 0 |

### Required Scan Results

| Scan | Required |
|------|----------|
| Privacy leak scan | No critical findings |
| JSON validation | All checks pass |

### Required Report Fields

See the JSON report specification in `TASK_036_CONTROLLED_LIVE_SCHOOL_LAUNCH_RUNTIME.md` for the complete list of required fields.

## Acceptance Decision

If all gates pass AND all verification steps pass AND all scans pass AND safeToStartTask040 is true:
- `verdict`: `"ACCEPTED_READY_YES"`
- `safeToStartTask040`: `true`
- `remainingBlockers`: `[]`

Otherwise:
- `verdict`: `"NOT_ACCEPTED"`
- `safeToStartTask040`: `false`
- `remainingBlockers`: list of blocking issues

## Files That Must Be Created or Updated

| Category | Files |
|----------|-------|
| Architecture docs | 12 files in `docs/architecture/TASK_036_*.md` |
| Ops docs | `docs/ops/task-036/TASK_036_HANDOFF.md`, `docs/ops/task-036/TASK_036_LIVE_SCHOOL_LAUNCH_REPORT.md`, `docs/ops/task-036/task-036-live-school-launch-report.json` |
| Reports | `reports/task-036-live-school-launch-v1.md`, `reports/task-036-live-school-launch-v1.json` |
| Scripts | `scripts/verify-task036.ps1`, `scripts/gen-task036-report.cjs`, `scripts/task036-json-validate.cjs`, `scripts/task036-privacy-scan.cjs`, `scripts/run-task036-live-school-launch.cjs` |

## Verification Artifacts

- Verification summary: `logs/task-036/task-036-verification-summary.json`
- Runner result: `logs/task-036/live-school-launch-result.json`
- JSON report: `docs/ops/task-036/task-036-live-school-launch-report.json`
- Markdown report: `docs/ops/task-036/TASK_036_LIVE_SCHOOL_LAUNCH_REPORT.md`
- Handoff: `docs/ops/task-036/TASK_036_HANDOFF.md`
- Reports: `reports/task-036-live-school-launch-v1.json`, `reports/task-036-live-school-launch-v1.md`
