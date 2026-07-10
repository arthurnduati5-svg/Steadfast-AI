# Task 034 — Expanded Runtime Guard

## Purpose

The expanded runtime guard monitors and enforces all runtime gates during the controlled limited rollout phase. It ensures that no gate violations occur while the rollout is active.

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

## Guard Checks

| Guard | Check | Frequency |
|---|---|---|
| Rollout cap guard | Current cap not exceeded | Every request |
| School-wide guard | No school-wide operations | Every request |
| 100% rollout guard | No 100% rollout operations | Every request |
| Environment guard | Required flags still set | Periodic |
| Privacy guard | No raw data exposed | Every request |
| Eligibility guard | Learners within approved cohort | Every activation |
| Health guard | Health budgets not exceeded | Periodic |
| Rollback guard | Rollback readiness maintained | Periodic |

## Guard Violation Response

If a runtime guard violation is detected:
1. Rollout state transitions to `paused`
2. Incident signal is raised (safe summary only)
3. Operator is notified
4. Violation must be resolved before rollout can resume

## Data Flow

```
Runtime Event -> ExpandedRuntimeGuard
  -> Check rollout cap
  -> Check school-wide guard
  -> Check 100% rollout guard
  -> Check environment flags
  -> Check privacy guard
  -> Check eligibility guard
  -> Check health guard
  -> Check rollback guard
  -> If any violation -> Pause rollout
  -> If all clear -> Allow continuation
```

## Verification

The expanded runtime guard is verified by:
1. Unit tests for each guard check
2. Integration tests for violation response
3. Periodic guard monitoring tests
4. Privacy scan confirming no raw data in guard artifacts
