# Task 030 — Rehearsal Run State Machine

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Rehearsal Run State Machine governs the lifecycle of a controlled staging rehearsal run. Each rehearsal progresses through a defined sequence of states, with validations at each transition. Terminal states are `accepted_ready` (all gates and rehearsals pass) or `blocked` (any gate or rehearsal fails).

## State Diagram

```
                    ┌──────────┐
                    │  created  │
                    └─────┬─────┘
                          │ validate gate preconditions
                          ▼
                ┌────────────────┐
                │ preflight_running │
                └───────┬──────────┘
                    │          │ fail
               pass │          ▼
                    │    ┌─────────┐
                    ▼    │ blocked │
           ┌──────────────────┘      │
           │ preflight_passed        │
           └──────────┬──────────────┘
                      │ start journey rehearsals
                      ▼
               ┌─────────────────┐
               │ journeys_running │
               └────────┬────────┘
                   │         │ fail
              pass │         ▼
                   │   ┌─────────┐
                   ▼   │ blocked │
           ┌─────────────────────────────┘
           │ operations_rehearsal_running
           └────────────┬─────────────────┘
                   │         │ fail
              pass │         ▼
                   │   ┌─────────┐
                   ▼   │ blocked │
           ┌──────────────────────┘
           │ rollback_drill_running
           └────────────┬──────────┘
                   │         │ fail
              pass │         ▼
                   │   ┌─────────┐
                   ▼   │ blocked │
           ┌──────────────────────┘
           │ training_pack_generated
           └────────────┬──────────┘
                   │         │ fail
              pass │         ▼
                   │   ┌─────────┐
                   ▼   │ blocked │
           ┌──────────────────────┘
           │ report_generated
           └────────────┬──────────┘
                   │         │ fail
              pass │         ▼
                   │   ┌─────────┐
                   ▼   │ blocked │
           ┌──────────────────────┘
           │ accepted_ready
           └─────────────────
```

## States

### `created`
- **Entry**: Initial state when rehearsal run is instantiated.
- **Transitions**: → `preflight_running` (when `start()` is called).
- **Allowed actions**: `start`, `cancel`.
- **Validation**: None required.

### `preflight_running`
- **Entry**: Rehearsal begins preflight checks.
- **Transitions**:
  - → `preflight_passed` (all checks pass).
  - → `blocked` (any check fails).
- **Validations**: Task 029 dependency gate, staging environment gate, no-live-student guard.

### `preflight_passed`
- **Entry**: All preflight checks passed.
- **Transitions**: → `journeys_running` (when `runJourneys()` called).
- **Validations**: None — this is a passive state.

### `journeys_running`
- **Entry**: Journey rehearsals are executing.
- **Transitions**:
  - → `operations_rehearsal_running` (all journeys pass).
  - → `blocked` (any journey fails or reveals a permission violation).
- **Validations**: Admin/operator journey, teacher journey, student journey, unknown-role denial.

### `operations_rehearsal_running`
- **Entry**: Operations console rehearsal is executing.
- **Transitions**:
  - → `rollback_drill_running` (console rehearsal passes).
  - → `blocked` (console rehearsal fails).
- **Validations**: Dashboard read model, stage panel, health panel, timeline, oversight queue, control panel safe messages, completion review honesty.

### `rollback_drill_running`
- **Entry**: Rollback and kill-switch drill is executing.
- **Transitions**:
  - → `training_pack_generated` (drill passes).
  - → `blocked` (drill fails).
- **Validations**: Kill-switch enable/disable, rollback execution, audit preservation, safe summary generation.

### `training_pack_generated`
- **Entry**: Staff training pack has been generated.
- **Transitions**:
  - → `report_generated` (pack generation succeeds, all documents present).
  - → `blocked` (pack generation fails, any document missing).
- **Validations**: All training docs present and privacy-safe.

### `report_generated`
- **Entry**: Final report and evidence ledger are generated.
- **Transitions**:
  - → `accepted_ready` (report is consistent, `safeToStartTask031` computed).
  - → `blocked` (report reveals contradiction or blocking issue).
- **Validations**: Report consistency, `safeToStartTask031` decision, evidence ledger integrity.

### `accepted_ready`
- **Entry**: Terminal success state. Verdict `ACCEPTED_READY_YES`.
- **Transitions**: None.
- **Meaning**: All gates and rehearsals have passed. Task 030 is ready. `safeToStartTask031` is `true`.

### `blocked`
- **Entry**: Terminal failure state (reachable from any active state).
- **Transitions**: None.
- **Meaning**: A gate or rehearsal has failed. Blocking issues are recorded.

## State Machine Contract

```typescript
interface RehearsalRun {
  id: string;
  state: RehearsalState;
  createdAt: string;
  updatedAt: string;
  transitions: StateTransition[];
  errors: string[];
  evidenceRecordIds: string[];
}

type RehearsalState =
  | 'created'
  | 'preflight_running'
  | 'preflight_passed'
  | 'journeys_running'
  | 'operations_rehearsal_running'
  | 'rollback_drill_running'
  | 'training_pack_generated'
  | 'report_generated'
  | 'accepted_ready'
  | 'blocked';

interface StateTransition {
  from: RehearsalState;
  to: RehearsalState;
  timestamp: string;
  validationResult: 'pass' | 'fail';
  details: string;
}
```

## Integration Points

The state machine integrates with:
- **All gate services**: Task 029 dependency gate, staging environment gate, no-live-student guard.
- **All rehearsal services**: Journey rehearsals, console rehearsal, rollback drill, training pack generation, report generation.
- **Evidence ledger**: Logs every state transition as an evidence record.
- **Runbook**: The operations runbook follows the state machine sequence.