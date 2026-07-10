# Task 034 — Rollout Cap Gate

## Purpose

The rollout cap gate enforces the maximum percentage of the eligible cohort that may be activated in the controlled limited rollout. This prevents accidental or intentional full-traffic deployment.

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

## Gate: RolloutCapGate

The `RolloutCapGate` enforces a strict rollout percentage cap. It is checked before any cohort expansion or activation occurs.

## Cap Enforcement

| Parameter | Value | Enforcement |
|---|---|---|
| Maximum cap | `25%` | Hard limit in config |
| Cap source | `TASK034_ROLLOUT_CAP` env or `rolloutCapPercent` config | Must be < 100 |
| Check timing | Before every cohort expansion | Every activation attempt |
| Violation action | Block activation, log incident | Immediate |

## Cap Violations

The gate fails if any of:
- Current rollout percentage exceeds the configured cap
- Attempted expansion would exceed the cap
- Cap is set to 100 or higher
- Cap is not configured
- Cap configuration is invalid

## Data Flow

```
Rollout Request -> RolloutCapGate
  -> Read rolloutCapPercent from config/env
  -> Check cap < 100
  -> Calculate current rollout percentage
  -> If current + expansion > cap -> BLOCK
  -> If current + expansion <= cap -> ALLOW
  -> Log cap check result (aggregate only)
```

## Verification

The cap gate is verified by:
1. Unit tests for cap enforcement logic
2. Integration tests with various cap values
3. Boundary tests at 0%, 25%, 99%, 100%
4. Privacy scan confirming no raw cohort data in cap logs
