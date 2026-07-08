# Task 028 — Expanded Learner Access Gate

## Purpose

The Expanded Learner Access Gate validates each learner access attempt during the `Active` state. It ensures individual learners meet all requirements before being granted access to the expanded runtime.

## Gate Requirements

| Requirement | Description |
|---|---|
| `learnerExists` | Learner must exist in the system |
| `learnerInCohort` | Learner must belong to an activated cohort |
| `learnerNotAlreadyAccessing` | Learner must not already have active access |
| `cohortIsActive` | The learner's cohort must be in `Active` state |
| `learnerCountWithinPlanLimit` | Total active learners must not exceed plan limit |

## Denial Reasons

| Reason | Meaning |
|---|---|
| `LEARNER_NOT_FOUND` | Learner does not exist |
| `LEARNER_NOT_IN_COHORT` | Learner is not a member of the target cohort |
| `LEARNER_ALREADY_ACCESSING` | Learner already has active access |
| `COHORT_NOT_ACTIVE` | Learner's cohort is not in `Active` state |
| `LEARNER_LIMIT_REACHED` | Plan's max learner count would be exceeded |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Validate learner access | **Yes** |
| Return denial reasons | **Yes** |
| Log access attempts to ledger | **Yes** |
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

Learner access gate logic lives in `src/expansion/gates/learner-access-gate.ts`.

## References

- `TASK_028_EXPANSION_EXECUTION_STATE_MACHINE.md`
- `TASK_028_EXPANDED_COHORT_ACTIVATION_GATE.md`
- `TASK_028_EXPANDED_RUNTIME_GUARD.md`
