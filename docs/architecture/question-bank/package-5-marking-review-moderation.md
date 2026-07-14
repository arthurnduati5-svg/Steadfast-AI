# Package 5 - Marking, Teacher Review, Moderation, and Student Challenge Foundation

## 1. Package 5 Scope
Backend marking engine foundation: deterministic marking, teacher review queues, teacher overrides, moderation decisions, and student mark challenges. Backend-first only.

## 2. Package 4 Dependency Proof
- Package 4 commit: f0c9089
- Package 4 docs exist: package-4-final-accountability.md, package-4-commit-scope-repair.md, package-4-blueprint-selection-draft-set.md, package-4-route-contract.md
- Package 4 tests pass: 5 test files, 62 tests
- Package 2 & 3 regression tests pass

## 3. No-Duplication Scan Summary
9 new Prisma models created. 13 existing models reused. 0 existing models duplicated. See package-5-no-duplication-scan.md.

## 4. Prisma Models Added
- MarkingRunRecord
- MarkingResultVersionRecord
- MarkingBreakdownItemRecord
- ScoringSuggestionRecord
- TeacherReviewGroupRecord
- TeacherReviewItemRecord
- TeacherOverrideRecord
- ModerationDecisionRecord
- StudentMarkChallengeRecord

## 5. Existing Systems Reused
- QuestionBankItemRecord, QuestionVersionRecord
- AnswerKeyVersionRecord, RubricVersionRecord
- QuestionUsageEligibilityRecord, QuestionExposureHoldRecord
- ExamModeAttemptRecord, ExamModeQuestionStateRecord, PracticeAttempt, SkillMasterySnapshot
- TeacherInterventionAssignment (reused by reference, not duplicated)

## 6. Marking Run Lifecycle
draft → running → completed | partial | blocked | failed | cancelled

## 7. Marking Result Version Lifecycle
draft → provisional | review_required → teacher_confirmed | teacher_overridden | moderated | challenged | blocked | superseded

## 8. Deterministic Marking Support Matrix
| Type | Supported | Method |
|------|-----------|--------|
| multiple_choice | YES | exact normalized match |
| true_false | YES | exact normalized match |
| matching | YES | key-value pair matching |
| fill_blank | YES | normalized text against allowed answers |
| numeric | YES | exact or tolerance-based |
| essay | NO | routes to teacher review |
| structured_working | NO | routes to teacher review |
| oral | NO | routes to teacher review |
| multi_part | NO | routes to teacher review |

## 9. Rubric/Teacher-Review Routing Behavior
Non-deterministic types default to teacher review. Missing answer key routes to teacher review.

## 10. Teacher Review Grouping Behavior
Items grouped by questionVersionId + reasonCode + markingRunId for efficient review.

## 11. Teacher Override Behavior
Records previous and new marks. Requires overrideReasonCode and safeReason. Creates new result version.

## 12. Moderation Behavior
Requires lead_teacher, department_head, or admin. Supports uphold, adjust, return_to_teacher, escalate, block.

## 13. Student Challenge Behavior
Student can challenge own result. Challenge does not expose answer key. Resolution does not finalize.

## 14. Projection Safety Rules
- Student projection: strips answerKeySafeRef, correctAnswerSummary, teacherOnlyNotes, rubricInternal, markingNotesTeacherOnly
- Parent projection: more restricted, excludes confidence, review reasons, teacher summary
- Teacher/Admin projection: includes safe summaries, marks, confidence, review reasons, rubric public summary

## 15. Forbidden Scope Not Touched
No frontend UI, OCR, real AI marking, exam delivery, parent release, mastery mutation, finalization, or regrading.

## 16. Tests Run
- package-5-marking-contracts.test.ts
- package-5-deterministic-marking.test.ts
- package-5-teacher-review-moderation.test.ts
- package-5-student-challenge.test.ts
- package-5-routes.contract.test.ts
- package-5-no-duplication.test.ts

## 17. Known Deferred Items
- Real AI marking
- OCR processing
- Exam delivery sessions
- Live student answer submission
- Parent release records
- Finalization/regrading
- Mastery mutation

## 18. Package 6 Readiness
Package 6 is ready to prompt. Recommended focus: exam delivery session foundation.
