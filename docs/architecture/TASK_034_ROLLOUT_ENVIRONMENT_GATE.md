# Task 034 — Rollout Environment Gate

## Purpose

The rollout environment gate ensures the runtime is configured exclusively for controlled limited rollout — not school-wide launch, not 100% rollout, not production, not expansion beyond caps.

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

## Required Environment Flags

| Flag | Required Value | Purpose |
|---|---|---|
| `TASK034_LIMITED_ROLLOUT` | `1` | Enable controlled limited rollout mode |
| `TASK034_REQUIRE_TASK033_PROOF` | `1` | Require Task 033 proof before rollout |
| `TASK034_ROLLOUT_CAP` | `< 100` | Maximum rollout percentage cap |
| `TASK034_PRIVACY_SAFE_ROLLOUT` | `1` | Enforce aggregate-only rollout data |
| `TASK034_REQUIRE_ROLLBACK_READY` | `1` | Require rollback readiness |
| `TASK034_NO_SCHOOL_WIDE` | `1` | Block school-wide launch |
| `TASK034_NO_100_PERCENT` | `1` | Block 100% rollout |
| `NODE_ENV` | not `production` | Prevent production rollout |

## Gate Violations

The gate blocks rollout if any of:
- Missing or misconfigured environment flags
- `NODE_ENV` is `production`
- Attempt to bypass limited rollout mode
- Attempt to enable school-wide expansion
- Attempt to set rollout cap at or above 100

## Data Flow

```
Request -> RolloutEnvironmentGate
  -> Check TASK034_LIMITED_ROLLOUT == 1
  -> Check TASK034_REQUIRE_TASK033_PROOF == 1
  -> Check TASK034_ROLLOUT_CAP < 100
  -> Check TASK034_PRIVACY_SAFE_ROLLOUT == 1
  -> Check TASK034_REQUIRE_ROLLBACK_READY == 1
  -> Check TASK034_NO_SCHOOL_WIDE == 1
  -> Check TASK034_NO_100_PERCENT == 1
  -> Check NODE_ENV != production
  -> Pass/Fail
```

## Forbidden Operations

- No live production database URLs exposed
- No raw secrets or tokens logged
- No school-wide expansion allowed
- No 100% rollout allowed
- No cohort expansion beyond cap
