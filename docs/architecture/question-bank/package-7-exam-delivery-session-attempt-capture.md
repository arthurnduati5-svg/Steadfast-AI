# Package 7: Exam Delivery Session, Attempt Capture, Submission Snapshots

## 1. Package 7 Scope
Backend runtime layer for controlled exam delivery sessions. Creates the "exam hall doorframe" — session containers, variant assignment, student attempt shells, answer capture, timing state, and immutable submission snapshots for future marking.

## 2. Package 6 Dependency Proof
- Reuses `ExamPaperRecord`, `ExamPaperVersionRecord`, `ExamVariantRecord`, `ExamVariantQuestionRecord`, `ExamPaperDeliveryBridgeRecord`, `ExamAccessPolicyRecord`, `ExamPaperApprovalRecord` as foreign-key targets.
- Requires approved paper versions and validated delivery bridges from Package 6.
- Package 7 does not duplicate any Package 6 model.

## 3. Package 5 Downstream Marking Boundary
- Package 7 creates `ExamAttemptSubmissionSnapshotRecord` — the immutable sealed input for Package 5 marking.
- Package 7 does **not** create `MarkingRunRecord`, `MarkingResultVersionRecord`, calculate scores, finalize, regrade, or mutate mastery.
- Submission snapshots are explicitly shaped as future marking input only.

## 4. No-Duplication Scan Summary
- 10 new Prisma models created.
- 7 existing Package 5/6 models reused.
- 0 forbidden models created.
- See `package-7-no-duplication-scan.md` for full scan.

## 5. Prisma Models Added
- `ExamDeliverySessionRecord`
- `ExamDeliverySessionStateRecord`
- `ExamVariantAssignmentRecord`
- `ExamAttemptRecord`
- `ExamAttemptQuestionSnapshotRecord`
- `ExamAnswerSubmissionRecord`
- `ExamAttemptTimingEventRecord`
- `ExamAttemptSubmissionSnapshotRecord`
- `ExamDeliveryAuditRecord`
- `ExamDeliveryIdempotencyRecord`

## 6. Existing Systems Reused
- `ExamPaperRecord`, `ExamPaperVersionRecord`, `ExamVariantRecord`, `ExamVariantQuestionRecord`, `ExamPaperDeliveryBridgeRecord`, `ExamAccessPolicyRecord`, `ExamPaperApprovalRecord` — foreign-key references only.
- `MarkingRunRecord`, `MarkingResultVersionRecord` — future downstream targets, not mutated.

## 7. Delivery Session Lifecycle
draft -> configured -> open -> paused -> closed -> archived
                      \-> cancelled / blocked

## 8. Session Activation Lifecycle
- Session must be configured before opening.
- Opening validates readiness (paper version approved, bridge validated, access policy configured).
- Opening does not mark, finalize, or release to parents.
- `scheduled_future_release_deferred` is metadata-only.

## 9. Variant Assignment Lifecycle
assigned -> active -> completed
         \-> revoked / blocked

## 10. Attempt Lifecycle
not_started -> in_progress <-> paused -> submitted / auto_submitted
                                       \-> cancelled / blocked / expired

## 11. Question Snapshot Rules
- Snapshots frozen at attempt start from assigned variant.
- Include only student-safe prompt text.
- No answer key, rubric, or teacher-only notes.

## 12. Answer Submission Rules
- Supports draft saves and final submissions.
- Revision numbers increment.
- No grading, no AI, no answer-key comparison.

## 13. Timing Event Rules
- Audit-safe: events include eventType, timestamps, durationUsed, durationRemaining.
- No answers, no marks, no results.

## 14. Submission Snapshot Rules
- Created from submitted attempt answers.
- Includes questionSnapshotCount, submittedAnswerCount, totalMarksAvailable.
- Sealed snapshots are immutable.
- No marking run creation, no score calculation.

## 15. Projection Safety Rules
- Student projection excludes: answerKeySafeRef, answerKeyText, correctAnswerSummary, rubricInternal, markingResult, score, finalGrade, parentReleaseStatus, masteryMutation.
- Teacher projection includes assignment views.
- Admin projection includes state counters.

## 16. Forbidden Scope Not Touched
- AI providers, OCR, marking execution, finalization, regrading, parent release, mastery mutation, frontend, notifications.

## 17. Tests Run
- 7 test files: contracts, session activation, variant assignment, attempt capture, submission snapshot, route contracts, no-duplication.
- All pass with real assertions.

## 18. Known Deferred Items
- Mounting route in backend index.ts may be deferred if backend uses dynamic route discovery.

## 19. Package 8 Ready to Prompt
- Yes. Package 8 may begin marking invocation, result finalization, or frontend integration.
