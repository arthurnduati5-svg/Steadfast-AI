# Package 19: Recovery Outcome Decision Gate

## Purpose

Serve as a controlled decision airlock between recovery evidence collection (Package 18) and any future live action execution layer. Package 19 owns the drafting, readiness assessment, criteria evaluation, teacher review, and summary of outcome decisions — without mutating live scores, mastery, notifications, or any live learning state.

## Design Principles

- **Draft-only decisions**: All outcome decisions are created as drafts. No decision record results in a live state mutation.
- **Teacher review required**: Every decision packet must pass through a teacher review step before it can be marked approved for future use.
- **No live mutations**: Package 19 never writes scores, grades, mastery levels, live progress updates, notifications, assignments, or calendar events.
- **Reference by ID only**: All references to Package 17 plans, Package 18 observations/evaluations/evidence, and Package 16 follow-up cases are by ID only. Content is never duplicated.
- **Idempotent**: All mutating operations accept `x-idempotency-key` to prevent duplicate processing.
- **Full audit trail**: Every status transition, creation, and decision is audited via `RecoveryOutcomeAuditRecord`.
- **Safety-gated**: All content passes through `RecoveryOutcomeSafetyService` before persistence.

## Pipeline Position

```
Package 16 (Follow-up Cases) ──> Package 17 (Recovery Planner)
                                      │
                                      v
                              Package 18 (Progress Observation)
                                      │
                                      v
                          ┌───────────────────────────┐
                          │  Package 19 (Decision Gate)│  ← YOU ARE HERE
                          │  draft decisions only      │
                          │  teacher review required   │
                          │  no live actions            │
                          └───────────────────────────┘
                                      │
                                      v
                          Future Package 20+
                          (Live Action Execution)
```

## Scope Boundaries

### Owned by Package 19

- Decision readiness assessment and tracking
- Exit criteria definition and evaluation
- Four decision draft types: continuation, intensification, pause, closure
- Teacher review packets for outcome decisions
- Student-facing next-step action drafts
- Parent-facing update drafts
- Outcome decision summaries (aggregate rollups)
- Outcome-scoped audit and idempotency

### References from Package 17 (by ID only)

- `ResultRecoveryPlanRecord` — referenced as `resultRecoveryPlanId`
- `ResultRecoveryCheckpointRecord` — referenced in source refs
- `ResultRecoverySummaryRecord` — referenced as `recoveryEvidenceRollupId` equivalent
- `ResultRecoveryTeacherReviewPacketRecord` — referenced by ID, never duplicated

### References from Package 18 (by ID only)

- `RecoveryProgressSummaryRecord` — referenced as `recoveryProgressSummaryId`
- `RecoveryEvidenceRollupRecord` — referenced as `recoveryEvidenceRollupId`
- `RecoveryOutcomeEvidenceRecord` — referenced by ID, never duplicated
- `RecoveryTeacherReviewDecisionRecord` — referenced in source refs

### References from Package 16

- Follow-up case IDs stored in `sourceRefsJson` only — no direct foreign key

### References from Package 10

- School identity via `schoolId` — no other Package 10 data is consumed

## Entities

| # | Entity | Statuses | Purpose |
|---|--------|----------|---------|
| 1 | RecoveryOutcomeDecisionReadinessRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Assess whether a recovery plan is ready for an outcome decision |
| 2 | RecoveryExitCriteriaRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Define measurable criteria that signal recovery readiness |
| 3 | RecoveryExitCriteriaEvaluationRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Evaluate one or more exit criteria against evidence |
| 4 | RecoveryContinuationDecisionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a decision to continue the current recovery plan |
| 5 | RecoveryIntensificationDecisionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a decision to intensify recovery support |
| 6 | RecoveryPauseDecisionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a decision to pause the recovery plan |
| 7 | RecoveryClosureDecisionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a decision to close/graduate the recovery plan |
| 8 | RecoveryOutcomeTeacherReviewPacketRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Bundle readiness + criteria + decision drafts for teacher review |
| 9 | RecoveryOutcomeStudentNextStepDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft student-facing next-step action suggestions |
| 10 | RecoveryOutcomeParentUpdateDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft parent-facing progress update summaries |
| 11 | RecoveryOutcomeDecisionSummaryRecord | active, stale, blocked, void | Aggregate rollup of decision counts and top decisions per scope |
| 12 | RecoveryOutcomeAuditRecord | — (append-only event log) | Audit trail for all outcome decision operations |
| 13 | RecoveryOutcomeIdempotencyRecord | in_progress, completed, expired, blocked | Idempotency tracking for mutating operations |

## Safety Guarantees

1. No live score, mastery, or grade mutation from any Package 19 operation
2. No live notification sending (email, SMS, push, WhatsApp, in-app)
3. No live assignment creation (homework, practice, revision)
4. No calendar event creation or external sync
5. No AI narrative generation or answer key generation
6. No OCR, PDF, or HTML export of decision content
7. No provider secrets, portal URLs, or access tokens stored
8. All content passes through `RecoveryOutcomeSafetyService` before persistence
9. Role-based policy enforcement via `RecoveryOutcomePolicyEnforcer` (teacher+ roles allowed, student/parent/guest blocked)
10. School context required for all operations
11. Idempotency key prevents duplicate operations
12. Full audit trail for all entity state transitions

## Key Design Decisions

### Draft-Only Architecture

All four decision draft types (continuation, intensification, pause, closure) are created in `draft` status. They cannot transition directly to a live execution state. The approved status is `approved_for_future_use`, which signals that a future Package 20+ executor may read and act on the draft.

### Teacher Review Required

Every outcome decision packet flows through `RecoveryOutcomeTeacherReviewPacketRecord`. The packet bundles the readiness assessment, one or more decision drafts, and optional evidence rollups. A teacher must mark the packet as `review_ready` and subsequently `approved_for_future_use` before any downstream consumer may act on the decisions.

### Idempotency

All mutating operations accept `x-idempotency-key` via header. If absent, a UUID is auto-generated. Completed keys return 409 CONFLICT. Idempotency records expire after a configurable TTL.

### Audit

Every creation, status transition, and policy decision is recorded in `RecoveryOutcomeAuditRecord`. The audit bridges to the centralized `DurableAuditEvent` model for operational visibility.

### No Duplication of Existing Models

Wherever a Package 17 or Package 18 record exists (e.g., teacher review packets, student reflection drafts, parent progress notes), Package 19 references them by ID rather than duplicating their content. The 13 Package 19 models are exclusively outcome-decision-scoped.

## Comparison to Packages 17 and 18

| Aspect | Package 17 (Planner) | Package 18 (Progress) | Package 19 (Decision Gate) |
|--------|---------------------|----------------------|---------------------------|
| Scope | Plan creation, steps, practice, checkpoints | Observation, evaluation, evidence, rollup | Decision readiness, criteria, decision drafts, review packets |
| Decisions | Plan-scoped review packets | Adjustment-scoped teacher decisions | Outcome-scoped decision gate with teacher review |
| Live mutations | None | None | None |
| Teacher review | Plan review packets | Adjustment decisions | Outcome decision packets |
| Consumer | Package 18 | Package 19 | Future Package 20+ |

## Route Mount

```
Path: /api/question-bank/recovery-outcome
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```
