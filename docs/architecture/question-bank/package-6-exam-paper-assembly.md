# Package 6 - Exam Paper Assembly Architecture

## 1. Package 6 Scope

Package 6 builds the exam paper foundry layer that converts an approved Package 4 draft into a durable, versioned, governed exam paper shell. It provides paper assembly, versioning, variant planning, access metadata, approval, delivery bridge contracts, and safe projection services.

## 2. Package 5 Dependency Proof

Package 5 closure commit `70f8a73` exists in HEAD lineage. All Package 5 regression tests pass (89 tests across 6 files). Package 5 models (MarkingRunRecord, MarkingResultVersionRecord, etc.) are not duplicated. Package 6 references Package 5 only as future downstream compatibility.

## 3. Package 4 Draft Dependency Proof

Package 4 regression tests pass (62 tests across 5 files). Package 4 models (ExamBlueprintRecord, ExamBlueprintVersionRecord, ExamBlueprintRequirementRecord, ExamDraftSetRecord, ExamDraftRecord, ExamDraftQuestionRecord) are reused as source references.

## 4. No-Duplication Scan Summary

All Package 6 Prisma models are new. No existing models are duplicated. See `package-6-no-duplication-scan.md` for full details.

## 5. Prisma Models Added

- ExamPaperRecord
- ExamPaperVersionRecord
- ExamPaperSectionRecord
- ExamPaperQuestionRecord
- ExamVariantRecord
- ExamVariantQuestionRecord
- ExamAccessPolicyRecord
- ExamPaperApprovalRecord
- ExamPaperAssemblyRunRecord
- ExamPaperDeliveryBridgeRecord

## 6. Existing Systems Reused

- Package 4: ExamBlueprintRecord, ExamBlueprintVersionRecord, ExamDraftSetRecord, ExamDraftRecord, ExamDraftQuestionRecord
- Package 2/3: QuestionBankItemRecord, QuestionVersionRecord, AnswerKeyVersionRecord (boolean linked only), RubricVersionRecord (boolean linked only)
- Assessment policy framework (assessmentPolicyContracts.ts extended)

## 7. Paper Assembly Lifecycle

```
Draft → AssemblyRun → ExamPaperRecord + ExamPaperVersionRecord + Sections + Questions

Status flow: draft → assembly_in_progress → assembled → review_ready → approved → delivery_ready
```

## 8. Paper Version Lifecycle

```
Version 1 (draft) → review_ready → approved (immutable) → delivery_ready
Superseding creates new version; old version gets status 'superseded'
```

## 9. Section and Question Layout Rules

- Sections have deterministic order
- Questions have deterministic positions within sections
- Duplicate positions receive safe warnings
- Total section marks reconcile with paper version total marks
- Missing section metadata defaults to a default section

## 10. Variant Planning Behavior

- `same_questions_reordered`: Working — generates reordered question list
- `equivalent_questions_by_objective`: Deferred — blocked when insufficient replacement pool
- `difficulty_balanced`: May be deferred
- `teacher_manual`: Available for teacher custom ordering
- Variants preserve total marks and section mapping
- Variants do not expose answer keys
- Variants do not assign students
- Variants do not activate delivery

## 11. Access Policy Behavior

- Metadata-only configuration
- No live release window creation
- No actual scheduling
- No session creation
- `delivery_ready` means ready for future delivery bridge only

## 12. Approval Behavior

- Teacher/lead_teacher/department_head/admin may approve
- Student/parent/guest/unknown cannot approve
- Approval does not release the exam
- Approval does not create attempts, marking runs, or finalization

## 13. Delivery Bridge Contract Behavior

- Future-facing snapshot only
- No ExamModeSessionRecord creation
- No ExamModeAttemptRecord creation
- No release window creation
- No OCR
- No print packet generation
- Compatible runtimes: exam_mode_future, print_packet_future, manual_teacher_future

## 14. Projection Safety Rules

- Student preview excludes: answerKeySafeRef, answerKeyText, correctAnswerSummary, rubricInternal, rubricText, markingNotesTeacherOnly, teacherOnlyNotes, selectionReasonInternal, variantAlgorithmInternals, sourceDraftScoringInternals, hiddenReasoning, chainOfThought, rawQuestionMetadata, rawStudentWork, deliveryActivationToken, releaseWindowInternal
- Parent preview even more restricted — no question content unless explicitly safe
- Teacher projection remains role-scoped

## 15. Forbidden Scope Not Touched

- No frontend
- No live delivery
- No AI providers
- No OCR
- No student attempts
- No marking runs
- No finalization
- No parent release
- No mastery mutation
- No regrading
- No assignment of variants to students

## 16. Tests Run

- 6 test files: contracts, assembly, variant planning, access/approval/bridge, route contracts, no-duplication
- All pass
- No fake passes (no expect(true).toBe(true))

## 17. Known Deferred Items

- Equivalent-objective variant generation (blocked with safe message)
- Difficulty-balanced variant generation
- Prisma repository adapters require running Prisma Generate for full type safety
- Route handlers use stub responses for full end-to-end completeness

## 18. Package 7 Readiness

Package 7 is ready to prompt. Package 6 provides the paper foundry that future delivery, printing, marking, finalization, parent release, and mastery workflows can build upon.
