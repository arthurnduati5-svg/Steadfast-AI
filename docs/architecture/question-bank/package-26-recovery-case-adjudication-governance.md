# Package 26 — Recovery Case Adjudication and Review Governance

## Mission

Package 26 provides a **human judgment governance layer** for recovery case review. It enables teachers, lead teachers, department heads, and administrators to conduct structured, audited, and deterministic review of triaged recovery cases. Package 26 produces **governance metadata only** — it never executes live actions, never mutates upstream package records, and never performs operational dispatch.

## Pipeline Position

```
Pkg 24 (Readiness Board Cards)
  → Pkg 25 (Triage + Priority + Queue)
    → Pkg 26 (Adjudication + Review Governance) ← YOU ARE HERE
      → Pkg 27+ (Live Execution Gate — future)
```

Package 26 consumes **Package 25 queue item references** as its primary input. Every adjudication record is bound to a `queueItemId` from Pkg 25. It also reads Pkg 25 priority assessments, fairness checks, triage readiness records, and queue snapshots by reference. Pkg 24 board cards and snapshots are referenced by evidence bundles.

Package 26 does NOT create, modify, or delete any upstream package record.

## Architecture Layers

### 1. Adjudication Readiness Flow

Before human review can begin, the system checks that a queue item is ready for adjudication. The `RecoveryCaseAdjudicationReadinessRecord` gates entry into the review pipeline.

- **Statuses**: `draft` → `ready` → `review_ready` → `stale` | `blocked` | `suppressed` | `void`
- References `queueItemId` (Pkg 25), optionally `priorityAssessmentId`, `fairnessCheckId`, `triageReadinessId`
- A blocked readiness record prevents review session creation

### 2. Review Session Lifecycle

Each human reviewer gets a `RecoveryCaseReviewSessionRecord` bound to a queue item. The session tracks the reviewer's progress through the review workflow.

- **Statuses**: `draft` → `in_progress` → `review_ready` | `needs_second_review` | `needs_more_evidence` | `blocked` | `void`
- A session is created per reviewer per queue item
- The reviewer position (`primary`, `secondary`, `governance_resolver`, `quality_reviewer`) is set at session creation

### 3. Evidence Bundles with SHA-256 Digest

`RecoveryCaseReviewEvidenceBundleRecord` caches a snapshot of evidence that reviewers will evaluate. This ensures reviewers see the same evidence set even if upstream data changes.

- Contains `safeEvidenceItemsJson` — a frozen JSON snapshot of evidence references
- Computes `evidenceDigest` using **SHA-256** over the serialised evidence content
- `digestAlgorithm` is set to `SHA-256`
- Bundle statuses: `draft` → `review_ready` | `stale` | `blocked` | `void`
- A `/verify-digest` route allows recomputing and comparing the digest to detect evidence drift
- References `boardSnapshotId` and `boardCardId` from Pkg 24 for traceability

### 4. Review Checklists and Evaluation

`RecoveryCaseReviewChecklistRecord` captures structured checklist results from the reviewer.

- **Outcomes**: `pending` → `ready` | `needs_more_evidence` | `needs_conflict_declaration` | `needs_second_review` | `blocked` | `stale`
- `checklistResultsJson` stores structured evaluation data
- Evaluated via `/review-checklists/:id/evaluate` route

### 5. Conflict of Interest Declaration and Evaluation

`RecoveryCaseConflictOfInterestDeclarationRecord` allows each reviewer to declare conflicts before or during review.

- **Conflict types**: `none_declared` | `priority_assessment_author` | `override_requestor` | `primary_reviewer` | `secondary_reviewer` | `source_record_author` | `declared_personal_conflict` | `other_declared_conflict`
- **Statuses**: `draft` → `no_conflict` | `blocked` | `needs_alternate_reviewer` | `void`
- Hard conflicts block the reviewer from continuing; the system flags the queue item for alternate reviewer assignment
- Personal conflict (`declared_personal_conflict`) always results in `blocked` status

### 6. Reviewer Decision Drafts

`RecoveryCaseReviewerDecisionDraftRecord` stores the reviewer's judgment with full traceability.

- **Decision codes**: `confirm_priority`, `recommend_lower_priority`, `recommend_higher_priority`, `request_more_evidence`, `request_second_review`, `recommend_escalation`, `defer_review`, `block_for_governance`, `return_to_triage`, `no_change`
- **Reviewer positions**: `primary`, `secondary`, `governance_resolver`, `quality_reviewer`
- Records `currentPriorityScore` and `currentPriorityBand` (snapshot from Pkg 25 at decision time)
- Optionally records `recommendedPriorityBand` for override recommendations
- Links to evidence bundle, checklist, and conflict declaration for full audit trail

### 7. Priority Override Governance (No Mutation of Package 25)

`RecoveryCasePriorityOverrideRequestRecord` enables governed requests to change a queue item's priority band. The override is **governance metadata only** — it never mutates Package 25.

- Records `currentPriorityScore` and `currentPriorityBand` (snapshot from Pkg 25)
- Stores `requestedPriorityBand` as the proposed target band
- Override statuses: `draft` → `review_ready` | `needs_second_review` | `approved_for_future_use` | `rejected` | `blocked` | `suppressed` | `void`
- A future execution package (Pkg 27+) may consume approved overrides for live action
- **Requestor cannot approve their own override** — enforced by policy

### 8. Second-Review Mandatory Triggers

`RecoveryCaseSecondReviewRequestRecord` enforces mandatory second review for:

- `critical_review` priority band (always requires second review)
- Any priority override request
- `block_for_governance` decision code
- Escalation beyond `department_head` level
- Primary reviewer explicitly requests a second review
- Quality policy requires it

Second-review statuses: `draft` → `review_ready` → `awaiting_distinct_reviewer` → `review_received` | `blocked` | `suppressed` | `void`

### 9. Consensus Evaluation

`RecoveryCaseReviewerConsensusRecord` evaluates whether primary and secondary reviewers agree.

- **Same decision code + same priority band**: `consensus_reached`
- **Same decision code + different priority band**: `partial_consensus`
- **Different decision code**: `disagreement`
- The consensus evaluation is deterministic — no AI, no ML, no scoring
- Consensus statuses: `pending` → `consensus_reached` | `partial_consensus` | `disagreement` | `needs_more_evidence` | `blocked` | `void`

### 10. Disagreement Resolution (No Automatic Winner)

`RecoveryCaseDisagreementResolutionDraftRecord` captures the path forward when reviewers disagree. There is **no automatic winner** — the system never declares one reviewer "correct" over another.

- Contains `reasonCodeComparisonJson` — structured comparison of primary vs secondary reason codes
- Lists `evidenceGapsJson` — evidence that could help resolve the disagreement
- Proposes `proposedGovernanceRole` — the role that should resolve (e.g. `department_head`, `admin`)
- Lists `proposedResolutionOptionsJson` — possible paths forward (e.g. third reviewer, more evidence, escalation)
- Draft statuses: `draft` → `review_ready` | `approved_for_future_use` | `blocked` | `suppressed` | `void`

### 11. Queue Dispositions (Internal Governance Metadata Only)

`RecoveryCaseQueueDispositionRecord` records governance metadata about a queue item's disposition. This is **internal to Package 26** and never mutates Package 25 queue item status.

- **Disposition codes**: `retain_in_queue`, `defer_for_more_evidence`, `second_review_required`, `priority_override_proposed`, `escalation_proposed`, `return_to_triage`, `governance_blocked`, `archived_ready`
- Optionally links to consensus, disagreement resolution draft, or priority override request
- A future execution package may consume these dispositions for live action

### 12. Deterministic Quality Sampling

`RecoveryCaseQualitySampleRecord` selects a deterministic sample of queue items for quality review.

- **Seed format**: `${schoolId}:${queueItemId}:${policyVersion}`
- **Algorithm**: SHA-256 hash → first 8 hex characters → parse as uint → mod 10000 → bucket 0-9999
- **Selection**: `critical_review` band is ALWAYS selected regardless of basis points; other bands are selected when `bucket < sampleBasisPoints`
- **Policy version**: `RECOVERY_CASE_ADJUDICATION_QUALITY_V1`
- Sampling is pure computation — no mutation of queue order, no AI, no randomness

### 13. Role Boundaries and Privacy

| Role | Allowed Actions |
|------|----------------|
| `teacher` | Create readiness, evidence bundle, checklist, conflict declaration; act as primary reviewer; request second review; create priority override request |
| `lead_teacher` | Act as primary or secondary reviewer; review priority override; create consensus; create queue disposition draft |
| `department_head` | Act as secondary or governance reviewer; create disagreement resolution; review override request; create governance block disposition |
| `admin` | Act as governance reviewer; create disagreement resolution; approve for future use; inspect school summaries |
| `system_job` | Create integrity digest; evaluate checklist structure; calculate quality sample; refresh summary |
| `student`, `parent`, `guest`, `unknown` | FORBIDDEN from all mutation actions |

All roles are blocked from live execution actions (assignment, notification, dispatch, publish, execute, sync, calendar, regrade, score mutation, mastery mutation).

### 14. No-Live-Action Boundary

Package 26 enforces 20 safety policies that block all roles from live action:

- `NO_LIVE_ASSIGNMENT` — no teacher/student assignments
- `NO_REVIEW_DISPATCH` — no automated dispatch of reviews
- `NO_ESCALATION_DISPATCH` — no automated escalation dispatch
- `NO_NOTIFICATION` — no notification sending
- `NO_CALENDAR_EVENT` — no calendar creation
- `NO_PORTAL_PUBLISH` — no portal publishing
- `NO_EXTERNAL_SYNC` — no external system sync
- `NO_LIVE_EXECUTION` — no live execution
- `NO_LIVE_AUTHORIZATION` — no live authorization
- `NO_LIVE_CLOSURE` — no live closure
- `NO_PRIORITY_MUTATION` — no mutation of Pkg 25 priority records
- `NO_QUEUE_MUTATION` — no mutation of Pkg 25 queue records
- `NO_SCORE_MUTATION` — no score mutation
- `NO_MASTERY_MUTATION` — no mastery mutation
- `NO_REGRADE_EXECUTION` — no regrade execution
- `NO_AI_DECISION` — no AI-generated decisions
- `NO_GENERATED_QUESTION` — no AI-generated questions
- `NO_OCR` — no optical character recognition
- `NO_PDF` — no PDF generation
- `NO_SENSITIVE_FACTOR_USE` — no sensitive demographic factors in decisions

### 15. All 15 Prisma Model Descriptions

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `RecoveryCaseAdjudicationReadinessRecord` | Gates entry into human review pipeline | `queueItemId`, `priorityAssessmentId?`, `fairnessCheckId?`, `triageReadinessId?`, `readinessStatus` |
| `RecoveryCaseReviewSessionRecord` | Per-reviewer session tracking | `queueItemId`, `adjudicationReadinessId?`, `reviewerActorId`, `reviewerRole`, `sessionStatus` |
| `RecoveryCaseReviewEvidenceBundleRecord` | Frozen evidence snapshot with SHA-256 | `queueItemId`, `evidenceDigest`, `digestAlgorithm`, `safeEvidenceItemsJson`, `bundleStatus` |
| `RecoveryCaseReviewChecklistRecord` | Structured checklist results | `queueItemId`, `evidenceBundleId?`, `checklistOutcome`, `checklistResultsJson` |
| `RecoveryCaseConflictOfInterestDeclarationRecord` | Reviewer COI declaration | `queueItemId`, `reviewerActorId`, `conflictType`, `conflictStatus` |
| `RecoveryCaseReviewerDecisionDraftRecord` | Reviewer judgment draft | `queueItemId`, `reviewerPosition`, `decisionCode`, `currentPriorityScore?`, `currentPriorityBand?` |
| `RecoveryCasePriorityOverrideRequestRecord` | Governed priority band change request | `queueItemId`, `priorityAssessmentId`, `currentPriorityScore?`, `currentPriorityBand?`, `requestedPriorityBand` |
| `RecoveryCaseSecondReviewRequestRecord` | Mandatory/discretionary second review | `queueItemId`, `primaryDecisionId`, `requestedReviewerRole`, `requestStatus` |
| `RecoveryCaseReviewerConsensusRecord` | Consensus evaluation result | `queueItemId`, `primaryDecisionId?`, `secondaryDecisionId?`, `consensusStatus` |
| `RecoveryCaseDisagreementResolutionDraftRecord` | Path forward when reviewers disagree | `queueItemId`, `consensusId?`, `proposedGovernanceRole?`, `proposedResolutionOptionsJson` |
| `RecoveryCaseQueueDispositionRecord` | Internal governance metadata for queue items | `queueItemId`, `dispositionCode`, `consensusId?`, `priorityOverrideRequestId?` |
| `RecoveryCaseQualitySampleRecord` | Deterministic quality sampling result | `queueItemId`, `priorityBand`, `selected`, `bucket`, `sampleBasisPoints`, `policyVersion` |
| `RecoveryCaseAdjudicationSummaryRecord` | Read-model summary of adjudication activity | `queueItemId?`, `adjudicationCountsJson`, `consensusCountsJson`, `disagreementCountsJson` |
| `RecoveryCaseAdjudicationAuditRecord` | Audit trail for all adjudication events | `entityType`, `entityId`, `action`, `actorId`, `actorRole`, `correlationId?` |
| `RecoveryCaseAdjudicationIdempotencyRecord` | Idempotency key tracking | `idempotencyKey`, `operation`, `requestHash`, `status` |

## Consumption Boundaries

Package 26 **consumes by reference**:
- Pkg 25: `RecoveryCaseTriageQueueItemRecord` (queueItemId), `RecoveryCasePriorityAssessmentRecord` (priorityAssessmentId), `RecoveryCaseFairnessCheckRecord` (fairnessCheckId), `RecoveryCaseTriageReadinessRecord` (triageReadinessId), `RecoveryCaseCapacitySnapshotRecord`, `RecoveryCaseTriageQueueSnapshotRecord`
- Pkg 24: `RecoveryExecutionReadinessBoardSnapshotRecord` (boardSnapshotId), `RecoveryExecutionReadinessBoardCardRecord` (boardCardId)
- Pkg 19: `RecoveryOutcomeTeacherReviewPacketRecord` (outcome context)
- Pkg 22: `RecoveryTeacherClosureReviewPacketRecord`, `RecoveryAdminGovernanceReviewPacketRecord`

Package 26 **never creates or mutates** any upstream record.

## Policy Versions

| Policy | Version Constant |
|--------|-----------------|
| Adjudication governance policy | `RECOVERY_CASE_ADJUDICATION_POLICY_V1` |
| Quality sampling policy | `RECOVERY_CASE_ADJUDICATION_QUALITY_V1` |
| Readiness creation | `RECOVERY_CASE_ADJUDICATION_READINESS_CREATION_V1` |
| Review session creation | `RECOVERY_CASE_REVIEW_SESSION_CREATION_V1` |
| Evidence bundle creation | `RECOVERY_CASE_EVIDENCE_BUNDLE_CREATION_V1` |
| Review checklist creation | `RECOVERY_CASE_REVIEW_CHECKLIST_CREATION_V1` |
| Conflict declaration creation | `RECOVERY_CASE_CONFLICT_DECLARATION_CREATION_V1` |
| Reviewer decision creation | `RECOVERY_CASE_REVIEWER_DECISION_CREATION_V1` |
| Priority override creation | `RECOVERY_CASE_PRIORITY_OVERRIDE_REQUEST_CREATION_V1` |
| Second review creation | `RECOVERY_CASE_SECOND_REVIEW_REQUEST_CREATION_V1` |
| Consensus creation | `RECOVERY_CASE_CONSENSUS_CREATION_V1` |
| Disagreement resolution creation | `RECOVERY_CASE_DISAGREEMENT_RESOLUTION_DRAFT_CREATION_V1` |
| Queue disposition creation | `RECOVERY_CASE_QUEUE_DISPOSITION_CREATION_V1` |
| Quality sample creation | `RECOVERY_CASE_QUALITY_SAMPLE_CREATION_V1` |
| Summary mutation | `RECOVERY_CASE_ADJUDICATION_SUMMARY_MUTATION_V1` |
| Audit | `RECOVERY_CASE_ADJUDICATION_AUDIT_V1` |
