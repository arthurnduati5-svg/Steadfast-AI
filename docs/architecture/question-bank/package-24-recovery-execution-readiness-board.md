# Package 24: Controlled Recovery Execution Readiness Board

## Purpose
The readiness board provides teachers and admins with a safe, role-scoped, end-to-end backend read model of each student recovery lifecycle. It aggregates references from Packages 17 through 23 into a single board view with snapshots, lanes, cards, risk signals, blockers, governance notes, queues, and summaries.

## How Package 24 Consumes Packages 17-23
Package 24 references Package 17 through Package 23 records by ID only (as foreign key references in sourceRefsJson or dedicated fields). It does not import, duplicate, or extend any existing model. It creates its own board-specific records that reference prior package records.

## Why Package 24 is NOT Live Execution
- It does not execute recovery actions.
- It does not authorize live execution.
- It does not close recovery lifecycles.
- It does not send notifications.
- It does not publish to portals.
- It does not mutate scores or mastery.
- It does not generate questions, answer keys, AI narratives, OCR, PDFs, or HTML exports.
- It does not sync with external systems.
- It is a governed, read-model board only.

## Board Snapshot Lifecycle
1. draft -> refreshing -> ready -> stale -> review_ready
2. Any state can transition to blocked or suppressed or void

## Board Lane Lifecycle
Required lane keys: planning, progress_observation, outcome_decision, action_preparation, execution_simulation, closure_readiness, authorization_preview, board_summary

## Board Card Lifecycle
Cards represent individual items on the board. Statuses: draft, ready, needs_teacher_review, needs_admin_review, risk_flagged, blocked, suppressed, void.

## Filter Preset Lifecycle
Saved filter configurations for teachers/admins. Statuses: draft, active, suppressed, void.

## Risk Signal Lifecycle
Risk signals note potential concerns at board/snapshot/student level with risk levels. Statuses: draft, review_ready, suppressed, blocked, void.

## Blocker Lifecycle
Blockers prevent board readiness progression. Statuses: open, review_ready, resolved, suppressed, void.

## Governance Note Lifecycle
Admin review notes tied to board entities. Statuses: draft, review_ready, suppressed, void.

## Role Projection Boundaries
Role projections are role-scoped views that define what each role can see. Projections are read-model boundaries only.

## Teacher/Admin Queue Boundaries
Teacher queues show teacher-scoped items. Admin queues show admin-scoped items. Neither contains raw student answers, answer keys, or hidden reasoning.

## Student/Parent Safe Draft Boundaries
Safe status drafts are prepared for potential future student/parent review. They are never sent, never displayed, and never published by Package 24.

## Refresh Job Boundaries
Refresh jobs update board metadata (snapshots, lanes, cards, blockers) but never execute live actions.

## Board Summary Behavior
Summaries are read models only. They aggregate board state for reporting.

## Audit and Idempotency
All mutating operations create audit events. Idempotency keys prevent duplicate mutations.

## Deferred After Package 24
- Live execution authorization
- Live recovery activation
- Notification dispatch
- Portal publishing (student, parent, teacher dashboards)
- Frontend Board UI
- Score mutation
- Mastery mutation
- Regrade execution
- AI narrative generation
- OCR, PDF, HTML export
- External sync
