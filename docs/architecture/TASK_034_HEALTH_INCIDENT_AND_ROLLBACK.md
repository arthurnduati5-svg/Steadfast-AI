# Task 034 — Health, Incident, and Rollback

## Purpose

Health, incident, and rollback management ensures that the limited rollout operates within health budgets, handles incidents safely, and maintains rollback readiness throughout the rollout period.

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

## Health Budget

| Budget | Threshold | Monitoring Method |
|---|---|---|
| Latency budget | p95 < 2000ms | Monitor API response times |
| Error budget | < 1% error rate | Monitor error rates |
| Privacy budget | 0 violations | Scan all rollout events |
| Rollout cap budget | Never exceed cap | Monitor current percentage |
| Eligibility budget | 100% pass rate | Monitor eligibility gate |
| Staff readiness budget | 100% pass rate | Monitor staff readiness gate |
| Learner notice budget | 100% pass rate | Monitor notice readiness gate |

## Incident Signals

| Signal | Description | Response |
|---|---|---|
| Privacy violation | Raw data detected in rollout | Pause rollout, raise incident |
| Budget exceeded | Health budget threshold crossed | Pause rollout, raise incident |
| Cap violation | Rollout cap exceeded | Pause rollout, raise incident |
| Gate failure | Runtime gate failed unexpectedly | Pause rollout, raise incident |
| Error spike | Error rate exceeded threshold | Pause rollout, raise incident |
| Latency spike | Latency exceeded threshold | Log, alert operator |

All incident signals use safe summaries only. No raw data is included.

## Rollback Readiness

| Check | Method | Pass Condition |
|---|---|---|
| Rollback plan exists | Verify plan document | Plan found and valid |
| Rollback owner assigned | Verify owner defined | Owner assigned |
| Kill switch available | Verify kill switch functional | Kill switch works |
| Pause available | Verify pause functional | Pause works |
| Runtime blocked after rollback | Verify access blocked after rollback | Access blocked |
| Evidence preserved during rollback | Verify data integrity | Evidence intact |

## Data Flow

```
Rollout Events -> Health Monitor
  -> Check latency budget
  -> Check error budget
  -> Check privacy budget
  -> Check rollout cap budget
  -> If any exceeded -> Incident Signal
    -> Pause rollout
    -> Generate safe summary
    -> Notify operator

Rollback Readiness -> Periodic Check
  -> Verify plan, owner, kill switch, pause
  -> Verify rollback blocks access
  -> Verify evidence preserved
```

## Verification

Health, incident, and rollback management is verified by:
1. Health budget enforcement unit tests
2. Incident signal generation tests
3. Rollback readiness verification tests
4. End-to-end scenario in limited rollout runner
