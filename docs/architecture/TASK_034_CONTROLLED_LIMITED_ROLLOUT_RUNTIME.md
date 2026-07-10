# Task 034: Controlled Limited Rollout Runtime

## Identity

Task 034 is a **backend-only controlled limited rollout runtime**. It activates the Task 032 canary cohort into a limited rollout phase, enforces rollout caps, checks eligibility, verifies staff and learner notice readiness, manages the rollout state machine, applies runtime guards, monitors health with incident and rollback, enforces privacy and content boundaries, and produces a safe rollout read model.

## Core Constraints

### Task 034 is backend-only
All logic, routing, gates, and state machines live exclusively in `backend/src/`. No frontend code, UI components, or client-side rendering is involved.

### Task 034 is limited rollout only
The runtime operates exclusively within a limited rollout scope. It does not provide general-purpose school-wide access.

### Task 034 does not launch school-wide
School-wide launch is deferred to Task 035. Task 034 is explicitly scoped to controlled limited rollout of the pre-approved cohort.

### Task 034 does not run 100 percent rollout
No 100% rollout or full-traffic deployment is performed. Rollout caps are enforced at every gate.

### Task 034 does not freeze backend
No backend freeze, lock, or deployment blockade is introduced.

### Task 034 does not create frontend UI
No React components, CSS, or frontend routes are created or modified.

### Task 034 does not deploy
No production deployment scripts, CI/CD changes, or infrastructure mutations.

### Task 034 does not send real notifications
No email, SMS, push notification, or any real communication channel is called.

### Task 034 does not call live AI
No live AI provider API is invoked. Limited rollout uses pre-approved canary data only.

### Task 034 does not write live connectors
No real-school data connectors are written or invoked.

### Task 034 does not expose raw learner data
The privacy boundary blocks all raw student data (profiles, chat, emails, phones, safeguarding notes, private Deen text, answer keys, hidden reasoning) from being exposed in any response.

### Task 034 does not expose raw Deen/private/safeguarding/answer/provider data
All Deen-sensitive, safeguarding, answer key, and provider response data is blocked at the privacy boundary.

## Controlled Limited Rollout Pipeline

```
Task 033 Evidence Loaded
  -> Task 033 Dependency Gate
    -> Rollout Environment Gate
      -> Limited Rollout Config Loader
        -> Rollout Cap Gate
          -> Expanded Cohort Eligibility Check
            -> Staff Readiness Gate
              -> Learner Notice Readiness Gate
                -> Controlled Rollout State Machine
                  -> Expanded Runtime Guard
                    -> Health, Incident, and Rollback
                      -> Privacy, Content, Socratic, Deen Reviews
                        -> Safe Rollout Read Model
                          -> No School-Wide / No Backend Freeze Boundary
                            -> Report
```

## Gates and Services

| Gate / Service | Responsibility |
|---|---|
| `Task033ProofLoaderService` | Validates Task 033 completed successfully before limited rollout begins |
| `RolloutEnvironmentGate` | Validates environment flags for limited rollout mode |
| `LimitedRolloutConfigService` | Loads and validates limited rollout configuration |
| `RolloutCapGate` | Enforces maximum rollout percentage cap |
| `ExpandedCohortEligibilityService` | Checks expanded cohort eligibility |
| `StaffReadinessService` | Verifies staff readiness for limited rollout |
| `LearnerNoticeReadinessService` | Verifies learner notice readiness |
| `ControlledRolloutStateMachineService` | Manages controlled rollout state lifecycle |
| `ExpandedRuntimeGuardService` | Verifies runtime gates during expanded limited rollout |
| `HealthIncidentAndRollbackService` | Enforces health budgets, handles incidents, maintains rollback readiness |
| `PrivacyContentSocraticDeenReviewService` | Verifies privacy, content, Socratic integrity, and Deen boundaries |
| `SafeRolloutReadModelService` | Provides aggregate-only rollout read access |
| `NoSchoolWideNoBackendFreezeBoundaryService` | Enforces school-wide and freeze boundaries |
| `ReportGenerationService` | Generates final controlled limited rollout report |
