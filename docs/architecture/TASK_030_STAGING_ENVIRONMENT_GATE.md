# Task 030 — Staging Environment Gate

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Staging Environment Gate ensures that the Controlled Staging Rehearsal Runtime only operates in a safe, synthetic, non-production environment. It blocks execution if any environment variable indicates a production-like or live-rollout configuration.

## Allowed Values

| Configuration | Allowed Values | Description |
|---------------|----------------|-------------|
| `TASK030_STAGING_REHEARSAL` | `"1"` | Enables staging rehearsal mode. Must be explicitly set to `1`. |
| `TASK030_NO_LIVE_STUDENTS` | `"1"` | Blocks all live student data. Must be explicitly set to `1`. |
| `NODE_ENV` | `"development"`, `"staging"`, `"test"` | Production environments are blocked. |
| Database URL | Empty string, `"not_set"`, or local non-production URL | Any URL containing `production`, `prod`, or pointing to a production host is blocked. |
| `LIVE_ROLLOUT_ENABLED` | Must not be `"true"` | If set to `"true"`, the gate blocks immediately. |
| Synthetic fixture prefix | `task030_safe_` | All synthetic data IDs must use this prefix. |

## Forbidden Values

| Configuration | Value | Rejection Reason |
|---------------|-------|------------------|
| `TASK030_STAGING_REHEARSAL` | `"0"`, empty, or unset | Staging rehearsal mode not explicitly enabled |
| `TASK030_NO_LIVE_STUDENTS` | `"0"`, empty, or unset | No-live-student guard not explicitly enabled |
| `NODE_ENV` | `"production"` | Production environment forbidden for dry-run rehearsal |
| Database URL | Contains `production`, `prod`, or remote production host | Must not reference production data sources |
| `LIVE_ROLLOUT_ENABLED` | `"true"` | Live rollout must not be active during rehearsal |
| Any fixture ID | Missing `task030_safe_` prefix | Non-synthetic fixture detected |

## How It Blocks

When the staging environment gate check fails, the runtime behaves as follows:

1. **All rehearsal endpoints** return HTTP `503 Service Unavailable`.
2. **Response body** includes a structured error:
   ```json
   {
     "error": "STAGING_GATE_BLOCKED",
     "message": "Staging environment checks failed. Controlled staging rehearsal requires safe non-production configuration.",
     "details": {
       "stagingRehearsalEnabled": false,
       "noLiveStudentsEnabled": true,
       "nodeEnvClassification": "production",
       "databaseUrlClassification": "production_like",
       "liveRolloutFlagDetected": false,
       "syntheticPrefixValid": true
     }
   }
   ```
3. **State machine** remains at `blocked` (or transitions to `blocked` if already running).
4. **Health endpoint** still responds and reports `stagingGate: "blocked"`.
5. **All background rehearsal jobs** are cancelled or prevented from starting.

## Rejection Criteria (Summary)

The gate is **PASS** only when **ALL** conditions are met:

- [ ] `TASK030_STAGING_REHEARSAL` = `"1"`
- [ ] `TASK030_NO_LIVE_STUDENTS` = `"1"`
- [ ] `NODE_ENV` is NOT `"production"`
- [ ] Database URL is NOT production-like
- [ ] `LIVE_ROLLOUT_ENABLED` is NOT `"true"`
- [ ] All fixture IDs use `task030_safe_` prefix

The gate is **FAIL** if **ANY** condition is violated.

## Verification

```bash
node -e "
const ok = process.env.TASK030_STAGING_REHEARSAL === '1'
  && process.env.TASK030_NO_LIVE_STUDENTS === '1'
  && process.env.NODE_ENV !== 'production';
console.log('TASK030_STAGING_REHEARSAL:' + (process.env.TASK030_STAGING_REHEARSAL || 'not_set'));
console.log('TASK030_NO_LIVE_STUDENTS:' + (process.env.TASK030_NO_LIVE_STUDENTS || 'not_set'));
console.log('NODE_ENV:' + (process.env.NODE_ENV || 'not_set'));
process.exit(ok ? 0 : 1);
"
```

Exit code 0 = PASS, non-zero = FAIL.

## Integration Points

The gate integrates with:
- **Environment variable reader**: Reads `process.env` for all checked variables.
- **Database URL parser**: Parses and classifies the database URL.
- **No-live-student guard service**: Shared validation with synthetic fixture service.
- **Rehearsal state machine**: Reports gate status and blocks transitions until passed.