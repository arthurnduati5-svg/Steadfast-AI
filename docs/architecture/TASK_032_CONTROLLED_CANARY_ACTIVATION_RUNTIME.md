# Task 032: Controlled Canary Activation Runtime

## Identity

Task 032 is a **backend-only controlled canary activation runtime**. It provides the infrastructure to activate a limited, approved cohort of learners in a safe, monitored backend environment.

## Core Constraints

### Task 032 is backend-only
All logic, routing, gates, and state machines live exclusively in `backend/src/`. No frontend code, UI components, or client-side rendering is involved.

### Task 032 is controlled canary activation only
The runtime activates a pre-approved canary cohort under strict gates. It does not provide general-purpose school-wide access.

### Task 032 uses internal-state-only activation
Activation is managed through an internal state machine (`inactive`, `configuring`, `ready`, `active`, `paused`, `killed`, `rolled-back`). There is no external-facing activation API for arbitrary users.

### Task 032 does not observe canary
Observation, monitoring, and analysis of canary results is deferred to **Task 033**. Task 032 only captures a monitoring snapshot for handoff.

### Task 032 does not roll out
There is no rollout, gradual traffic shifting, or percentage-based deployment. Activation is binary for the approved cohort.

### Task 032 does not build school-wide launch
School-wide launch is deferred to **Task 035**. Task 032 is explicitly scoped to a controlled subset.

### Task 032 does not modify frontend UI
No React components, CSS, or frontend routes are created or modified.

### Task 032 does not deploy
No production deployment scripts, CI/CD changes, or infrastructure mutations. Everything runs in the controlled canary environment.

### Task 032 does not send real communications
No email, SMS, push notification, or any real communication channel is called.

### Task 032 does not call live AI
No live AI provider API is invoked. The runtime validates that AI calls are blocked before gates pass.

### Task 032 does not write live school connectors
No real-school data connectors are written or invoked.

### Task 032 does not expose raw student data
The privacy boundary service blocks all raw student data (profiles, chat, emails, phones, safeguarding notes, private Deen text, answer keys, hidden reasoning) from being exposed in any response.

## Gates and Services

| Gate / Service | Responsibility |
|---|---|
| `Task031ProofLoaderService` | Validates Task 031 staging smoke completed successfully before anything else |
| `CanaryEnvironmentGate` | Validates environment flags (`TASK032_CONTROLLED_CANARY`, `TASK032_LIVE_STUDENT_PROTECTION`) |
| `ApprovedSchoolCanaryConfigService` | Validates school config has all required policies |
| `ConsentAuthorizationMatrixService` | Validates consent and authorization policies |
| `CohortEligibilityService` | Validates learner cohort membership against approved cohort IDs |
| `CanaryCapService` | Enforces `maxCanaryLearners` cap |
| `LiveStudentPrivacyBoundaryService` | Blocks all raw private data exposure |
| `ActivationStateMachineService` | Manages state transitions (inactive -> active -> paused -> killed -> rolled-back) |
| `RuntimeGuardService` | Ensures all gates pass before runtime access |
| `TeacherRoleBoundaryService` | Limits teachers to safe oversight summary only |
| `StudentRoleBoundaryService` | Limits students to own status only |
| `UnknownRoleDenialService` | Denies access for unauthenticated or unknown roles |
| `MonitoringSnapshotService` | Captures pre-activation monitoring snapshot for Task 033 |
| `HealthBudgetService` | Tracks activation health budget consumption |
| `ControlActionService` | Handles pause, resume, kill-switch, and other control actions |
| `RollbackProofService` | Validates rollback capability and execution |
| `IncidentBridgeService` | Logs incidents without exposing raw data |
| `SocraticGate` | Ensures Socratic integrity policy is respected |
| `DeenGate` | Ensures Deen sensitivity boundary is respected |
| `CurriculumGate` | Ensures curriculum source governance is respected |
| `ReportGenerationService` | Generates final report with all gate results |

## Data Flow

```
Task 031 Proof Loaded
  -> Canary Environment Gate
    -> Approved School Config
      -> Consent/Authorization
        -> Cohort Eligibility
          -> Canary Cap
            -> Privacy Boundary
              -> Activation State Machine
                -> Runtime Guard
                  -> AI/Memory Blocked Before Gates
                    -> Gate Chain (Socratic, Deen, Curriculum, Role Boundaries)
                      -> Monitoring Snapshot
                        -> Health Budget
                          -> Control Actions (pause/resume/kill/rollback)
                            -> Incident Bridge
                              -> Report Generation
```

## Boundaries

- **No raw student data** crosses any response boundary
- **No real communications** are sent
- **No live AI** is called
- **No production deployment** is performed
- **No frontend UI** is modified
- **No school-wide launch** is built
- **No canary observation** is performed (deferred to Task 033)
- **No rollout** is implemented (deferred to Task 034)
