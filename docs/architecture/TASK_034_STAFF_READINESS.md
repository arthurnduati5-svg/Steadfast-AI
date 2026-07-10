# Task 034 — Staff Readiness

## Purpose

The staff readiness gate ensures that staff members (teachers, administrators) at participating schools are ready for the controlled limited rollout. Readiness is verified through pre-configured checks.

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

## Gate: StaffReadinessService

The `StaffReadinessService` checks that all required staff readiness conditions are met before limited rollout proceeds.

## Readiness Checks

| Check | Method | Pass Condition |
|---|---|---|
| Staff training completed | Verify training records | All required staff trained |
| Staff acknowledgment | Verify acknowledgment records | All required staff acknowledged |
| School admin approval | Verify admin approval flags | School admin approved rollout |
| Staff-to-learner ratio | Verify ratio within limits | Ratio within configured threshold |
| No staff opt-out | Verify staff opt-out registry | No staff opted out |

## Readiness Flow

```
Staff Readiness Check -> StaffReadinessService
  -> Load school staff records (aggregate only)
  -> Check training completion
  -> Check acknowledgment status
  -> Check admin approval
  -> Check staff-to-learner ratio
  -> Check opt-out registry
  -> Return readiness status (aggregate: pass/fail + count)
```

## Data Protection

- No individual staff names or contact details exposed
- Aggregate readiness counts only
- No raw training or acknowledgment records in logs

## Verification

Staff readiness is verified by:
1. Unit tests for readiness check logic
2. Integration tests with synthetic readiness data
3. Privacy scan confirming no raw staff data exposed
