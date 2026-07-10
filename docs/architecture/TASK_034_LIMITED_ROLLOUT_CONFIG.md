# Task 034 — Limited Rollout Config

## Purpose

The limited rollout configuration document defines the structure, validation rules, and safe defaults for the Task 034 controlled limited rollout configuration.

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

## Config Schema

| Field | Type | Description | Default |
|---|---|---|---|
| `rolloutCapPercent` | number | Maximum percentage of cohort eligible for rollout | `25` |
| `expandedCohortEnabled` | boolean | Enable expanded cohort eligibility checks | `true` |
| `requireStaffReadiness` | boolean | Require staff readiness gate to pass | `true` |
| `requireLearnerNotice` | boolean | Require learner notice readiness gate to pass | `true` |
| `enforceHealthBudgets` | boolean | Enforce health budget thresholds | `true` |
| `enforceRollbackReadiness` | boolean | Enforce rollback readiness checks | `true` |
| `privacySafeMode` | boolean | Run in privacy-safe aggregate-only mode | `true` |
| `blockSchoolWide` | boolean | Block any school-wide operations | `true` |
| `block100Percent` | boolean | Block 100% rollout operations | `true` |
| `stateMachineTimeoutMs` | number | Timeout for state machine transitions | `30000` |

## Config Validation

The `LimitedRolloutConfigService` validates:

1. `rolloutCapPercent` must be >= 0 and < 100
2. `stateMachineTimeoutMs` must be > 0
3. All boolean flags must be valid booleans
4. Config must not contain any school-wide or 100% rollout fields

## Forbidden Config Patterns

- `schoolWideEnabled`, `fullSchoolLaunch` — belongs to Task 035
- `backendFreezeEnabled`, `deploymentLock` — belongs to Task 040
- `rolloutPercent: 100` — forbidden at any stage before Task 035

## Verification

The config is verified by:
1. Schema validation in `LimitedRolloutConfigService`
2. Unit tests for config validation logic
3. Integration tests for load and validate flow
4. Privacy scan ensuring no forbidden config fields exposed
