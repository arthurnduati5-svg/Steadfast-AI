# Package 3 — No-Duplication Scan

Date: 2026-07-13
Scope: backend/prisma/, backend/src/, docs/, frontend/

## Results

### QuestionBankItemRecord
- Existing equivalent: PARTIAL
- Files inspected: `backend/src/domains/assessment/question-bank/contracts/questionBankItemContracts.ts`
- Reuse decision: REUSE existing `QuestionBankItem` interface
- Create decision: Prisma model `QuestionBankItemRecord` needed for persistence
- Duplication risk: Low — type contract and Prisma model serve different layers
- Final decision: CREATE Prisma model `QuestionBankItemRecord` mapping from `QuestionBankItem` contract

### QuestionVersionRecord
- Existing equivalent: PARTIAL
- Files inspected: `backend/src/domains/assessment/question-bank/contracts/questionVersionContracts.ts`
- Reuse decision: REUSE existing `QuestionVersion`, `QuestionPartVersion`, `QuestionAssetVersion` interfaces
- Create decision: Prisma models needed for persistence
- Duplication risk: Low
- Final decision: CREATE Prisma models

### AnswerKeyVersionRecord / RubricVersionRecord
- Existing equivalent: PARTIAL
- Files inspected: `backend/src/domains/assessment/question-bank/contracts/answerKeyAndRubricContracts.ts`
- Reuse decision: REUSE existing `AnswerKeyVersion`, `RubricVersion` interfaces
- Create decision: Prisma models needed for persistence
- Duplication risk: Low
- Final decision: CREATE Prisma models

### QuestionObjectiveMappingRecord
- Existing equivalent: PARTIAL
- Files inspected: `backend/src/domains/assessment/question-bank/contracts/questionObjectiveMappingContracts.ts`
- Reuse decision: REUSE existing `QuestionObjectiveMapping` interface
- Create decision: Prisma model needed
- Duplication risk: Low
- Final decision: CREATE Prisma model

### QuestionSourceRecord
- Existing equivalent: YES (TypeScript contract + repository)
- Files inspected: contracts/questionSourceRecordContracts.ts, repository contracts, in-memory repo
- Reuse decision: REUSE existing interface and repository interface
- Create decision: Prisma model needed
- Duplication risk: Low
- Final decision: CREATE Prisma model

### QuestionCurriculumValidityRecord / QuestionUsageEligibilityRecord
- Existing equivalent: PARTIAL (TypeScript interfaces only)
- Files inspected: `questionGovernanceContracts.ts`
- Reuse decision: REUSE existing interfaces
- Create decision: Prisma models needed
- Duplication risk: Low
- Final decision: CREATE Prisma models

### QuestionApprovalRequestRecord
- Existing equivalent: NO
- Files inspected: none found
- Reuse decision: None available
- Create decision: Must create from scratch
- Duplication risk: None
- Final decision: CREATE new

### QuestionApprovalRecord
- Existing equivalent: NO
- Files inspected: none found
- Reuse decision: None available
- Create decision: Must create from scratch
- Duplication risk: None
- Final decision: CREATE new

### QuestionDuplicateCandidateRecord
- Existing equivalent: NO
- Files inspected: none found (DuplicateFingerprintService exists but no candidate records)
- Reuse decision: None available
- Create decision: Must create from scratch
- Duplication risk: None
- Final decision: CREATE new

### QuestionExposureHoldRecord
- Existing equivalent: NO
- Files inspected: none found
- Reuse decision: None available
- Create decision: Must create from scratch
- Duplication risk: None
- Final decision: CREATE new

### QuestionIngestionBatchRecord
- Existing equivalent: NO
- Files inspected: none found
- Reuse decision: None available
- Create decision: Must create from scratch
- Duplication risk: None
- Final decision: CREATE new

### QuestionIngestionCandidateRecord
- Existing equivalent: NO
- Files inspected: none found
- Reuse decision: None available
- Create decision: Must create from scratch
- Duplication risk: None
- Final decision: CREATE new

## Reused Existing Models

| Model | Reuse Decision |
|-------|---------------|
| CurriculumVersionRecord | REUSE — foreign key reference only |
| LearningObjectiveRecord | REUSE — foreign key reference only |
| ApprovedSourceRecord | REUSE — foreign key reference only |
| ContentItemRecord | REUSE — distinct purpose, not duplicated |
| ContentReviewRecord | REUSE — bridge ContentSafetyReview to this existing model |
| DurableAuditEvent | REUSE — use for all question bank auditing |
| SchoolIntegrationIdempotencyRecord | REUSE — use for ingestion idempotency |
