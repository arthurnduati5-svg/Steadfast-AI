# Package 20: Controlled Recovery Outcome Action Preparation

## Purpose

Serve as a safe action preparation layer between Package 19 outcome decisions and any future live action execution layer. Package 20 owns the readiness assessment, bundle grouping, action draft creation (continuation, intensification, pause, closure), approval gates, mock activation queue, dry-run receipts, rollback plans, suppression rules, and action summaries — all as preparation-only records without executing any live activation, completion, closure, assignment, notification, portal publish, score/mastery mutation, AI, OCR, PDF, or external sync.

## Design Principles

- **Preparation-only**: All records are created as drafts or preparation statuses. No record can execute a live action within Package 20.
- **Draft-only action drafts**: All four action draft types (continuation, intensification, pause, closure) are created in `draft` status. They cannot transition to a live execution state.
- **No live mutations**: Package 20 never writes scores, grades, mastery levels, live progress updates, notifications, assignments, calendar events, portal content, or external integrations.
- **Reference by ID only**: All references to Package 17 plans, Package 18 observations/evaluations, Package 19 decision records are by ID only. Content is never duplicated.
- **Idempotent**: All mutating operations accept `x-idempotency-key` to prevent duplicate processing.
- **Full audit trail**: Every status transition, creation, and decision is audited via `RecoveryOutcomeActionAuditRecord`.
- **Safety-gated**: All content passes through `RecoveryOutcomeActionSafetyService` before persistence.
- **Draft-only action drafts**: All four action draft types (continuation, intensification, pause, closure) are created in `draft` status. They cannot transition directly to a live execution state. The approved status is `approved_for_future_use`, which signals that a future Package 21+ executor may read and act on the draft.

### Approval Gates

Approval gates define preconditions that must be satisfied before an action bundle can proceed. Gates support `satisfied`, `blocked`, and `void` statuses. Multiple gates can be attached to a single bundle.

### Mock Activation Queue

A dry-run queue that simulates activation ordering without executing any live action. Queue items transition through `draft`, `dry_run_ready`, `suppressed`, `blocked`, `void` — never to a live execution state.

### Dry-Run Receipts

Receipts generated from mock activation queue processing. They record what would have happened without actually executing. Receipts capture `simulated_success`, `simulated_blocked`, and `simulated_error` results.

### Rollback Plans

Pre-defined rollback plans that describe how to reverse actions if needed in the future. They are preparation records only — no rollback logic is executed within Package 20.

### Suppression Rules

Rules that define conditions under which certain actions should be suppressed. Supports `active`, `suppressed`, `blocked`, and `void` statuses. Rules are metadata-only and no suppression logic is executed within Package 20.

### Action Summaries

Read-model rollups that aggregate action counts and top actions per scope. Supports `active`, `stale`, `blocked`, and `void` statuses.

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
                   ┌───────────────────────────────────────────┐
                   │  Package 20 (Action Preparation)          │  ← YOU ARE HERE
                   │  action readiness, bundles, drafts        │
                   │  approval gates, mock queue, dry-run      │
                   │  rollback plans, suppression rules        │
                   │  preparation-only — no live execution     │
                   └───────────────────────────────────────────┘
                                       │
                                       v
                           Future Package 21+
                           (Live Action Execution)
```

## Scope Boundaries

### Owned by Package 20

- Action readiness assessment and tracking
- Action bundle grouping and management
- Four action draft types: continuation, intensification, pause, closure
- Approval gate definition and status management
- Mock activation queue items (preparation only)
- Dry-run receipts (simulation results)
- Rollback plans (preparation records)
- Suppression rules (conditions for future suppression)
- Action summaries (read-model rollups)
- Action-scoped audit and idempotency

### References from Package 17 (by ID only)

- `ResultRecoveryPlanRecord` — referenced as `resultRecoveryPlanId`
- `ResultRecoveryCheckpointRecord` — referenced in source refs
- `ResultRecoverySummaryRecord` — referenced as rollup equivalent
- `ResultRecoveryTeacherReviewPacketRecord` — referenced by ID, never duplicated

### References from Package 18 (by ID only)

- `RecoveryProgressSummaryRecord` — referenced as `recoveryOutcomeProgressSummaryId`
- `RecoveryEvidenceRollupRecord` — referenced as `recoveryOutcomeEvidenceRollupId`

### References from Package 19 (by ID only)

- `RecoveryOutcomeDecisionReadinessRecord` — referenced as `recoveryOutcomeDecisionReadinessId`
- `RecoveryContinuationDecisionDraftRecord` — referenced as `decisionDraftId` in action draft
- `RecoveryIntensificationDecisionDraftRecord` — referenced as `decisionDraftId`
- `RecoveryPauseDecisionDraftRecord` — referenced as `decisionDraftId`
- `RecoveryClosureDecisionDraftRecord` — referenced as `decisionDraftId`

## Entities

| # | Entity | Statuses | Purpose |
|---|--------|----------|---------|
| 1 | RecoveryOutcomeActionReadinessRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Assess whether a recovery plan is ready for action preparation |
| 2 | RecoveryOutcomeActionBundleRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Group related action drafts into a bundle for coordinated treatment |
| 3 | RecoveryContinuationActionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a continuation action for future execution |
| 4 | RecoveryIntensificationActionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft an intensification action for future execution |
| 5 | RecoveryPauseActionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a pause action for future execution |
| 6 | RecoveryClosureActionDraftRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Draft a closure action for future execution |
| 7 | RecoveryOutcomeApprovalGateRecord | active, satisfied, blocked, void | Define preconditions that must be met before action execution |
| 8 | RecoveryOutcomeMockActivationQueueRecord | draft, dry_run_ready, suppressed, blocked, void | Mock queue items simulating activation ordering |
| 9 | RecoveryOutcomeDryRunReceiptRecord | simulated_success, simulated_blocked, simulated_error, void | Receipts from mock activation queue dry-runs |
| 10 | RecoveryOutcomeRollbackPlanRecord | draft, review_ready, approved_for_future_use, suppressed, blocked, void | Pre-defined rollback plans for future reversal |
| 11 | RecoveryOutcomeSuppressionRuleRecord | active, suppressed, blocked, void | Rules defining action suppression conditions |
| 12 | RecoveryOutcomeActionSummaryRecord | active, stale, blocked, void | Aggregate rollup of action counts and top actions per scope |
| 13 | RecoveryOutcomeActionAuditRecord | — (append-only event log) | Audit trail for all action preparation operations |
| 14 | RecoveryOutcomeActionIdempotencyRecord | in_progress, completed, expired, blocked | Idempotency tracking for mutating operations |

## Safety Guarantees

1. No live score, mastery, or grade mutation from any Package 20 operation
2. No live notification sending (email, SMS, push, WhatsApp, in-app)
3. No live assignment creation (homework, practice, revision)
4. No live recovery activation, live recovery completion, or live recovery closure
5. No calendar event creation or external sync
6. No AI narrative generation or answer key generation
7. No OCR, PDF, or HTML export of action content
8. No provider secrets, portal URLs, or access tokens stored
9. No portal publishing, no signed URL generation
10. 27 policy families enforce all forbidden categories via `RecoveryOutcomeActionPolicyEnforcer`
11. All content passes through `RecoveryOutcomeActionSafetyService` before persistence
12. Role-based policy enforcement (teacher+ roles allowed, student/parent/guest blocked)
13. School context required for all operations
14. Idempotency key prevents duplicate operations
15. Full audit trail for all entity state transitions
16. InMemory repositories used by default (no accidental production data mutation)

## Key Design Decisions

### Preparation-Only Architecture

All Package 20 entities are preparation records. No entity can transition to a live execution state within Package 20. The `approved_for_future_use` status signals that a future Package 21+ executor may read and act on the record.

### Four Draft Types with Shared Base

All four action draft types (continuation, intensification, pause, closure) share a common base contract (`RecoveryOutcomeActionDraftBase`) with type-specific fields in `draftTypeSpecificJson`. Each draft references the corresponding Package 19 decision draft by ID.

### Approval Gates as Precondition Registry

Approval gates are standalone preconditions registered against action bundles. A bundle may have zero or more gates. Gates are `satisfied`, `blocked`, or `void` — they never execute live checks.

### Mock Activation Queue

The mock activation queue is an ordered list of items that represent actions in the order they would be activated. Items transition through `draft` → `dry_run_ready` → (receipt generated) and can be `suppressed`, `blocked`, or `void`. No item activates anything live.

### Dry-Run Receipts as Simulation Logs

Receipts record what would have happened during a mock activation. They store `simulatedSuccess`, `simulatedBlocked`, and `simulatedError` results with detailed simulation data. Receipts are the output of the mock activation queue, not real execution logs.

### Rollback Plans as Preparation Records

Rollback plans describe steps to reverse actions if needed. They are created as `draft`, reviewed, and approved for future use. The rollback steps are stored as JSON — no rollback logic executes within Package 20.

### Suppression Rules as Metadata Conditions

Suppression rules define conditions (e.g., "suppress notification if score below 40") as metadata. Rules are `active`, `suppressed`, `blocked`, or `void`. The actual suppression enforcement is deferred to a future execution layer.

### No Duplication of Existing Models

Wherever a Package 17, 18, or 19 record exists, Package 20 references it by ID rather than duplicating its content. The 14 Package 20 models are exclusively action-preparation-scoped.

## Comparison to Package 19

| Aspect | Package 19 (Decision Gate) | Package 20 (Action Preparation) |
|--------|---------------------------|----------------------------------|
| Scope | Decision readiness, criteria, decision drafts, review packets, summaries | Action readiness, bundles, action drafts, approval gates, mock queue, dry-run, rollback, suppression, summaries |
| Entity count | 13 | 14 |
| Decision type | Outcome decisions (drafts) | Action preparation (drafts) |
| Teacher review | Review packets for decisions | Review-ready status on readiness, bundles, rollback plans |
| Mock execution | None | Mock activation queue + dry-run receipts |
| Rollback | None | Rollback plan preparation |
| Suppression | Suppression on decision entities | Dedicated suppression rule entity |
| Live mutations | None | None |
| Consumer | Package 20 | Future Package 21+ |

## Route Mount

```
Path: /api/question-bank/recovery-outcome-action
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```
