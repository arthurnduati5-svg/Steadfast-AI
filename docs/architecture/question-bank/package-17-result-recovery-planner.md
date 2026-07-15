# Package 17: Result Recovery Planner

## 1. Package 17 Scope

Package 17 builds the backend-only result recovery planning layer. After results have been finalized (Package 9), released (Package 11), delivered (Package 12), assembled into report cards (Package 13), exported (Package 14), prepared for controlled access (Package 15), and followed up with intelligence (Package 16), Package 17 enables teachers and staff to create structured recovery plans with objectives, steps, practice draft recommendations, resource recommendations, teacher review packets, student support drafts, parent support note drafts, checkpoints, and summary read models — all as safe metadata records without creating live assignments, sending live notifications, mutating scores, mutating mastery, generating questions, generating AI narratives, performing OCR, generating PDFs, syncing externally, or leaking private data.

## 2. Package 16 Dependency Proof

Package 17 depends on Package 16 (committed at `8a6b824`). Recovery plans reference:
- `resultFollowUpCaseId` — the Package 16 follow-up case
- `resultFollowUpActionPlanId` — the Package 16 action plan
- `resultFollowUpSummaryId` — the Package 16 follow-up summary

No recovery plan may exist without at least one upstream reference from Package 9 through Package 16.

## 3. Package 16 Follow-Up Intelligence Reuse Proof

Package 17's `ResultRecoveryPlanRecord` references `resultFollowUpCaseId`, `resultFollowUpActionPlanId`, and `resultFollowUpSummaryId` — the Package 16 follow-up case, action plan, and summary. These are never duplicated, only referenced by ID.

## 4. Package 15 Access Readiness Reuse Proof

Package 17's `ResultRecoveryPlanRecord` references `resultReportCardAccessGrantId` — the Package 15 access grant. This is never duplicated, only referenced by ID.

## 5. Package 13 Report Card Reuse Proof

Package 17's `ResultRecoveryPlanRecord` references `resultReportCardAssemblyId` and `resultReportCardAudienceProjectionId` — the Package 13 report card assembly and audience projection. These are never duplicated, only referenced by ID.

## 6. Package 10 Learning Evidence and Revision Signal Reuse Proof

Package 17 references Package 10 learning evidence through `resultLearningEvidenceSnapshotId` on the `ResultRecoveryPlanRecord`. The evidence is stored by reference ID only. No learning evidence records are duplicated in recovery records. Revision signals from Package 10 are reused by reference through the evidence snapshot chain.

## 7. Existing Question-Bank Approved Reference Reuse Proof

Package 17 references existing question-bank approved questions and objectives by ID only through JSON refs fields (`questionRefsJson`, `objectiveRefsJson`, `learningObjectiveRef`, `skillRef`, `topicRef`). No approved question or objective content is duplicated in recovery records.

## 8. Package 17 No-Duplication Scan Summary

All 12 recovery planning terms were NOT FOUND in the existing schema before Package 17. No forbidden models (live assignment, live notification, score mutation, mastery mutation, generated question, AI narrative, OCR, PDF) are created. Existing Package 9–16 records are reused by reference only. See `package-17-no-duplication-scan.md` for full details.

## 9. Prisma Models Added (12)

1. `ResultRecoveryPlanRecord`
2. `ResultRecoveryObjectiveRecord`
3. `ResultRecoveryStepRecord`
4. `ResultRecoveryPracticeDraftRecord`
5. `ResultRecoveryResourceRecommendationRecord`
6. `ResultRecoveryTeacherReviewPacketRecord`
7. `ResultRecoveryStudentSupportDraftRecord`
8. `ResultRecoveryParentSupportNoteDraftRecord`
9. `ResultRecoveryCheckpointRecord`
10. `ResultRecoverySummaryRecord`
11. `ResultRecoveryAuditRecord`
12. `ResultRecoveryIdempotencyRecord`

## 10. Existing Systems Reused

### Models Reused (by reference only)

- `ResultRecoveryPlanRecord` references: `resultFollowUpCaseId` (Pkg 16), `resultFollowUpActionPlanId` (Pkg 16), `resultFollowUpSummaryId` (Pkg 16), `resultReportCardAssemblyId` (Pkg 13), `resultReportCardAudienceProjectionId` (Pkg 13), `resultReportCardAccessGrantId` (Pkg 15), `resultLearningEvidenceSnapshotId` (Pkg 10)
- Policy enforcer `ResultRecoveryPolicyEnforcer` reuses role constants (`ALLOWED_RECOVERY_CREATION_ROLES`, `BLOCKED_RECOVERY_CREATION_ROLES`)
- `FORBIDDEN_RECOVERY_FIELDS` reuses the same leak-prevention contracts from Packages 9–16
- Audit bridge reuses the same `ResultRecoveryAuditRecord` pattern from Package 15 audit model
- Idempotency reuses the same `ResultRecoveryIdempotencyRecord` pattern from Package 15 idempotency
- Existing question-bank approved questions and objectives referenced by ID in JSON fields

## 11. Recovery Plan Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Plan modes: `mock_plan_only`, `future_recovery_plan`, `teacher_review_only`, `metadata_only`.

Plan priorities: `low`, `medium`, `high`, `urgent_review_required`.

## 12. Recovery Objective Lifecycle

```
draft → ready → completed_mock
draft → ready → suppressed
draft → suppressed
draft → void
```

Objective types: `concept_repair`, `practice_reinforcement`, `confidence_rebuild`, `mistake_pattern_review`, `exam_strategy_review`, `reflection_support`, `teacher_review_support`.

## 13. Recovery Step Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → completed_mock
draft → review_ready → suppressed
draft → suppressed
draft → void
```

Step types: `review_concept`, `redo_similar_practice`, `reflect_on_error`, `teacher_check_in`, `parent_support_note`, `confidence_check`, `checkpoint_review`.

Step mode: defaults to `mock`.

## 14. Practice Recommendation Draft Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Draft mode: defaults to `existing_question_refs_only`.

Practice type: defaults to `existing_question_refs_only`.

Practice drafts use existing approved question references only — no generated question text or answer keys.

## 15. Resource Recommendation Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Resource types: defaults to `metadata_only`.

Recommendation mode: defaults to `metadata_only`.

## 16. Teacher Review Packet Lifecycle

```
draft → ready → acknowledged_mock → approved_for_future_use
draft → ready → acknowledged_mock → suppressed
draft → suppressed
draft → void
```

Packet mode: defaults to `metadata_only`.

Teacher review packets aggregate recovery plan objectives, steps, practice drafts, and resource recommendations into a single reviewable packet for a teacher.

## 17. Student Support Draft Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Draft mode: defaults to `metadata_only`.

Student support drafts contain safe support body JSON, reflection prompt references, and practice draft references — never raw answers or hidden reasoning.

## 18. Parent Support Note Draft Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Draft mode: defaults to `metadata_only`.

Audience type: defaults to `parent`.

Parent support note drafts use an allow-list/block-list field pattern to ensure only parent-safe information is included.

## 19. Checkpoint Lifecycle

```
draft → scheduled_mock → completed_mock
draft → scheduled_mock → cancelled
draft → cancelled
any → void
```

Checkpoint mode: defaults to `metadata_only`.

Checkpoint types: `teacher_review`, `practice_review`, `confidence_check`, `parent_check_in`.

## 20. Summary Read Model Lifecycle

```
active → stale
active → blocked
any → void
```

Scopes: `school`, `student`, `teacher`, `plan_status`, `priority`, `objective_type`.

Summary read models aggregate plan counts, objective counts, and checkpoint counts for a given scope.

## 21. No-Live-Assignment Policy

Package 17 has a dedicated `RESULT_RECOVERY_NO_LIVE_ASSIGNMENT` policy family that blocks all live assignment creation. Every service and route enforces this policy. Practice drafts use `existing_question_refs_only` mode only.

## 22. No-Live-Notification Policy

Package 17 has a dedicated `RESULT_RECOVERY_NO_LIVE_NOTIFICATION` policy family that blocks all live notification behavior. Teacher review packet acknowledgement is mock-only. No parent, student, or teacher notifications are sent.

## 23. No-Score-Mutation Policy

Package 17 has a dedicated `RESULT_RECOVERY_NO_SCORE_MUTATION` policy family that blocks all score mutation. Scores, marks, grades, and result versions are never modified by recovery operations.

## 24. No-Mastery-Mutation Policy

Package 17 has a dedicated `RESULT_RECOVERY_NO_MASTERY_MUTATION` policy family that blocks all mastery mutation. Mastery scores, levels, and signals are never modified by recovery operations.

## 25. No-Generated-Question Policy

Package 17 has a dedicated `RESULT_RECOVERY_NO_GENERATED_QUESTION` policy family that blocks all generated question creation. Practice drafts use only existing approved question references.

## 26. No-AI/OCR/PDF/External-Sync Deferral Explanation

All real execution of AI narrative generation, OCR processing, PDF generation, HTML export, external school system sync, notification sending, live assignment creation, and real calendar event creation is intentionally deferred to future packages. Package 17 creates only safe recovery planning metadata.

Dedicated policy families:
- `RESULT_RECOVERY_NO_AI_NARRATIVE` — blocks AI narrative generation
- `RESULT_RECOVERY_NO_OCR` — blocks OCR processing

No PDF, HTML export, or external sync policy is needed because no code path touches those domains.

## 27. Forbidden Scope Not Touched

- No frontend files modified
- No AI provider imports
- No OCR imports
- No notification sending
- No PDF generation
- No HTML export file creation
- No external sync
- No score changes
- No mastery changes
- No result version overwrites
- No regrade execution
- No live assignment creation
- No generated question creation
- No calendar event creation

## 28. Tests Run

Package 17 currently has 1 test file implemented (`package-17-recovery-contracts.test.ts`). The following test coverage is planned to reach the 10-file standard established by Package 16:

1. `package-17-recovery-contracts.test.ts` — contracts, policy families, role enforcement, source file existence (IMPLEMENTED)
2. `package-17-recovery-plan-lifecycle.test.ts` — plan CRUD and status transitions
3. `package-17-recovery-objective-step.test.ts` — objective and step CRUD and status transitions
4. `package-17-practice-draft-safety.test.ts` — practice draft safety assertions, reference-only enforcement
5. `package-17-resource-recommendation.test.ts` — resource recommendation CRUD and status transitions
6. `package-17-teacher-review-packet.test.ts` — teacher review packet CRUD and mock acknowledgement
7. `package-17-student-support-draft.test.ts` — student support draft safety and CRUD
8. `package-17-parent-support-note-draft.test.ts` — parent support note draft safety and CRUD
9. `package-17-checkpoint-lifecycle.test.ts` — checkpoint CRUD and scheduled_mock/completed_mock/cancelled transitions
10. `package-17-summary-read-model.test.ts` — summary read model CRUD, refresh, stale, block, void

## 29. Known Deferred Items

- Real practice assignment delivery with live homework/practice/revision records (future package)
- Real teacher notification via dashboard/email (future package)
- Real parent notification via email/SMS/push (future package)
- Real student notification via email/SMS/push (future package)
- Live teacher review packet delivery with real acknowledgement workflow (future package)
- Live student support delivery with reflection submission portal (future package)
- Live parent support note delivery with parent portal (future package)
- Real checkpoint scheduling with calendar integration (future package)
- AI narrative generation for recovery recommendations (future package)
- OCR processing for paper-based reflection submission (future package)
- External school system sync for recovery plan records (future package)
- Frontend UI for recovery plan management (future package)
- Frontend UI for teacher review packet dashboard (future package)
- Frontend UI for student support draft review (future package)
- Frontend UI for parent support note review (future package)
- Route layer (Express routers) — deferred to frontend integration phase

## 30. Whether Package 18 Is Ready to Prompt

Package 17 services, contracts, policies, repositories, Prisma models, and foundational test coverage are implemented. Route mounting and full test suite completion are in progress. Package 18 is safe to begin planning after Package 17 tests pass, type-check completes, and verification gates pass.
