# Package 5 - No-Duplication Scan

## Search Results

### Existing Models (Reuse)
| Term | Exists | Files | Decision |
|------|--------|-------|----------|
| QuestionBankItemRecord | YES | schema.prisma:3951 | Reuse |
| QuestionVersionRecord | YES | schema.prisma:3976 | Reuse |
| QuestionPartVersionRecord | YES | schema.prisma:3999 | Reuse |
| AnswerKeyVersionRecord | YES | schema.prisma:4027 | Reuse |
| RubricVersionRecord | YES | schema.prisma:4041 | Reuse |
| QuestionUsageEligibilityRecord | YES | schema.prisma:4102 | Reuse |
| QuestionExposureHoldRecord | YES | schema.prisma:4173 | Reuse |
| ContentReviewRecord | YES | schema.prisma:1702 | Reuse |
| ExamModeAttemptRecord | YES | schema.prisma:3359 | Reuse, not duplicate |
| ExamModeQuestionStateRecord | YES | schema.prisma:3320 | Reuse, not duplicate |
| PracticeAttempt | YES | schema.prisma:949 | Reuse, not duplicate |
| SkillMasterySnapshot | YES | schema.prisma:989 | Reuse, not duplicate |
| TeacherInterventionAssignment | YES | schema.prisma:738 | Reuse, not duplicate |
| RubricVersionRecord | YES | schema.prisma:4041 | Reuse, not duplicate |
| AnswerKeyVersionRecord | YES | schema.prisma:4027 | Reuse, not duplicate |

### Existing Services (Reuse)
| Term | Exists | Files | Decision |
|------|--------|-------|----------|
| artifactAnswerMarkingService | YES | `backend/src/services/artifactAnswerMarkingService.ts` | Reuse, not duplicate |
| artifactAwareAnswerEvaluator | YES | `backend/src/services/artifactAwareAnswerEvaluator.ts` | Reuse, not duplicate |
| examModeScoringMetadataService | YES | `backend/src/services/examModeScoringMetadataService.ts` | Reuse, not duplicate |
| quizModeScoringMetadataService | YES | `backend/src/services/quizModeScoringMetadataService.ts` | Reuse, not duplicate |
| masteryScoringService | YES | `backend/src/services/masteryScoringService.ts` | Reuse, not duplicate |

### New Package 5 Models (Create)
| Term | Exists Before | Files Inspected | Decision |
|------|--------------|-----------------|----------|
| MarkingRunRecord | NO | schema, routes, contracts, services | Create |
| MarkingResultVersionRecord | NO | schema, contracts, routes | Create |
| MarkingBreakdownItemRecord | NO | schema, contracts | Create |
| ScoringSuggestionRecord | NO | schema, contracts | Create |
| TeacherReviewItemRecord | NO | schema, contracts | Create |
| TeacherReviewGroupRecord | NO | schema, contracts | Create |
| TeacherOverrideRecord | NO | schema, contracts | Create |
| ModerationDecisionRecord | NO | schema, contracts | Create |
| StudentMarkChallengeRecord | NO | schema, contracts | Create |

### Forbidden Models (Not Created)
| Term | Duplication Risk | Decision |
|------|-----------------|----------|
| ExamPaperRecord | HIGH | Not created |
| StudentQuestionAttemptRecord | HIGH | Not created |
| OCRRecord | HIGH | Not created |
| ParentSummaryRecord | HIGH | Not created |
| FinalizationRecord | HIGH | Not created |
| RegradingRecord | HIGH | Not created |
| SkillMasterySnapshotDuplicate | HIGH | Not created |
| PracticeAttemptDuplicate | HIGH | Not created |
| RubricVersionDuplicate | HIGH | Not created |
