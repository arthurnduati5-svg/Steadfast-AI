# Package 3 — Durable Ingestion Governance

## 1. Package 3 Scope

Package 3 adds the durable ingestion governance layer to the question bank:
- Prisma persistence models (16 models)
- Prisma repository adapters mapping rows to existing Package 2 contracts
- Ingestion batch and candidate management
- Approval request and approval record foundation
- Content safety review bridge (reuses `ContentReviewRecord`)
- Duplicate candidate detection and resolution foundation
- Exposure hold and release foundation
- Backend routes under `/api/question-bank`

## 2. Package 2 Closure Proof

Package 2 was committed as:
```
71d0291 feat(qbank): add package 2 governed question truth foundation
```

Package 2 delivered:
- `GovernedQuestionCommandService` with enforcement, idempotency, audit
- Domain contracts for question items, versions, parts, assets, answer keys, rubrics, objective mappings, source records, and governance checks
- In-memory repositories
- Question bank policy families
- Duplicate fingerprint service
- Student-safe projection functions

All Package 2 contracts and services are reused by Package 3; nothing was duplicated.

## 3. No-Duplication Scan Summary

See `package-3-no-duplication-scan.md` for full details. Key decisions:
- `ContentReviewRecord` — REUSED (not duplicated as `QuestionContentReviewRecord`)
- `CurriculumVersionRecord` — REUSED as foreign key reference
- `LearningObjectiveRecord` — REUSED as foreign key reference
- `ApprovedSourceRecord` — REUSED as foreign key reference
- `ContentItemRecord` — REUSED, not duplicated
- `DurableAuditEvent` — REUSED for question bank auditing
- `SchoolIntegrationIdempotencyRecord` — REUSED for ingestion idempotency

## 4. Prisma Models Added

| Model | Purpose |
|-------|---------|
| `QuestionBankItemRecord` | Persistence for question bank items |
| `QuestionVersionRecord` | Persistence for question versions |
| `QuestionPartVersionRecord` | Persistence for question part versions |
| `QuestionAssetVersionRecord` | Persistence for question asset versions |
| `AnswerKeyVersionRecord` | Persistence for answer key versions |
| `RubricVersionRecord` | Persistence for rubric versions |
| `QuestionObjectiveMappingRecord` | Persistence for question-to-objective mappings |
| `QuestionSourceRecordRecord` | Persistence for question source records |
| `QuestionCurriculumValidityRecord` | Persistence for curriculum validity checks |
| `QuestionUsageEligibilityRecord` | Persistence for usage eligibility checks |
| `QuestionApprovalRequestRecord` | Persistence for approval requests |
| `QuestionApprovalRecord` | Persistence for approval decisions |
| `QuestionDuplicateCandidateRecord` | Persistence for duplicate candidates |
| `QuestionExposureHoldRecord` | Persistence for exposure holds |
| `QuestionIngestionBatchRecord` | Persistence for ingestion batches |
| `QuestionIngestionCandidateRecord` | Persistence for ingestion candidates |

## 5. Existing Models Reused

| Model | Reuse |
|-------|-------|
| `ContentReviewRecord` | Content safety review bridge writes to this model |
| `CurriculumVersionRecord` | Foreign key reference for curriculum versioning |
| `LearningObjectiveRecord` | Foreign key reference for objective mappings |
| `ApprovedSourceRecord` | Foreign key reference for approved source imports |
| `ContentItemRecord` | Separate purpose, not duplicated |
| `DurableAuditEvent` | Used for question bank audit events |
| `SchoolIntegrationIdempotencyRecord` | Used for ingestion idempotency |

## 6. Repository Adapters Added

- `PrismaQuestionBankItemRepository` — wraps `QuestionBankItemRecord`
- `PrismaQuestionVersionRepository` — wraps `QuestionVersionRecord`
- `PrismaQuestionPartVersionRepository` — wraps `QuestionPartVersionRecord`
- `PrismaQuestionAssetVersionRepository` — wraps `QuestionAssetVersionRecord`
- `PrismaAnswerKeyVersionRepository` — wraps `AnswerKeyVersionRecord`
- `PrismaRubricVersionRepository` — wraps `RubricVersionRecord`
- `PrismaQuestionObjectiveMappingRepository` — wraps `QuestionObjectiveMappingRecord`
- `PrismaQuestionSourceRecordRepository` — wraps `QuestionSourceRecordRecord`
- `PrismaQuestionGovernanceRepository` — wraps curriculum validity, usage eligibility, and content safety reviews
- `PrismaQuestionApprovalRequestRepository` — wraps `QuestionApprovalRequestRecord`
- `PrismaQuestionApprovalRecordRepository` — wraps `QuestionApprovalRecord`
- `PrismaQuestionIngestionBatchRepository` — wraps `QuestionIngestionBatchRecord`
- `PrismaQuestionIngestionCandidateRepository` — wraps `QuestionIngestionCandidateRecord`
- `PrismaQuestionDuplicateCandidateRepository` — wraps `QuestionDuplicateCandidateRecord`
- `PrismaQuestionExposureHoldRepository` — wraps `QuestionExposureHoldRecord`

## 7. Ingestion Flow

1. `POST /api/question-bank/ingestion/batches` — creates an ingestion batch with school context
2. `POST /api/question-bank/ingestion/candidates` — adds a candidate with content hash dedup
3. `POST /api/question-bank/ingestion/candidates/:candidateId/validate` — validates candidate (ready vs needs_correction)
4. `POST /api/question-bank/ingestion/candidates/:candidateId/accept` — creates question item + version draft
5. `POST /api/question-bank/ingestion/candidates/:candidateId/reject` — rejects candidate with reason code

All mutating steps enforce policies and require idempotency keys.

## 8. Approval Foundation Flow

1. Question must be in `pending_approval` state
2. `POST /api/question-bank/submit-approval` — submits question for approval
3. `POST /api/question-bank/approval-requests` — creates an approval request
4. `GET /api/question-bank/approval-requests/pending` — lists pending requests
5. `POST /api/question-bank/approval-requests/:approvalRequestId/decision` — records approval decision
6. Approved → item/version status set to `approved`
7. Rejected/blocked → item/version status set to `rejected`
8. Changes requested → approval request status set to `changes_requested`

## 9. Content Safety Review Bridge

`QuestionContentSafetyReviewBridge` maps between domain-level `ContentSafetyReview` and the existing `ContentReviewRecord` Prisma model. The bridge:
- Creates safety reviews with `targetType = 'question_version'`
- Reads the latest review for a given question version
- No new Prisma model was created for content safety

## 10. Duplicate Candidate and Exposure Hold Foundation

- `QuestionDuplicateCandidateService` — records and resolves suspected duplicates
- `QuestionExposureHoldService` — places, releases, and lists exposure holds
- Both enforce policies and require governance
- Holds do not delete questions or versions

## 11. Backend Routes Added

All routes are mounted at `/api/question-bank`:

| Method | Path | Purpose |
|--------|------|---------|
| POST | /drafts | Create question draft |
| POST | /versions | Create question version draft |
| POST | /parts | Create question part draft |
| POST | /assets | Create question asset draft |
| POST | /answer-keys | Create answer key draft |
| POST | /rubrics | Create rubric draft |
| POST | /objective-mappings | Create objective mapping |
| POST | /source-records | Create source record |
| POST | /curriculum-validity | Check curriculum validity |
| POST | /usage-eligibility | Check usage eligibility |
| POST | /submit-approval | Submit for approval |
| POST | /ingestion/batches | Create ingestion batch |
| POST | /ingestion/candidates | Add ingestion candidate |
| POST | /ingestion/candidates/:cid/validate | Validate candidate |
| POST | /ingestion/candidates/:cid/accept | Accept candidate as draft |
| POST | /ingestion/candidates/:cid/reject | Reject candidate |
| GET | /ingestion/batches/:bid/candidates | List batch candidates |
| POST | /approval-requests | Create approval request |
| GET | /approval-requests/pending | List pending requests |
| POST | /approval-requests/:arid/decision | Record approval decision |
| POST | /duplicate-candidates | Record duplicate candidate |
| POST | /duplicate-candidates/:dcid/resolve | Resolve duplicate |
| POST | /exposure-holds | Place exposure hold |
| POST | /exposure-holds/:ehid/release | Release exposure hold |
| GET | /questions/:qid/exposure-holds | List active holds |
| GET | /questions/:qid | Get question item |
| GET | /questions/:qid/versions | List versions |
| GET | /versions/:vid | Get version detail |

## 12. Safe Response Envelope

All responses use `createSafeResponseEnvelope` with:
- `ok` (boolean)
- `requestId`
- `correlationId`
- `resourceId` (for created resources)
- `status` (string)
- `safeMessage`
- `reasonCode`
- `errorCode` (on errors)

## 13. Forbidden Scope Not Touched

- No exam paper, blueprint, or marking models created
- No OCR, AI generation, or provider imports
- No frontend files modified
- `backend/src/routes/ai.ts` was not expanded for question bank
- No React, Next.js, OpenAI, Genkit, Pinecone, or Ollama imports

## 14. Tests Run

- `package-3-durable-persistence.test.ts` — 23 tests (schema model assertions + repository exports)
- `package-3-ingestion-governance.test.ts` — 20 tests (ingestion flow + approval + duplicate + exposure)
- `package-3-routes.contract.test.ts` — 17 tests (route structure + no-duplication + forbidden scope)
- Package 2 regression test also passes

## 15. Known Deferred Items

- Prisma repositories use `any` type for Prisma row mapping (pragmatic choice)
- `extractMockAssessmentActorContext` is dev-only and must be replaced with real auth middleware
- Route tests run without actual database (in-memory repositories used)
- `QuestionSourceRecordRecord` has naming stutter (double `Record`) — acknowledged as non-blocking

## 16. Package 4 Readiness

Package 4 (question bank blueprinting, exam paper generation, selection engine) is ready to prompt. All Package 3 acceptance gates pass. No cross-contamination of Package 4 features exists.
