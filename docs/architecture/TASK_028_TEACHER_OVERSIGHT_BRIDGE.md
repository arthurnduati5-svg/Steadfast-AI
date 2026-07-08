# Task 028 — Teacher Oversight Bridge

## Purpose

The Teacher Oversight Bridge provides safe monitoring capabilities for teachers during the controlled expansion execution runtime. It is a read-only bridge — it does not send real communication.

## Capabilities

| Capability | Description |
|---|---|
| `getSnapshot` | Read current runtime state snapshot |
| `getEvidenceLedger` | Read evidence ledger entries |
| `getHealthStatus` | Read current health status |
| `getActiveIncidents` | Read list of active incidents |
| `getSummary` | Read daily expansion summary |

## Restrictions

The bridge **does not**:

- Accept commands to modify runtime state
- Send email or notifications
- Expose live AI model data
- Expose live school connector data

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Provide read-only monitoring | **Yes** |
| Expose health and evidence snapshots | **Yes** |
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

Teacher oversight bridge logic lives in `src/expansion/teacher-oversight-bridge.ts`.

## References

- `TASK_028_CONTROLLED_EXPANSION_EXECUTION_RUNTIME.md`
- `TASK_028_EXPANSION_HEALTH_AND_INTERVENTION.md`
- `TASK_028_EXPANSION_EVIDENCE_LEDGER.md`
