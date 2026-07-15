# Package 21: Recovery Outcome Execution Simulation

## Purpose

Serve as a simulation chamber that models what live execution of Package 20 action preparations would look like — without performing any live action execution. Package 21 owns the simulation readiness assessment, simulation plans, simulation runs, step tracing, eligibility gates, blocked-action diagnostics, failure injection scenarios, simulation results, teacher reviews, student/parent preview drafts, readiness verdicts, and simulation summaries. All records are simulation-only — no live score, mastery, grade, notification, assignment, portal publish, or external sync occurs within Package 21.

## Design Principles

- **Simulation-only**: All records model execution behavior without executing anything live. Simulation runs transition through `draft` -> `simulating` -> `simulated` -> `review_ready` — never to a live execution state.
- **No live mutations**: Package 21 never writes scores, grades, mastery levels, live progress updates, notifications, assignments, calendar events, portal content, or external integrations.
- **Reference by ID only**: All references to Package 17 plans, Package 19 decision drafts, and Package 20 readiness records, bundles, and action drafts are by ID only. Content is never duplicated.
- **Idempotent**: All mutating operations accept `x-idempotency-key` to prevent duplicate processing.
- **Full audit trail**: Every status transition, creation, and decision is audited via `RecoveryOutcomeExecutionSimulationAuditRecord`.
- **Safety-gated**: All content passes through `RecoveryOutcomeExecutionSimulationSafetyService` before persistence.
- **Policy-enforced**: `RecoveryOutcomeExecutionSimulationPolicyEnforcer` enforces role-based access and blocks live execution categories across all operations.

## How Package 21 Consumes Package 20 by Reference

Package 20 produces action bundles, action drafts, and readiness records. Package 21 does NOT duplicate any of these. Instead:

- `RecoveryOutcomeExecutionSimulationReadinessRecord.recoveryOutcomeActionReadinessId` references Package 20 readiness by ID.
- `RecoveryOutcomeExecutionSimulationReadinessRecord.recoveryOutcomeActionBundleId` references Package 20 bundle by ID.
- `RecoveryOutcomeExecutionSimulationPlanRecord.recoveryOutcomeActionBundleId` references Package 20 bundle by ID.
- `RecoveryOutcomeExecutionSimulationPlanRecord.recoveryContinuationActionDraftId`, `recoveryIntensificationActionDraftId`, `recoveryPauseActionDraftId`, `recoveryClosureActionDraftId` reference Package 20 action drafts by ID.
- `RecoveryOutcomeExecutionEligibilityCheckRecord.recoveryOutcomeActionBundleId` and `recoveryOutcomeActionReadinessId` reference Package 20 by ID.

Package 21 never stores the content of Package 20 records. All simulation metadata is stored in `simulationParametersJson`, `simulationOutcomeDetailsJson`, and `sourceRefsJson` fields unique to the simulation context.

## Why Package 21 Is NOT Live Execution

Package 21 is explicitly a simulation layer. It differs from live execution in every dimension:

| Dimension | Package 21 (Simulation) | Future Live Execution |
|-----------|------------------------|----------------------|
| Action effect | Models what would happen | Performs the action |
| Score mutation | None | Would update scores |
| Mastery mutation | None | Would update mastery |
| Notification | None (simulates notification content only) | Would send real notifications |
| Assignment | None (simulates assignment data only) | Would create real assignments |
| Portal publish | None | Would publish to portals |
| External sync | None | Would sync externally |
| Rollback execution | None | Would execute rollback |
| Closure execution | None | Would execute closure |
| Policy enforcement | Blocks all live execution categories | Live execution policies would apply |

The `RECOVERY_OUTCOME_EXECUTION_NO_LIVE_EXECUTION`, `NO_LIVE_ACTIVATION`, `NO_LIVE_COMPLETION`, `NO_LIVE_CLOSURE`, `NO_LIVE_ASSIGNMENT`, `NO_LIVE_NOTIFICATION`, `NO_PORTAL_PUBLISH`, `NO_SCORE_MUTATION`, `NO_MASTERY_MUTATION`, `NO_REGRADE_EXECUTION`, `NO_GENERATED_QUESTION`, `NO_AI_NARRATIVE`, `NO_OCR`, `NO_PDF`, and `NO_EXTERNAL_SYNC` policy families all have empty `allowedRoles` — meaning no role can ever perform these operations within Package 21.

## Simulation Lifecycle

### Readiness -> Plan -> Run -> Step Tracing -> Results

```
  [Simulation Readiness]
    │  draft -> review_ready -> approved_for_future_use
    │  (or suppressed / blocked / void)
    v
  [Simulation Plan]
    │  draft -> simulation_ready -> review_ready -> approved_for_future_use
    │  (or suppressed / blocked / void)
    v
  [Simulation Run]
    │  draft -> simulating -> simulated -> review_ready
    │  (or suppressed / blocked / void)
    │
    ├── [Simulation Steps] (per run)
    │     pending -> simulated / blocked
    │     (or void)
    │
    v
  [Simulation Results]
    │  draft -> review_ready
    │  (or void)
    v
  [Readiness Verdicts]
    │  draft -> review_ready -> approved_for_future_use
    │  (or suppressed / blocked / void)
    v
  [Simulation Summaries]
       active -> stale / blocked / void
       (refresh transitions stale -> active)
```

1. **Simulation Readiness** — Assess whether the action bundle is ready to simulate. Statuses: `draft`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

2. **Simulation Plan** — Define simulation parameters and associate action drafts. A plan can reference continuation, intensification, pause, and closure action drafts from Package 20. Statuses: `draft`, `simulation_ready`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

3. **Simulation Run** — Execute the simulation plan as a run. The run transitions through `draft` -> `simulating` -> `simulated` -> `review_ready`. The `simulating` status indicates simulation is in progress within the model; `simulated` indicates it completed without error. Statuses: `draft`, `simulating`, `simulated`, `review_ready`, `suppressed`, `blocked`, `void`.

4. **Simulation Steps** — Individual steps within a simulation run, recorded with sequence order, step name, and step details. Steps start as `pending` and transition to `simulated` or `blocked`. Multiple steps can be recorded per run.

5. **Simulation Results** — Capture the outcome of a simulation run. Stores `simulationOutcomeDetailsJson` with simulated success/failure data. Statuses: `draft`, `review_ready`, `void`.

6. **Readiness Verdicts** — Aggregate verdict on execution readiness based on simulation results. Statuses: `draft`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

7. **Simulation Summaries** — Rollup of simulation counts and top findings across runs. Statuses: `active`, `stale`, `blocked`, `void`.

### Eligibility Gate Lifecycle

Eligibility checks model whether an action bundle is eligible for live execution — without actually executing. The gate:

- Created in `draft` status with `eligibilityChecksJson` containing conditions and results.
- Marked `review_ready` after teacher review of eligibility criteria.
- Voided if eligibility is deemed irrelevant.

Statuses: `draft`, `review_ready`, `void`.

### Blocked-Action Diagnostic Lifecycle

Blocked-action diagnostics capture why specific actions would be blocked during live execution. The lifecycle:

- Created in `draft` status with `diagnosticDetailsJson` describing the blocking condition.
- Marked `review_ready` after teacher review.
- Can be `suppressed` (acknowledged but not resolved) or `voided` (resolved or invalid).

Statuses: `draft`, `review_ready`, `suppressed`, `void`.

### Failure-Injection Lifecycle

Failure injection scenarios model what happens when specific failure modes occur during execution:

- Created in `draft` status with `injectionType`, `injectionParametersJson`, and `expectedFailureBehaviorJson`.
- Marked `review_ready` after review.
- `approved_for_future_use` signals the scenario is ready for future simulation use.
- Can be `suppressed`, `blocked`, or `voided`.

Statuses: `draft`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

### Student and Parent Preview Boundaries

Package 21 supports **preview drafts** for both students and parents through `RecoveryOutcomeExecutionStudentPreviewDraftRecord` and `RecoveryOutcomeExecutionParentPreviewDraftRecord`.

- Preview drafts contain safe summary text and `previewContentJson` — they NEVER contain raw scores, raw answers, teacher-only notes, hidden reasoning, live assignment data, or unreleased grades.
- Preview drafts are created by teacher+ roles (not by students or parents directly).
- Status lifecycle: `draft` -> `review_ready` -> `approved_for_future_use` (or `suppressed` / `blocked` / `void`).
- Student and parent previews are separate record types — a student cannot access a parent preview draft and vice versa.
- Preview drafts reference the `simulationRunId` to associate preview content with a specific simulation run.

### Teacher/Admin Review Boundaries

Teachers and admins can review all simulation entities:

- **Simulation Readiness** — review-ready marking.
- **Simulation Plans** — review-ready and approve-for-future-use markings.
- **Simulation Runs** — review-ready marking after simulation completes.
- **Eligibility Checks** — review-ready marking.
- **Blocked Action Diagnostics** — review-ready and suppress markings.
- **Failure Injections** — review-ready, approve-for-future-use, suppress, block.
- **Simulation Results** — review-ready marking.
- **Teacher Simulation Reviews** — dedicated teacher review records with their own lifecycle (draft -> review_ready -> approved_for_future_use -> suppress/block/void).
- **Student/Parent Preview Drafts** — review-ready and approve-for-future-use.
- **Readiness Verdicts** — review-ready and approve-for-future-use.
- **Simulation Summaries** — refresh, stale, block, void.

Student, parent, guest, and unknown roles are blocked from all entity operations by `RecoveryOutcomeExecutionSimulationPolicyEnforcer`.

### Audit and Idempotency Behavior

**Audit**: Every entity state transition, creation, and decision is recorded in `RecoveryOutcomeExecutionSimulationAuditRecord`. The audit record captures:
- Actor ID, role, and school context.
- Which entity type and ID was affected.
- Event type and decision.
- Safe summary text (never raw data).
- Reason codes and metadata JSON.
- Correlation ID and request ID for traceability.

**Idempotency**: Every mutating operation checks `x-idempotency-key` via `RecoveryOutcomeExecutionSimulationIdempotencyService`. If a key has already been processed, the operation returns `DUPLICATE` status instead of re-executing. Idempotency records track:
- Operation name, school ID, and idempotency key.
- Request hash for content integrity.
- Status (`in_progress`, `completed`, `expired`, `blocked`).
- Resource type and ID of the created/modified record.
- Expiration timestamp for automatic cleanup.

### What Remains Deferred After Package 21

The following capabilities are intentionally out of scope for Package 21 and deferred to future packages:

1. **Live execution of recovery actions** — Package 21 simulates what would happen but never executes.
2. **Live score, mastery, or grade mutation** — Blocked by policy.
3. **Live notification sending** (email, SMS, push, WhatsApp, in-app) — Simulated in result details only.
4. **Live assignment or homework creation** — Simulated in preview content only.
5. **Live recovery activation, completion, or closure** — Blocked by policy.
6. **Live portal publishing or external sync** — Blocked by policy.
7. **AI narrative generation, AI question generation, answer key generation** — Blocked by policy.
8. **OCR, PDF, or HTML export** — Blocked by policy.
9. **Calendar event creation** — Blocked by policy.
10. **Provider secrets, portal URLs, access tokens, signed URLs** — Prohibited by safety service.
11. **Direct integration with live learning mode runtimes** — Deferred to future execution layer.
12. **Live rollback execution** — Failure injection models failure, but no rollback is executed.
13. **Package 20 action draft graduation to live** — Package 21 can mark drafts as `approved_for_future_use` but never graduates them to live execution.

## Pipeline Position

```
Package 16 (Follow-up Cases) ──> Package 17 (Recovery Planner)
                                        │
                                        v
                                Package 18 (Progress Observation)
                                        │
                                        v
                                Package 19 (Decision Gate)
                                        │
                                        v
                                Package 20 (Action Preparation)
                                        │
                                        v
                    ┌─────────────────────────────────────────────────────┐
                    │  Package 21 (Execution Simulation)                  │  ← YOU ARE HERE
                    │  simulation readiness, plans, runs, steps           │
                    │  eligibility gates, blocked diagnostics,            │
                    │  failure injection, results, reviews,               │
                    │  previews, verdicts, summaries                      │
                    │  simulation-only — no live execution                │
                    └─────────────────────────────────────────────────────┘
                                        │
                                        v
                            Future Package 22+
                            (Live Action Execution)
```

## Scope Boundaries

### Owned by Package 21

- Simulation readiness assessment and tracking
- Simulation plan definition and management
- Simulation run creation, execution modeling, and lifecycle
- Simulation step tracing with per-step status
- Eligibility check gates for action bundles
- Blocked-action diagnostic recording and review
- Failure injection scenario creation and modeling
- Simulation result recording and review
- Teacher simulation reviews with full lifecycle
- Student preview drafts with safe content
- Parent preview drafts with safe content
- Readiness verdicts aggregating simulation outcomes
- Simulation summaries with rollups and top findings
- Simulation-scoped audit and idempotency

### References from Package 17 (by ID only)

- `ResultRecoveryPlanRecord` — referenced as `resultRecoveryPlanId`

### References from Package 19 (by ID only)

- Decision draft records — referenced indirectly through Package 20 action drafts

### References from Package 20 (by ID only)

- `RecoveryOutcomeActionReadinessRecord` — referenced as `recoveryOutcomeActionReadinessId`
- `RecoveryOutcomeActionBundleRecord` — referenced as `recoveryOutcomeActionBundleId`
- `RecoveryContinuationActionDraftRecord` — referenced as `recoveryContinuationActionDraftId`
- `RecoveryIntensificationActionDraftRecord` — referenced as `recoveryIntensificationActionDraftId`
- `RecoveryPauseActionDraftRecord` — referenced as `recoveryPauseActionDraftId`
- `RecoveryClosureActionDraftRecord` — referenced as `recoveryClosureActionDraftId`

## Entities

| # | Entity | Statuses | Purpose |
|---|--------|----------|---------|
| 1 | RecoveryOutcomeExecutionSimulationReadinessRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Assess whether an action bundle is ready for simulation |
| 2 | RecoveryOutcomeExecutionSimulationPlanRecord | draft, simulation_ready, review_ready, approved_for_future_use, suppressed, blocked, void | Define simulation parameters and associate action drafts |
| 3 | RecoveryOutcomeExecutionSimulationRunRecord | draft, simulating, simulated, review_ready, suppressed, blocked, void | Execute a simulation plan as a run |
| 4 | RecoveryOutcomeExecutionSimulationStepRecord | pending, simulated, blocked, void | Record individual simulation steps with per-step status |
| 5 | RecoveryOutcomeExecutionEligibilityCheckRecord | draft, review_ready, void | Model whether an action bundle is eligible for live execution |
| 6 | RecoveryOutcomeExecutionBlockedActionDiagnosticRecord | draft, review_ready, suppressed, void | Capture why specific actions would be blocked |
| 7 | RecoveryOutcomeExecutionFailureInjectionRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Model failure scenarios for simulation testing |
| 8 | RecoveryOutcomeExecutionSimulationResultRecord | draft, review_ready, void | Capture simulation outcome results |
| 9 | RecoveryOutcomeExecutionTeacherReviewRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Record teacher reviews of simulation runs |
| 10 | RecoveryOutcomeExecutionStudentPreviewDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Prepare safe student-facing preview of simulation results |
| 11 | RecoveryOutcomeExecutionParentPreviewDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Prepare safe parent-facing preview of simulation results |
| 12 | RecoveryOutcomeExecutionReadinessVerdictRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Aggregate verdict on execution readiness |
| 13 | RecoveryOutcomeExecutionSimulationSummaryRecord | active, stale, blocked, void | Rollup of simulation counts and top findings |
| 14 | RecoveryOutcomeExecutionSimulationAuditRecord | — (append-only event log) | Audit trail for all simulation operations |
| 15 | RecoveryOutcomeExecutionSimulationIdempotencyRecord | in_progress, completed, expired, blocked | Idempotency tracking for mutating operations |

## Safety Guarantees

1. No live score, mastery, or grade mutation from any Package 21 operation
2. No live notification sending (email, SMS, push, WhatsApp, in-app)
3. No live assignment creation (homework, practice, revision)
4. No live recovery activation, live recovery completion, or live recovery closure
5. No calendar event creation or external sync
6. No AI narrative generation or answer key generation
7. No OCR, PDF, or HTML export of simulation content
8. No provider secrets, portal URLs, or access tokens stored
9. No portal publishing, no signed URL generation
10. 15 policy families enforce all forbidden categories via `RecoveryOutcomeExecutionSimulationPolicyEnforcer` (including NO_LIVE_EXECUTION, NO_LIVE_ACTIVATION, NO_LIVE_COMPLETION, NO_LIVE_CLOSURE, NO_LIVE_ASSIGNMENT, NO_LIVE_NOTIFICATION, NO_PORTAL_PUBLISH, NO_SCORE_MUTATION, NO_MASTERY_MUTATION, NO_REGRADE_EXECUTION, NO_GENERATED_QUESTION, NO_AI_NARRATIVE, NO_OCR, NO_PDF, NO_EXTERNAL_SYNC — all with empty allowedRoles)
11. All content passes through `RecoveryOutcomeExecutionSimulationSafetyService` before persistence
12. Role-based policy enforcement (teacher+ roles allowed, student/parent/guest blocked)
13. School context required for all operations
14. Idempotency key prevents duplicate operations
15. Full audit trail for all entity state transitions
16. InMemory repositories used by default (no accidental production data mutation)

## Route Mount

```
Path: /api/question-bank/recovery-outcome-execution-simulation
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```
