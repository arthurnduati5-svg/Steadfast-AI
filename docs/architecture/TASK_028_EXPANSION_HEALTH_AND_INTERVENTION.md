# Task 028 — Expansion Health and Intervention

## Purpose

Documents the health snapshot mechanism and intervention queue for the controlled expansion execution runtime.

## Health Snapshots

Health snapshots are taken periodically and on every state transition.

| Metric | Description | Threshold |
|---|---|---|
| `cohortCount` | Number of active cohorts | Must match plan |
| `learnerAccessCount` | Number of learners with access | Must be <= plan max |
| `errorRate` | Rate of runtime errors | Must be < 5% |
| `gatePassRate` | Rate of gate passes | Must be > 90% |
| `incidentCount` | Number of active incidents | Must be 0 |
| `teacherOversightOnline` | Whether bridge is reachable | Must be true |

## Intervention Queue

When a health threshold is violated, an intervention is queued:

| Intervention | Trigger | Action |
|---|---|---|
| `HALT_EXPANSION` | Any threshold violated | Pause runtime, transition to Incident |
| `NOTIFY_TEACHER` | Threshold violated (non-critical) | Add to evidence ledger (no real communication) |
| `QUEUE_ROLLBACK` | Critical threshold violated | Mark rollback as pending |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Take health snapshots | **Yes** |
| Enforce thresholds | **Yes** |
| Queue interventions | **Yes** |
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

Health and intervention logic lives in `src/expansion/health/`.

## References

- `TASK_028_CONTROLLED_EXPANSION_EXECUTION_RUNTIME.md`
- `TASK_028_TEACHER_OVERSIGHT_BRIDGE.md`
- `TASK_028_INCIDENT_AND_ROLLBACK_EXECUTION.md`
