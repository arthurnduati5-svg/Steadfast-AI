# Task 028 — Expanded Runtime Guard

## Purpose

The Expanded Runtime Guard checks every runtime action during the `Active` state. It acts as the final safety layer before any action is executed.

## Guard Checks

| Check | Description |
|---|---|
| `actionWithinPlan` | The action must be defined in the approved expansion plan |
| `cohortIsActive` | The action's cohort must be in `Active` state |
| `learnerAccessGranted` | The learner must have passed the access gate |
| `healthNotViolated` | Current health snapshot must be within thresholds |
| `noActiveIncident` | No incident must be currently active |
| `teacherOversightActive` | Teacher oversight bridge must be operational |

## Violation Actions

| Violation | Action |
|---|---|
| Action not in plan | Reject, log evidence, trigger incident |
| Cohort not active | Reject, log evidence |
| Learner not granted access | Reject, log evidence |
| Health threshold violated | Reject, log evidence, trigger incident |
| Active incident exists | Reject, log evidence |
| Teacher oversight offline | Reject, log evidence, trigger incident |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Validate all runtime actions | **Yes** |
| Reject violations | **Yes** |
| Trigger incident on violations | **Yes** |
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

Runtime guard logic lives in `src/expansion/gates/runtime-guard.ts`.

## References

- `TASK_028_EXPANSION_EXECUTION_STATE_MACHINE.md`
- `TASK_028_EXPANDED_COHORT_ACTIVATION_GATE.md`
- `TASK_028_EXPANDED_LEARNER_ACCESS_GATE.md`
- `TASK_028_TEACHER_OVERSIGHT_BRIDGE.md`
