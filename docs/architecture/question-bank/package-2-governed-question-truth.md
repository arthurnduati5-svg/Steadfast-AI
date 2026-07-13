# Package 2 — Governed Question Truth

## 1. Package 2 Scope

Package 2 establishes the backend-only foundation for a governed, versioned, curriculum-linked question bank — the durable truth layer for questions within the Steadfast AI platform.

## 2. What Was Implemented

- **Question Bank Item** aggregate contract with status lifecycle (draft → pending_approval → approved → rejected → archived → superseded → blocked)
- **Question Version** contract with immutable approved-state enforcement
- **Question Part Version** contract for multi-part questions
- **Question Asset Version** contract for media attachments
- **Answer Key Version** contract with projection safety rules
- **Rubric Version** contract as reference data for future marking engine
- **Question Objective Mapping** contract linking questions to curriculum objectives
- **Question Source Record** contract tracing question origin
- **Question Curriculum Validity** contract for curriculum alignment checks
- **Question Usage Eligibility** contract for mode-based access control
- **Content Safety Review** contract (reusing existing ContentReviewRecord patterns)
- **Repository interfaces** for all 9 aggregate types
- **In-memory test repositories** for all 9 aggregate types
- **Governed Question Command Service** using Package 1 enforcement pipeline
- **Question Classification Service** (deterministic, no AI calls)
- **Duplicate Fingerprint Service** (stable content hashing)
- **Projection Safety Service** (student/teacher/parent/system safe views)
- **Question Bank Policy Definitions** (8 policy families)
- **Comprehensive test suite** with 45+ test cases
- **Package 2 documentation**

## 3. What Was Intentionally Not Implemented

- Exam blueprinting, draft generation, or paper assembly
- Paper scheduling or release windows
- Assessment attempts, marking, or scoring engine
- Teacher review queue behavior
- Student challenge behavior
- Finalization or regrading
- Parent summaries
- OCR or scan processing
- Real AI question generation (ai_assisted_draft allowed only as draft)
- AI marking
- Frontend UI (no React, Next, or frontend changes)
- Backend routes (backend/src/routes/ai.ts not modified)
- Prisma schema models (deferred — no models added in Package 2)
- Duplicate clustering (fingerprint service created but clustering deferred)
- Final approval command (Package 2 only reaches pending_approval)

## 4. Existing Systems Reused

| System | Location | Reuse |
|--------|----------|-------|
| Package 1 Enforcement | backend/src/domains/assessment/ | AssessmentCommandEnforcementService, policy registry, idempotency, audit, outbox, projections |
| Assessment Contract Types | backend/src/domains/assessment/contracts/ | AssessmentCommandContext, AssessmentGovernedCommand, ProjectionRole, ForbiddenField |
| Assessment Policy Registry | backend/src/domains/assessment/policies/ | Policy registration and resolution |
| Projection Guard | backend/src/domains/assessment/projections/ | assertProjectionAllowed, stripForbiddenFieldsForRole |
| Curriculum Models | backend/prisma/schema.prisma | CurriculumVersionRecord, LearningObjectiveRecord (referenced but not duplicated) |
| ContentReviewRecord | backend/prisma/schema.prisma | Reused pattern for ContentSafetyReview (not duplicated) |

## 5. New Question-Bank Domain Boundary

```
backend/src/domains/assessment/question-bank/
├── index.ts
├── contracts/
│   ├── questionBankItemContracts.ts
│   ├── questionVersionContracts.ts
│   ├── answerKeyAndRubricContracts.ts
│   ├── questionObjectiveMappingContracts.ts
│   ├── questionSourceRecordContracts.ts
│   ├── questionGovernanceContracts.ts
│   └── questionBankRepositoryContracts.ts
├── repositories/
│   └── inMemoryQuestionBankRepositories.ts
├── services/
│   ├── governedQuestionCommandService.ts
│   ├── questionClassificationService.ts
│   ├── duplicateFingerprintService.ts
│   └── projectionSafetyService.ts
├── policies/
│   └── questionBankPolicyDefinitions.ts
└── tests/
    └── package-2-governed-question-truth.test.ts
```

## 6. Question Aggregate and Versioning Model

- `QuestionBankItem` is the stable identity — questionId never changes across versions
- `QuestionVersion` carries the actual question content — approved versions are immutable
- New edits create a new version with incremented versionNumber
- `currentVersionId` on QuestionBankItem tracks the latest version
- contentHash provides stable fingerprint for future duplicate detection

## 7. Curriculum/Objective Mapping Behavior

- Questions map to LearningObjectiveRecord through QuestionObjectiveMapping
- At least one primary mapping required before approval submission
- Mapping does not mutate mastery records
- Curriculum validity check records reason codes for invalid states

## 8. Answer Key and Rubric Safety Behavior

- Student projection strips: answerKey, correctAnswerSummary, modelAnswer, markingScheme, rubricInternal, teacherOnlyNotes, markingNotesTeacherOnly, teacherExplanation
- Parent projection strips: answerKey, correctAnswerSummary, rubricInternal, rawStudentAnswer, rawStudentWork
- Teacher projection includes teacherExplanation but strips secrets/tokens/apiKeys
- Outbox payloads reject answer key fields via isOutboxPayloadAnswerKeySafe
- Answer key metadata (presence + status) can be reported without exposing content

## 9. Source Record Behavior

- teacher_created: free creation
- approved_source_import: requires approvedSourceId
- ai_assisted_draft: allowed as draft only
- safeSummary must not leak raw provider output

## 10. Usage Eligibility Behavior

- Exam usage: requires approved status + exam_secure or approved class + content safety review
- Practice usage: requires approved status + practice_safe or quiz_safe
- Restricted questions: blocked from practice/quiz/revision
- Oral usage: blocked unless policy explicitly configured
- Draft questions: blocked from all usage modes

## 11. Policy Fail-Closed Behavior

- QUESTION_DRAFT_CREATION: missing → blocks all draft mutations
- QUESTION_APPROVAL: missing → blocks submitQuestionForApproval
- QUESTION_EXAM_USAGE: missing → blocks exam eligibility (via future policy check)
- QUESTION_ORAL_USAGE: missing → blocks oral eligibility
- QUESTION_AI_ASSISTED_DRAFT: missing → ai_assisted_draft remains draft
- QUESTION_DEEN_CONTENT_AUTHORITY: missing → Deen-sensitive questions require policy pre-configuration
- All policies default to MISSING in a fresh registry

## 12. Package 1 Enforcement Integration

Every mutating command in GovernedQuestionCommandService calls `enforcementService.enforceGovernedCommand()` with:
- Required policies (QUESTION_DRAFT_CREATION, QUESTION_APPROVAL)
- Command context validation (schoolId, actorId, actorRole, correlationId, idempotencyKey)
- Policy registry check (fail-closed)
- Idempotency check (same key + same fingerprint → accepted; different fingerprint → conflict)
- Audit write (records every governed command execution)
- Optional version concurrency check

## 13. No-Duplication Proof

All 24 searched terms from the task specification were verified:
- 7 fully implemented (PracticeAttempt, LearningObjectiveRecord, CurriculumVersionRecord, ApprovedSourceRecord, ContentItemRecord, ExamModeQuestionStateRecord, QuizModeQuestionStateRecord) — not duplicated
- 1 reuse existing (ContentSafetyReview → ContentReviewRecord pattern)
- 15 missing in codebase — created fresh in Package 2
- No frontend imports, no AI provider imports, no route modifications
- Only files under backend/src/domains/assessment/question-bank/ created

## 14. Tests Run

Tests executed (focused file): package-2-governed-question-truth.test.ts

Test categories:
- 10.1 No-Duplication (3 tests)
- 10.2 Governed Command (6 tests)
- 10.3 Versioning (5 tests)
- 10.4 Curriculum Mapping (5 tests)
- 10.5 Source Record (4 tests)
- 10.6 Answer Key and Rubric Safety (5 tests)
- 10.7 Usage Eligibility (6 tests)
- 10.8 Approval-Ready State (4 tests)
- Classification Service (4 tests)
- Duplicate Fingerprint Service (3 tests)

Total: ~45 tests

## 15. Remaining Blockers for Package 3

- Prisma persistence models not yet created (deferred)
- No final approval command (submitQuestionForApproval only reaches pending_approval)
- No duplicate clustering (fingerprint service ready, clustering deferred)
- No backend routes (no Express endpoints created)
- No frontend UI (intentionally deferred)
- No AI question generation

## 16. Whether Package 3 Is Ready to Prompt

Yes — Package 3 is ready to prompt. The question-bank domain foundation is complete with governed contracts, versioning, curriculum mapping, source records, projection safety, and enforcement integration. Package 3 can begin building on this foundation with Prisma persistence, backend routes, or the next layer of question-bank capabilities.
