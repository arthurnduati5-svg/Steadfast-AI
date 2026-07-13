# Task 036: Task 035 Dependency Gate

## Identity

- **Task:** 036
- **Gate:** Task 035 Dependency Gate
- **Type:** Backend-only pre-launch gate

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Ensure Task 035 (Controlled School-Wide Readiness Gate) completed successfully and earned `safeToStartTask036: true` before Task 036 begins any launch work.

## Gate Logic

The gate reads the Task 035 report (`docs/ops/task-035/task-035-school-wide-readiness-report.json`) and validates:

| Check | Expected Value |
|-------|---------------|
| `taskId` | `"035"` |
| `safeToStartTask036` | `true` |
| `finalDecision` | `"TASK_035_PASS_SAFE_TO_START_TASK_036"` |
| `blockingIssues` | `[]` (empty array) |
| Release board package generated | `true` |

## Failure Behavior

If the Task 035 dependency gate fails:
- Task 036 launch MUST NOT start
- A clear error message is logged
- The verification script exits with code 1
- The report records `task035DependencyGatePassed: false`

## Verification

The dependency gate is verified by:
1. `scripts/run-task036-live-school-launch.cjs` — loads Task 035 report and validates
2. `scripts/verify-task036.ps1` — includes a dedicated verification step
3. `scripts/gen-task036-report.cjs` — records gate result in the report

## Files Checked

- `docs/ops/task-035/task-035-school-wide-readiness-report.json`
- `docs/ops/task-035/TASK_035_HANDOFF.md` (exists check)
- `logs/task-035/task-035-verification-summary.json`
- `logs/task-035/school-wide-readiness-result.json`
