# Task 028 — Incident and Rollback Execution

## Purpose

Documents the incident bridge that pauses the runtime and the rollback execution mechanism that undoes an expansion when intervention thresholds are violated.

## Incident Bridge

When the runtime guard or health intervention triggers an incident:

1. Runtime transitions to `Incident` state
2. All runtime actions are paused
3. Incident details are recorded to the evidence ledger
4. Rollback is queued if critical threshold was violated

## Rollback Execution

When rollback is executed:

| Step | Description |
|---|---|
| 1. Lock state | Prevent any new actions |
| 2. Revoke learner access | Remove expanded learner access |
| 3. Deactivate cohorts | Return cohorts to pre-expansion state |
| 4. Record rollback evidence | Log all rollback actions to ledger |
| 5. Transition to RolledBack | State machine moves to RolledBack |

## No Automatic Rollback

Rollback is never automatic. It requires an explicit command through the incident bridge.

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Detect incidents | **Yes** |
| Pause runtime on incident | **Yes** |
| Execute rollback on command | **Yes** |
| Record rollback evidence | **Yes** |
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

Incident and rollback logic lives in `src/expansion/incident/` and `src/expansion/rollback.ts`.

## References

- `TASK_028_EXPANSION_EXECUTION_STATE_MACHINE.md`
- `TASK_028_EXPANDED_RUNTIME_GUARD.md`
- `TASK_028_EXPANSION_HEALTH_AND_INTERVENTION.md`
- `TASK_028_EXPANSION_EVIDENCE_LEDGER.md`
