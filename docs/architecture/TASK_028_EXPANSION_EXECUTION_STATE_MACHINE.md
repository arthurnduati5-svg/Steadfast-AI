# Task 028 — Expansion Execution State Machine

## Purpose

Defines all states and transitions of the expansion execution runtime.

## States

```
PendingGovernanceApproval
       |
       v
   Approved
       |
       v
  Activating
       |
       v
    Active
       |
       v
  Completed
```

With error paths:

```
Any state --> Incident --> RolledBack
                      |
                      v
                   Failed
```

## Transition Table

| From | To | Gate | Trigger |
|---|---|---|---|
| PendingGovernanceApproval | Approved | Governance proof check | Proof verified |
| Approved | Activating | Cohort activation gate | Activation command |
| Activating | Active | Learner access gate | Cohort ready |
| Active | Completed | Completion gate | Expansion finished |
| Any | Incident | Runtime guard | Violation or health threshold |
| Incident | RolledBack | Rollback gate | Rollback command |
| Incident | Failed | — | Unrecoverable error |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Define state machine | **Yes** |
| Enforce transitions | **Yes** |
| Record transitions to ledger | **Yes** |
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

State machine lives in `src/expansion/state-machine.ts`.

## References

- `TASK_028_CONTROLLED_EXPANSION_EXECUTION_RUNTIME.md`
- `TASK_028_EXPANDED_COHORT_ACTIVATION_GATE.md`
- `TASK_028_EXPANDED_LEARNER_ACCESS_GATE.md`
- `TASK_028_EXPANDED_RUNTIME_GUARD.md`
