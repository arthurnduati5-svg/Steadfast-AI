# Task 028 — Expansion Evidence Ledger

## Purpose

The Evidence Ledger is an immutable log of every metadata event that occurs during the controlled expansion execution runtime. It records state transitions, gate results, health snapshots, incidents, and rollback actions.

## Event Types

| Event Type | Description |
|---|---|
| `STATE_TRANSITION` | State machine transition occurred |
| `GATE_CHECK` | A guard gate was evaluated |
| `GATE_PASS` | A guard gate passed |
| `GATE_DENIAL` | A guard gate denied with reason |
| `HEALTH_SNAPSHOT` | Health snapshot taken |
| `HEALTH_VIOLATION` | Health threshold violated |
| `INTERVENTION_QUEUED` | Intervention queued |
| `INCIDENT_CREATED` | Incident recorded |
| `ROLLBACK_STEP` | Rollback step executed |
| `SUMMARY_GENERATED` | Daily summary generated |

## Entry Structure

```typescript
interface EvidenceEntry {
  id: string;
  eventType: EvidenceEventType;
  timestamp: string; // ISO 8601
  state: ExpansionState;
  data: Record<string, unknown>;
  previousEntryId: string | null;
}
```

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Record events immutably | **Yes** |
| Read ledger entries | **Yes** |
| Support daily summary generation | **Yes** |
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

Evidence ledger logic lives in `src/expansion/evidence-ledger.ts`.

## References

- `TASK_028_CONTROLLED_EXPANSION_EXECUTION_RUNTIME.md`
- `TASK_028_DAILY_EXPANSION_SUMMARY.md`
