# Package 22: Recovery Lifecycle Closure Readiness

## Purpose

Serve as a lifecycle closing ledger that organizes, reviews, and readies all post-simulation artifacts from Package 21 for potential future live execution — without performing any live closure, live execution, live activation, or live assignment. Package 22 owns the closure readiness assessment, post-simulation handoff packets, next-cycle recommendation drafts, deferred integration tickets, unresolved risk register records, student closure reflection drafts, parent closure guidance drafts, teacher closure review packets, admin governance review packets, archive manifests, and final lifecycle summaries. All records are closure-readiness-only — no live closure, live score mutation, live mastery mutation, live notification, live assignment, portal publish, or external sync occurs within Package 22.

## Design Principles

- **Closure-readiness-only**: All records organize and review simulation artifacts for future use without performing any live execution. Closure readiness transitions through `draft` -> `review_ready` -> `handoff_ready` -> `approved_for_future_use` — never to a live closure or live execution state.
- **No live mutations**: Package 22 never writes scores, grades, mastery levels, live progress updates, notifications, assignments, calendar events, portal content, or external integrations.
- **Reference by ID only**: All references to Package 21 simulation records are by ID only. Content is never duplicated.
- **Idempotent**: All mutating operations accept `x-idempotency-key` to prevent duplicate processing.
- **Full audit trail**: Every status transition, creation, and decision is audited via `RecoveryLifecycleClosureAuditRecord`.
- **Safety-gated**: All content passes through `RecoveryLifecycleClosureSafetyService` before persistence.
- **Policy-enforced**: `RecoveryLifecycleClosurePolicyEnforcer` enforces role-based access and blocks live execution/closure categories across all operations.

## How Package 22 Consumes Package 21 by Reference

Package 21 produces simulation readiness records, simulation runs, simulation results, readiness verdicts, simulation summaries, teacher reviews, student/parent preview drafts, and all other simulation artifacts. Package 22 does NOT duplicate any of these. Instead:

- `RecoveryLifecycleClosureReadinessRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 simulation run by ID.
- `RecoveryLifecycleClosureReadinessRecord.recoveryOutcomeExecutionSimulationResultId` references Package 21 simulation result by ID.
- `RecoveryLifecycleClosureReadinessRecord.recoveryOutcomeExecutionReadinessVerdictId` references Package 21 readiness verdict by ID.
- `RecoveryPostSimulationHandoffPacketRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 simulation run by ID.
- `RecoveryPostSimulationHandoffPacketRecord.recoveryOutcomeExecutionSimulationResultId` references Package 21 simulation result by ID.
- `RecoveryNextCycleRecommendationDraftRecord.recoveryOutcomeExecutionSimulationRunId` and `recoveryOutcomeExecutionReadinessVerdictId` reference Package 21 by ID.
- `RecoveryDeferredIntegrationTicketRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 by ID.
- `RecoveryUnresolvedRiskRegisterRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 by ID.
- `RecoveryStudentClosureReflectionDraftRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 by ID.
- `RecoveryParentClosureGuidanceDraftRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 by ID.
- `RecoveryTeacherClosureReviewPacketRecord.recoveryOutcomeExecutionSimulationRunId` and `recoveryOutcomeExecutionReadinessVerdictId` reference Package 21 by ID.
- `RecoveryAdminGovernanceReviewPacketRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 by ID.
- `RecoveryArchiveManifestRecord.recoveryOutcomeExecutionSimulationRunId` references Package 21 by ID.
- `RecoveryFinalLifecycleSummaryRecord.recoveryOutcomeExecutionSimulationSummaryId` references Package 21 simulation summary by ID.

Package 22 never stores the content of Package 21 records. All closure-readiness metadata is stored in `closureReadinessParametersJson`, `handoffDetailsJson`, `recommendationDetailsJson`, `riskDetailsJson`, `reflectionContentJson`, `guidanceContentJson`, `reviewFindingsJson`, `governanceFindingsJson`, `manifestMetadataJson`, and `summaryRollupJson` fields unique to the closure-readiness context.

## Why Package 22 Is NOT Live Closure or Live Execution

Package 22 is explicitly a closure-readiness ledger layer. It differs from live closure and live execution in every dimension:

| Dimension | Package 22 (Closure Readiness) | Future Live Closure/Execution |
|-----------|--------------------------------|------------------------------|
| Action effect | Organizes artifacts for review | Executes the closure/action |
| Closure execution | None | Would execute live recovery closure |
| Lifecycle closure | None | Would close the lifecycle |
| Score mutation | None | Would update scores |
| Mastery mutation | None | Would update mastery |
| Notification | None | Would send real notifications |
| Assignment | None | Would create real assignments |
| Portal publish | None | Would publish to portals |
| External sync | None | Would sync externally |
| Live recovery activation | None | Would activate live recovery |
| Policy enforcement | Blocks all live execution/closure categories | Live execution policies would apply |

The `RECOVERY_LIFECYCLE_NO_LIVE_CLOSURE`, `RECOVERY_LIFECYCLE_NO_LIVE_EXECUTION`, `RECOVERY_LIFECYCLE_NO_LIVE_ACTIVATION`, `NO_LIVE_ASSIGNMENT`, `NO_LIVE_NOTIFICATION`, `NO_PORTAL_PUBLISH`, `NO_SCORE_MUTATION`, `NO_MASTERY_MUTATION`, `NO_REGRADE_EXECUTION`, `NO_GENERATED_QUESTION`, `NO_AI_NARRATIVE`, `NO_OCR`, `NO_PDF`, and `NO_EXTERNAL_SYNC` policy families all have empty `allowedRoles` — meaning no role can ever perform these operations within Package 22.

## Closure Readiness Lifecycle

### Readiness -> Handoff Packet -> Reviews -> Archive -> Summary

```
  [Closure Readiness]
    │  draft -> review_ready -> handoff_ready -> approved_for_future_use
    │  (or suppressed / blocked / void)
    v
  [Post-Simulation Handoff Packet]
    │  draft -> review_ready -> handoff_ready -> approved_for_future_use
    │  (or suppressed / blocked / void)
    │
    ├── [Next-Cycle Recommendation] (per handoff)
    │     draft -> review_ready -> approved_for_future_use
    │     (or suppressed / blocked / void)
    │
    ├── [Deferred Integration Ticket] (per handoff)
    │     draft -> review_ready -> approved_for_future_use
    │     (or suppressed / blocked / void)
    │
    ├── [Unresolved Risk Register] (per handoff)
    │     draft -> review_ready -> approved_for_future_use
    │     (or suppressed / blocked / void)
    │
    v
  [Reviews]
    │
    ├── [Student Closure Reflection Draft]
    │     draft -> review_ready (or suppressed / void)
    │
    ├── [Parent Closure Guidance Draft]
    │     draft -> review_ready (or suppressed / void)
    │
    ├── [Teacher Closure Review Packet]
    │     draft -> review_ready -> approved_for_future_use
    │     (or suppressed / blocked / void)
    │
    ├── [Admin Governance Review Packet]
    │     draft -> review_ready -> approved_for_future_use
    │     (or suppressed / blocked / void)
    │
    v
  [Archive Manifest]
    │  draft -> review_ready -> approved_for_future_use
    │  (or suppressed / blocked / void)
    v
  [Final Lifecycle Summary]
       active -> stale (or blocked / void)
       (refresh transitions stale -> active)
```

1. **Closure Readiness** — Assess whether the simulation-run artifacts are ready for lifecycle closure review. References Package 21 simulation run, simulation result, and readiness verdict by ID. Statuses: `draft`, `review_ready`, `handoff_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

2. **Post-Simulation Handoff Packet** — Bundle of artifacts to hand off from simulation to closure readiness review. Contains references to the closure readiness record and simulation run. Statuses: `draft`, `review_ready`, `handoff_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

3. **Next-Cycle Recommendation Draft** — Teacher-prepared recommendation for what should happen in the next academic or recovery cycle based on simulation results. Does not assign work or trigger any live action. Statuses: `draft`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

4. **Deferred Integration Ticket** — Tracks integration work items that are known but not yet actionable. Does not sync with external ticketing systems. Statuses: `draft`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

5. **Unresolved Risk Register** — Records risks identified during simulation that remain unresolved. Does not trigger any live action or alert. Statuses: `draft`, `review_ready`, `approved_for_future_use`, `suppressed`, `blocked`, `void`.

### Student Closure Reflection Draft Boundaries

Package 22 supports **reflection drafts** for students through `RecoveryStudentClosureReflectionDraftRecord`.

- Reflection drafts contain Socratic-style prompts and safe summary text — they NEVER contain raw scores, raw answers, teacher-only notes, hidden reasoning, live assignment data, unreleased grades, or diagnostic labels.
- Reflection drafts are created by teacher+ roles (not by students directly).
- Reflections are NOT sent to students — they are drafts for future review and potential use.
- Status lifecycle: `draft` -> `review_ready` (or `suppressed` / `void`).
- Reflection drafts reference the `recoveryOutcomeExecutionSimulationRunId` to associate reflection content with a specific simulation run.

### Parent Closure Guidance Draft Boundaries

Package 22 supports **guidance drafts** for parents through `RecoveryParentClosureGuidanceDraftRecord`.

- Guidance drafts contain parent-safe language and general progress summaries — they NEVER contain raw scores, raw answers, teacher-only notes, hidden reasoning, unreleased grades, or diagnostic disclosures.
- Guidance drafts are created by teacher+ roles (not by parents directly).
- Guidance drafts are NOT sent to parents — they are drafts for future review and potential use.
- Status lifecycle: `draft` -> `review_ready` (or `suppressed` / `void`).
- Guidance drafts reference the `recoveryOutcomeExecutionSimulationRunId` to associate guidance content with a specific simulation run.

### Teacher Closure Review Packet Boundaries

Teachers can create closure review packets that document their assessment of simulation outcomes:

- Review packets contain teacher findings, observations, and recommendations — they NEVER contain live closure execution commands, live execution triggers, or final approval for live action.
- Review packets do NOT close recovery live — they are readiness artifacts for future closure consideration.
- Status lifecycle: `draft` -> `review_ready` -> `approved_for_future_use` (or `suppressed` / `blocked` / `void`).

### Admin Governance Review Packet Boundaries

Admins can create governance review packets that document institutional oversight:

- Governance packets contain admin findings, compliance observations, and governance recommendations — they NEVER contain live execution approval, closure authorization, or score override commands.
- Governance packets do NOT approve live execution — they are governance readiness artifacts.
- Status lifecycle: `draft` -> `review_ready` -> `approved_for_future_use` (or `suppressed` / `blocked` / `void`).

### Archive Manifest Boundaries

Archive manifests capture metadata about what artifacts exist for a given lifecycle closure readiness cycle:

- Manifests contain metadata-only fields: counts of records by type, list of references, timestamps, and status rollups.
- Manifests NEVER contain PDF binary, HTML export, full record content, or student PII beyond references.
- Status lifecycle: `draft` -> `review_ready` -> `approved_for_future_use` (or `suppressed` / `blocked` / `void`).

### Final Lifecycle Summary Behavior

Final lifecycle summaries provide a read-model rollup of closure readiness state:

- Summaries aggregate counts and statuses across all Package 22 record types for a given scope.
- Summaries are read-model-only — they are not used to drive any live process.
- Statuses: `active` -> `stale` (or `blocked` / `void`). Refresh transitions `stale` -> `active`.
- Summaries are recalculated on refresh by querying current state — they are never pre-computed from stale data.

### Audit and Idempotency Behavior

**Audit**: Every entity state transition, creation, and decision is recorded in `RecoveryLifecycleClosureAuditRecord`. The audit record captures:
- Actor ID, role, and school context.
- Which entity type and ID was affected.
- Event type and decision.
- Safe summary text (never raw data).
- Reason codes and metadata JSON.
- Correlation ID and request ID for traceability.

**Idempotency**: Every mutating operation checks `x-idempotency-key` via `RecoveryLifecycleClosureIdempotencyService`. If a key has already been processed, the operation returns `DUPLICATE` status instead of re-executing. Idempotency records track:
- Operation name, school ID, and idempotency key.
- Request hash for content integrity.
- Status (`in_progress`, `completed`, `expired`, `blocked`).
- Resource type and ID of the created/modified record.
- Expiration timestamp for automatic cleanup.

### What Remains Deferred After Package 22

The following capabilities are intentionally out of scope for Package 22 and deferred to future packages:

1. **Live recovery closure execution** — Package 22 organizes artifacts for closure but never executes closure.
2. **Live lifecycle closure** — Package 22 does not close any lifecycle — it only readies artifacts.
3. **Live score, mastery, or grade mutation** — Blocked by policy.
4. **Live notification sending** (email, SMS, push, WhatsApp, in-app) — Blocked by policy.
5. **Live assignment or homework creation** — Blocked by policy.
6. **Live recovery activation, completion, or live execution** — Blocked by policy.
7. **Live portal publishing or external sync** — Blocked by policy.
8. **AI narrative generation, AI question generation, answer key generation** — Blocked by policy.
9. **OCR, PDF, or HTML export** — Blocked by policy.
10. **Calendar event creation** — Blocked by policy.
11. **Provider secrets, portal URLs, access tokens, signed URLs** — Prohibited by safety service.
12. **Direct integration with live learning mode runtimes** — Deferred to future execution layer.
13. **External ticketing system sync** — Deferred integration tickets are internal only.
14. **Student/Parent direct delivery of reflection or guidance drafts** — Drafts are not sent — they are readiness artifacts.
15. **Final lifecycle closure execution** — Package 22 can mark items as `approved_for_future_use` but never closes the lifecycle live.

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
                                Package 21 (Execution Simulation)
                                        │
                                        v
                    ┌─────────────────────────────────────────────────────┐
                    │  Package 22 (Recovery Lifecycle Closure Readiness)  │  ← YOU ARE HERE
                    │  closure readiness, handoff packets,                │
                    │  next-cycle recommendations, deferred tickets,      │
                    │  unresolved risks, student reflections,             │
                    │  parent guidance, teacher/admin reviews,            │
                    │  archive manifests, final summaries                 │
                    │  closure-readiness-only — no live closure           │
                    └─────────────────────────────────────────────────────┘
                                        │
                                        v
                            Future Package 23+
                            (Live Closure Execution)
```

## Scope Boundaries

### Owned by Package 22

- Closure readiness assessment and tracking
- Post-simulation handoff packet definition and management
- Next-cycle recommendation drafts (does not assign work)
- Deferred integration tickets (does not sync externally)
- Unresolved risk register records (does not trigger live action)
- Student closure reflection drafts (Socratic, not sent)
- Parent closure guidance drafts (parent-safe, not sent)
- Teacher closure review packets (does not close recovery live)
- Admin governance review packets (does not approve live execution)
- Archive manifests (metadata-only, no PDF/HTML)
- Final lifecycle summaries (read model only)
- Closure-readiness-scoped audit and idempotency

### References from Package 21 (by ID only)

- `RecoveryOutcomeExecutionSimulationRunRecord` — referenced as `recoveryOutcomeExecutionSimulationRunId`
- `RecoveryOutcomeExecutionSimulationResultRecord` — referenced as `recoveryOutcomeExecutionSimulationResultId`
- `RecoveryOutcomeExecutionReadinessVerdictRecord` — referenced as `recoveryOutcomeExecutionReadinessVerdictId`
- `RecoveryOutcomeExecutionSimulationSummaryRecord` — referenced as `recoveryOutcomeExecutionSimulationSummaryId`

### References to Package 17, 18, 19, 20 (by ID only, transitively via Package 21)

Package 22 references all prior packages indirectly through Package 21 simulation record IDs. Direct content is never duplicated.

## Entities

| # | Entity | Statuses | Purpose |
|---|--------|----------|---------|
| 1 | RecoveryLifecycleClosureReadinessRecord | draft, review_ready, handoff_ready, approved_for_future_use, suppressed, blocked, void | Assess whether simulation-run artifacts are ready for lifecycle closure review |
| 2 | RecoveryPostSimulationHandoffPacketRecord | draft, review_ready, handoff_ready, approved_for_future_use, suppressed, blocked, void | Bundle artifacts for handoff from simulation to closure readiness review |
| 3 | RecoveryNextCycleRecommendationDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Teacher-prepared recommendation for next cycle (does not assign work) |
| 4 | RecoveryDeferredIntegrationTicketRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Track integration work items not yet actionable (no external sync) |
| 5 | RecoveryUnresolvedRiskRegisterRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Record unresolved risks (does not trigger live action) |
| 6 | RecoveryStudentClosureReflectionDraftRecord | draft, review_ready, suppressed, void | Socratic reflection draft for future student use (not sent) |
| 7 | RecoveryParentClosureGuidanceDraftRecord | draft, review_ready, suppressed, void | Parent-safe guidance draft for future use (not sent) |
| 8 | RecoveryTeacherClosureReviewPacketRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Teacher review packet (does not close recovery live) |
| 9 | RecoveryAdminGovernanceReviewPacketRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Admin governance packet (does not approve live execution) |
| 10 | RecoveryArchiveManifestRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Metadata-only archive manifest (no PDF/HTML) |
| 11 | RecoveryFinalLifecycleSummaryRecord | active, stale, blocked, void | Read-model rollup of closure readiness state |
| 12 | RecoveryLifecycleClosureAuditRecord | — (append-only event log) | Audit trail for all closure-readiness operations |
| 13 | RecoveryLifecycleClosureIdempotencyRecord | in_progress, completed, expired, blocked | Idempotency tracking for mutating operations |

## Safety Guarantees

1. No live score, mastery, or grade mutation from any Package 22 operation
2. No live notification sending (email, SMS, push, WhatsApp, in-app)
3. No live assignment creation (homework, practice, revision)
4. No live recovery activation, live recovery execution, or live recovery closure
5. No calendar event creation or external sync
6. No AI narrative generation or answer key generation
7. No OCR, PDF, or HTML export of closure-readiness content
8. No provider secrets, portal URLs, or access tokens stored
9. No portal publishing, no signed URL generation
10. 14 policy families enforce all forbidden categories via `RecoveryLifecycleClosurePolicyEnforcer` (including RECOVERY_LIFECYCLE_NO_LIVE_CLOSURE, RECOVERY_LIFECYCLE_NO_LIVE_EXECUTION, RECOVERY_LIFECYCLE_NO_LIVE_ACTIVATION, NO_LIVE_ASSIGNMENT, NO_LIVE_NOTIFICATION, NO_PORTAL_PUBLISH, NO_SCORE_MUTATION, NO_MASTERY_MUTATION, NO_REGRADE_EXECUTION, NO_GENERATED_QUESTION, NO_AI_NARRATIVE, NO_OCR, NO_PDF, NO_EXTERNAL_SYNC — all with empty allowedRoles)
11. All content passes through `RecoveryLifecycleClosureSafetyService` before persistence
12. Role-based policy enforcement (teacher+ roles allowed, student/parent/guest blocked)
13. School context required for all operations
14. Idempotency key prevents duplicate operations
15. Full audit trail for all entity state transitions
16. InMemory repositories used by default (no accidental production data mutation)

## Route Mount

```
Path: /api/question-bank/recovery-lifecycle-closure
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```
