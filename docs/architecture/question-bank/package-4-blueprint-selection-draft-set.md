# Package 4: Exam Blueprinting, Question Selection, and Draft Set Generation

## 1. Package 4 Scope

Implement backend-only logic for:
- Exam blueprint creation and versioning
- Curriculum/objective coverage requirements
- Difficulty, question type, marks, duration, and security constraints
- Selection of eligible approved questions from the question bank
- Generation of 3-10 draft paper candidates from one blueprint
- Scoring and ranking of draft candidates
- Explanation of ranking reasons
- Coverage gap detection and shortage analysis
- Teacher-safe review summaries
- Persistence of draft-set records and selected question references

## 2. Package 3 Dependency Proof

Package 3 is confirmed present and passing:
- Commit: 626520d
- QuestionBankItemRecord, QuestionVersionRecord, and all governance models exist
- All Package 3 regression tests pass (21 + 19 + 16 tests)
- Route file backend/src/routes/questionBank.ts exists

## 3. No-Duplication Scan Summary

All 7 new Prisma models are genuinely new. No duplication of existing ExamMode, mastery, curriculum, or content review models. Forbidden models (ExamPaperRecord, StudentQuestionAttemptRecord, MarkingResultRecord, OCRRecord, ParentSummaryRecord, FinalizationRecord) not created.

## 4. Prisma Models Added

1. ExamBlueprintRecord
2. ExamBlueprintVersionRecord
3. ExamBlueprintRequirementRecord
4. ExamDraftSetRecord
5. ExamDraftRecord
6. ExamDraftQuestionRecord
7. QuestionSelectionRunRecord
8. QuestionSelectionCandidateRecord

## 5. Existing Systems Reused

- QuestionBankItemRecord and QuestionVersionRecord (Package 3)
- QuestionUsageEligibilityRecord (Package 3)
- QuestionExposureHoldRecord (Package 3)
- ContentReviewRecord (existing)
- CurriculumVersionRecord (existing)
- LearningObjectiveRecord (existing)
- AssessmentPolicyRegistry and AssessmentCommandEnforcementService (Package 1)
- AssessmentIdempotencyService and AssessmentAuditService (Package 1)
- extractMockAssessmentActorContext and createSafeResponseEnvelope (Package 3)

## 6. Blueprint Lifecycle

draft -> active -> archived/blocked/superseded

## 7. Blueprint Version Lifecycle

draft -> pending_approval -> approved -> rejected/superseded/blocked

## 8. Requirement Model

Each requirement expresses coverage for an objective, skill, topic, question type, or difficulty band. Requirements can be mandatory or weighted.

## 9. Question Eligibility Rules

- Question item status must be `approved`
- Question version status must be `approved`
- Usage eligibility for exam must be eligible
- Active exposure holds block selection
- Content safety review required for exam_secure
- Curriculum version must match blueprint
- teacher_only and restricted classes cannot be selected

## 10. Selection Scoring Logic

Scoring dimensions: coverage contribution, difficulty fit, question type fit, security fit, freshness, duplicate-risk penalty, exposure-hold penalty.

## 11. Draft Set Generation Flow

1. User requests 3-10 drafts from an approved blueprint version
2. System builds eligible pool from question bank
3. For each requested draft, system selects questions using selection strategy
4. Drafts are ranked by overall score
5. Coverage gaps are detected and summarized
6. Draft set is marked ready_for_teacher_review

## 12. Draft Ranking Logic

Ranking dimensions: coverageScore (35%), difficultyBalanceScore (25%), securityScore (20%), freshnessScore (20%).

## 13. Coverage Gap Behavior

Gap reason codes: NO_APPROVED_QUESTIONS, NO_EXAM_ELIGIBLE_QUESTIONS, OBJECTIVE_UNDER_COVERED, DIFFICULTY_BAND_MISSING, QUESTION_TYPE_MISSING, SECURITY_CLASS_MISMATCH, CONTENT_REVIEW_MISSING, EXPOSURE_HOLD_ACTIVE, CURRICULUM_VERSION_MISMATCH.

## 14. Teacher-Safe Recommendation Output

Each draft includes: rank, overallScore, recommendationReason, safeTeacherSummary, differenceFromPreviousDraft, warningCodes.

## 15. Forbidden Scope Not Touched

No frontend, no AI/OCR/provider, no exam delivery, no attempts, no marking, no grading, no parent summaries, no release windows.

## 16. Tests Run

- Package 4 blueprint contracts: 10 tests
- Package 4 question selection: 9 tests
- Package 4 draft set generation: 9 tests
- Package 4 route contracts: 17 tests
- Package 4 no duplication: 15 tests
- Total: 60 tests

## 17. Known Deferred Items

- Prisma adapter tests with real database (in-memory tests pass)
- Production-grade school auth integration (uses mock)
- Route mounting verified but full end-to-end test requires server bootstrap

## 18. Package 5 Readiness

Package 5 is ready to prompt after Package 4 is committed.
