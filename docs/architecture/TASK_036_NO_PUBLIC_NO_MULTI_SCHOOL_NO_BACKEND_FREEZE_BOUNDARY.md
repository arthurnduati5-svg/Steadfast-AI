# Task 036: No Public, No Multi-School, No Backend Freeze Boundary

## Identity

- **Task:** 036
- **Component:** Scope Boundary Enforcement
- **Type:** Backend-only boundary contract

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Define and enforce the core scope boundaries that Task 036 must NOT cross. These boundaries are the product standard guardrails for the controlled live school launch.

## Boundary 1: No Public Launch

| Check | Required Value |
|-------|---------------|
| `openRegistrationEnabled` | `false` |
| `publicSignupEnabled` | `false` |
| `anonymousAccessEnabled` | `false` |
| `marketingLaunchEnabled` | `false` |
| `paymentFlowEnabled` | `false` |

## Boundary 2: No Multi-School Rollout

| Check | Required Value |
|-------|---------------|
| `allSchoolsEnabled` | `false` |
| `multiSchoolRolloutPerformed` | `false` |
| `crossSchoolAccessAllowed` | `false` |

## Boundary 3: No Backend Freeze

| Check | Required Value |
|-------|---------------|
| `backendFreezeCreated` | `false` |
| `backend continues to accept changes` | `true` |

Task 036 does NOT freeze the backend. The backend remains open for development. Task 040 (Final Backend Logic Freeze) is the task that handles backend freeze, and it must NOT be initiated by Task 036.

## Boundary 4: No Production Deployment

| Check | Required Value |
|-------|---------------|
| `productionDeploymentIntroduced` | `false` |

## Boundary 5: No Real External Notifications

| Check | Required Value |
|-------|---------------|
| `realNotificationsSent` | `false` |

## Boundary 6: No Live AI Provider Expansion

| Check | Required Value |
|-------|---------------|
| `liveAiExpansionIntroduced` | `false` |

## Boundary 7: No Live Connector Write Expansion

| Check | Required Value |
|-------|---------------|
| `liveSchoolConnectorWriteExpansionIntroduced` | `false` |

## Boundary 8: No Frontend UI

| Check | Required Value |
|-------|---------------|
| `frontendUiCreated` | `false` |

## Verification

All boundaries are verified by:
1. `scripts/run-task036-live-school-launch.cjs` — validates boundaries
2. `scripts/task036-json-validate.cjs` — confirms all boundary fields are correct
3. `scripts/verify-task036.ps1` — includes boundary verification
4. `scripts/gen-task036-report.cjs` — records boundaries in report
