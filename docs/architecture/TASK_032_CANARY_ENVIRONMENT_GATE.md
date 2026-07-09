# TASK 032 — Canary Environment Gate

**This gate is backend-only. No production deployment, no live traffic.**

## Purpose

The canary environment gate (`task032CanaryEnvironmentGateService.ts`) ensures the runtime is configured exclusively for controlled canary activation — not open rollout, not production.

## Required Environment Flags

| Flag | Required Value | Purpose |
|------|---------------|---------|
| `TASK032_CONTROLLED_CANARY` | `1` | Enable controlled canary mode |
| `TASK032_CANARY_DRY_RUN` | `1` | Run as dry run, no real activation |
| `TASK032_REQUIRE_APPROVED_SCHOOL` | `1` | Only approved schools allowed |
| `TASK032_LIVE_STUDENT_PROTECTION` | `1` | Privacy boundary enforced |
| `TASK032_NO_OPEN_ROLLOUT` | `1` | Block open/percentage rollout |
| `NODE_ENV` | not `production` | Prevent production activation |

## Gate Violations

The gate blocks activation if any of:
- Missing or misconfigured environment flags
- `NODE_ENV` is `production`
- Attempt to bypass dry-run mode
- `maxCanaryPercent` exceeded (hard cap: 5%)
- `maxCanaryStudents` exceeded (hard cap: 25)

## Data Flow

```
Request -> CanaryEnvironmentGate
  -> Check TASK032_CONTROLLED_CANARY == 1
  -> Check TASK032_CANARY_DRY_RUN == 1
  -> Check TASK032_REQUIRE_APPROVED_SCHOOL == 1
  -> Check TASK032_LIVE_STUDENT_PROTECTION == 1
  -> Check TASK032_NO_OPEN_ROLLOUT == 1
  -> Check NODE_ENV != production
  -> Pass/Fail
```

## Forbidden Operations

- No live production database URLs exposed
- No raw secrets or tokens logged
- No canary activation outside of dry-run mode
- No percentage-based rollout allowed
