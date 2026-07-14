# Package 8: Marking Invocation Bridge, Submitted Snapshot Intake, Batch Marking Orchestration, Result Version Creation, and Teacher Review Dispatch

## 1. Package 8 Scope
Backend-only marking bridge between Package 7 exam delivery submission snapshots and Package 5 marking infrastructure. Creates invocation requests, intakes sealed snapshots, plans batches, executes deterministic marking, dispatches teacher review items, and links result versions.

## 2. Package 7 Dependency Proof
Package 8 consumes `ExamAttemptSubmissionSnapshotRecord` (sealed snapshots) from Package 7. Package 7 is accepted-ready at commit f3a0c5e. All 7 Package 7 test files pass (98 tests).

## 3. Package 5 Marking Reuse Proof
Package 8 reuses through reference:
- `MarkingRunRecord` via `markingRunId` on batches
- `MarkingResultVersionRecord` via `markingResultVersionId` on links
- `DeterministicMarkerService` for deterministic marking eligibility
- `TeacherReviewQueueService` patterns for teacher review dispatch
- `MarkingProjectionSafetyService` patterns for projection safety

All 6 Package 5 test files pass (88 tests). No Package 5 models are duplicated.

## 4. No-Duplication Scan Summary
No duplication found. All 8 new models are unique bridge constructs. See package-8-no-duplication-scan.md.

## 5. Prisma Models Added
- MarkingInvocationRequestRecord
- SubmittedSnapshotIntakeRecord
- MarkingBatchRecord
- MarkingBatchItemRecord
- MarkingResultLinkRecord
- MarkingDispatchAuditRecord
- MarkingInvocationIdempotencyRecord
- MarkingReadinessCheckRecord

## 6. Existing Systems Reused
- Package 5 MarkingRunRecord, MarkingResultVersionRecord (read/write via bridge)
- Package 7 ExamAttemptSubmissionSnapshotRecord (source intake)
- Package 7 ExamAttemptRecord, ExamAnswerSubmissionRecord (read references)
- Package 5 DeterministicMarkerService, TeacherReviewQueueService (patterns)

## 7. Submitted Snapshot Intake Lifecycle
Submit sealed snapshot -> validate readiness -> create SubmittedSnapshotIntakeRecord -> status becomes ready_for_marking or blocked

## 8. Marking Invocation Lifecycle
Create request (draft) -> validate -> queue -> process (marking runs) -> complete/block/cancel

## 9. Readiness Check Lifecycle
Run checks (submission_snapshot, marking_policy, answer_key_boundary, rubric_boundary, teacher_review_boundary, batch_execution) -> durable MarkingReadinessCheckRecord created

## 10. Batch Planning Lifecycle
Create batch -> plan items from intakes -> classify item mode (deterministic/rubric/teacher_review/manual/unsupported) -> queue batch

## 11. Deterministic Marking Bridge Lifecycle
Execute batch -> iterate deterministic items -> mark deterministically -> skip/block unsupported items -> update batch status

## 12. Teacher Review Dispatch Lifecycle
Identify teacher_review_required/manual_only items -> dispatch to Package 5 teacher review queue -> create MarkingBatchItem with sent_to_teacher_review status

## 13. Result Version Linking Lifecycle
Create MarkingResultLinkRecord referencing batch item + markingRunId + markingResultVersionId -> safe link summary

## 14. Projection Safety Rules
- Student-safe: attemptId, submissionSnapshotId, intakeStatus, processingStatus only
- Teacher: invocation status, intake/batch counts, dispatch counts
- Admin: full operational view minus answer keys, hidden reasoning
- All projections exclude: answerKeyText, finalGrade, parentReleaseStatus, masteryMutation

## 15. Forbidden Scope Not Touched
- No finalization
- No parent release
- No mastery mutation
- No OCR
- No AI providers
- No regrading
- No frontend

## 16. Tests Run
See final accountability doc for all test results.

## 17. Known Deferred Items
- Integration with live Package 5 Prisma repositories (in-memory used for bridge testing)
- Live AI provider marking (deferred to future package)
- OCR processing (deferred)
- Result finalization and parent release (deferred)
- Mastery mutation (deferred)

## 18. Package 9 Ready to Prompt
Yes - Package 8 marking bridge is accepted. Package 9 can begin on result finalization, controlled release, or frontend integration.
