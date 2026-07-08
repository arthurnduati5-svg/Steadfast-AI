# Task 028 — Approved Expansion Plan

## Purpose

Documents the approved expansion plan data structure loaded from Task 027 governance. The runtime reads this plan and uses it to drive the execution state machine.

## Allowed Fields

| Field | Type | Description |
|---|---|---|
| `planId` | string | Unique plan identifier |
| `planVersionId` | string | Version identifier |
| `targetCohortIds` | string[] | List of cohort IDs to expand into |
| `maxLearnersPerCohort` | number | Maximum learners per cohort |
| `activationSchedule` | object | ISO 8601 schedule for activation |
| `learnerAccessRules` | object | Rules for granting learner access |
| `healthThresholds` | object | Thresholds for health check intervention |
| `rollbackStrategy` | object | Strategy for rollback execution |
| `teacherOversightEmails` | string[] | Oversight contact list |

## Forbidden Fields

The runtime **must reject** any plan containing these fields:

| Field | Reason |
|---|---|
| `liveAIModelIds` | Task 028 does not call live AI |
| `liveSchoolConnectors` | Task 028 does not write live connectors |
| `deploymentTargets` | Task 028 does not deploy |
| `communicationTemplates` | Task 028 does not send real communication |
| `stagingConfig` | Task 028 does not build staging rehearsal |
| `canaryConfig` | Task 028 does not build canary analysis |
| `rolloutConfig` | Task 028 does not build rollout orchestration |
| `schoolWideLaunchConfig` | Task 028 does not build school-wide launch |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Load approved plan | **Yes** |
| Validate allowed fields | **Yes** |
| Reject forbidden fields | **Yes** |
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

Plan loading and validation lives in `src/expansion/plan-loader.ts`.

## References

- `TASK_028_TASK027_GOVERNANCE_DEPENDENCY.md`
- `TASK_028_EXPANSION_EXECUTION_STATE_MACHINE.md`
