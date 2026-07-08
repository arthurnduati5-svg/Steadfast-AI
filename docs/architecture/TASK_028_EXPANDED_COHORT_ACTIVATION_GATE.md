# Task 028 — Expanded Cohort Activation Gate

## Purpose

The Expanded Cohort Activation Gate validates that a cohort is ready for activation before the runtime transitions from `Approved` to `Activating`.

## Gate Requirements

| Requirement | Description |
|---|---|
| `cohortExists` | Target cohort must exist in the system |
| `cohortNotAlreadyActivated` | Cohort must not already be active |
| `cohortWithinPlanBounds` | Cohort must be listed in the approved plan |
| `learnerCountWithinLimit` | Learner count must not exceed `maxLearnersPerCohort` |
| `activationScheduleValid` | Current time must match the activation schedule |
| `teacherOversightConfigured` | At least one teacher oversight email must be present |

## Denial Reasons

| Reason | Meaning |
|---|---|
| `COHORT_NOT_FOUND` | Cohort does not exist |
| `COHORT_ALREADY_ACTIVE` | Cohort is already in active state |
| `COHORT_NOT_IN_PLAN` | Cohort is not part of the approved expansion plan |
| `LEARNER_LIMIT_EXCEEDED` | Learner count exceeds plan limit |
| `SCHEDULE_MISMATCH` | Current time is outside the activation schedule |
| `NO_TEACHER_OVERSIGHT` | No teacher oversight email configured |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Validate cohort readiness | **Yes** |
| Return denial reasons | **Yes** |
| Log gate results to ledger | **Yes** |
| Build Task 029 operations console | **No** |
| Build staging rehearsal environment | **No** |
| Build canary analysis | **No** |
| Build rollout orchestration | **No** |
| Build school-wide launch | **No** |
| Build frontend UI | **No** |
| Send real communication | **No** |
| Deploy to production | **No** |
| Call live AI models | **No** |
| Write live school connectors | **No** |

## Implementation

Cohort activation gate logic lives in `src/expansion/gates/cohort-activation-gate.ts`.

## References

- `TASK_028_EXPANSION_EXECUTION_STATE_MACHINE.md`
- `TASK_028_EXPANDED_LEARNER_ACCESS_GATE.md`
- `TASK_028_EXPANDED_RUNTIME_GUARD.md`
