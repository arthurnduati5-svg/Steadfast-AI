# Package 6 No-Duplication Scan

## Scanned Terms

| Term | Found | Files Inspected | Existing Meaning | Reuse Decision | Create Decision | Duplication Risk | Final Decision |
|------|-------|----------------|-----------------|----------------|----------------|-----------------|----------------|
| ExamPaperRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperVersionRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperSectionRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperQuestionRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamVariantRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamVariantQuestionRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamAccessPolicyRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperApprovalRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperAssemblyRunRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperDeliveryBridgeRecord | NO | schema.prisma | N/A | N/A | Create new | None | CREATE |
| ExamPaperPrintPacketRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| ExamReleaseWindowRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| ExamVariantAssignmentRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| StudentQuestionAttemptRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| FinalizationRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| RegradingRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| OCRRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| ParentSummaryRecord | NO | schema.prisma | N/A | N/A | Do not create | Would duplicate | SKIP |
| ExamDraftSetRecord | YES | schema.prisma | Package 4 draft set container | Reuse as sourceDraftSetId reference | Do not create new | None | REUSE |
| ExamDraftRecord | YES | schema.prisma | Package 4 draft | Reuse as sourceDraftId reference | Do not create new | None | REUSE |
| ExamDraftQuestionRecord | YES | schema.prisma | Package 4 draft question placement | Reuse as sourceDraftQuestionId reference | Do not create new | None | REUSE |
| QuestionBankItemRecord | YES | schema.prisma | Package 2 question | Reference by questionId | Do not create new | None | REUSE |
| QuestionVersionRecord | YES | schema.prisma | Package 2 question version | Reference by questionVersionId | Do not create new | None | REUSE |
| AnswerKeyVersionRecord | YES | schema.prisma | Package 2 answer key | Referenced by answerKeyLinked boolean | Do not copy text | None | REUSE |
| RubricVersionRecord | YES | schema.prisma | Package 2 rubric | Referenced by rubricLinked boolean | Do not copy internals | None | REUSE |
| MarkingRunRecord | YES | schema.prisma | Package 5 marking run | Do not create in Package 6 | Do not create new | None | SKIP |
| MarkingResultVersionRecord | YES | schema.prisma | Package 5 marking result | Do not create in Package 6 | Do not create new | None | SKIP |
| ExamModeSessionRecord | YES | schema.prisma | Live exam session | Do not create in Package 6 | Do not create new | None | SKIP |
| ExamModeAttemptRecord | YES | schema.prisma | Live exam attempt | Do not create in Package 6 | Do not create new | None | SKIP |
| PracticeAttempt | YES | schema.prisma | Practice attempt | Do not create in Package 6 | Do not create new | None | SKIP |
| SkillMasterySnapshot | YES | schema.prisma | Mastery state | Do not create in Package 6 | Do not create new | None | SKIP |

## Reuse Decisions

- Package 4 draft-set records reused as source references.
- Package 4 blueprint and draft question records reused.
- Package 2 and Package 3 question-bank records reused.
- Package 5 marking records used only as future downstream compatibility references.
- ExamMode runtime records NOT duplicated.
- PracticeAttempt NOT duplicated.
- SkillMasterySnapshot NOT duplicated.
- MarkingRunRecord NOT duplicated.
- MarkingResultVersionRecord NOT duplicated.
- QuestionBankItemRecord NOT duplicated.
- QuestionVersionRecord NOT duplicated.
- AnswerKeyVersionRecord NOT duplicated.
- RubricVersionRecord NOT duplicated.

## Final Verdict

No duplication risk. All Package 6 models are new and semantically distinct.
