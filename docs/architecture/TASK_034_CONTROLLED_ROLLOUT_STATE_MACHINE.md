# Task 034 — Controlled Rollout State Machine

## Purpose

The controlled rollout state machine manages the lifecycle of the limited rollout from initialization through completion. Each state enforces specific gates and boundaries.

## Core Constraints

- Task 034 is backend-only
- Task 034 is limited rollout only
- Task 034 does not launch school-wide
- Task 034 does not run 100 percent rollout
- Task 034 does not freeze backend
- Task 034 does not create frontend UI
- Task 034 does not deploy
- Task 034 does not send real notifications
- Task 034 does not call live AI
- Task 034 does not write live connectors
- Task 034 does not expose raw learner data
- Task 034 does not expose raw Deen/private/safeguarding/answer/provider data

## State Machine

```
[inactive] -> [configuring] -> [ready] -> [rolling_out] -> [completed]
                                                              |
                                                              v
                                                         [rolled_back]
                                                              |
                                                              v
                                                         [paused]
```

## State Transitions

| From | To | Gate | Description |
|---|---|---|---|
| `inactive` | `configuring` | Task 033 dependency gate | Prerequisites verified |
| `configuring` | `ready` | Rollout environment gate + config loaded | Environment valid, config loaded |
| `ready` | `rolling_out` | Rollout cap gate + eligibility + readiness | All gates pass |
| `rolling_out` | `completed` | Rollout complete | All eligible learners activated |
| `rolling_out` | `paused` | Health incident or rollback | Incident detected |
| `paused` | `rolling_out` | Resume gate | Incident resolved |
| `rolling_out` | `rolled_back` | Rollback trigger | Rollback initiated |
| `paused` | `rolled_back` | Rollback trigger | Rollback initiated |

## State Enforcement

Each state transition validates:
1. Required environment flags are set
2. Preceding gates have passed
3. No school-wide or 100% rollout operations
4. Rollback readiness is maintained throughout

## Verification

The state machine is verified by:
1. Unit tests for each state transition
2. Integration tests for full state lifecycle
3. Edge case tests for rollback and pause
4. Privacy scan confirming no raw data in state logs
