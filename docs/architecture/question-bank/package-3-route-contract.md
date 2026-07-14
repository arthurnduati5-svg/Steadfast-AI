# Package 3 — Route Contract

## Base Path

All routes are mounted at `/api/question-bank` via `backend/src/index.ts`:
```
app.use('/api/question-bank', schoolAuthMiddleware, questionBankRoutes);
```

## Route Table

### Drafts & Versions

| Method | Path | Purpose |
|--------|------|---------|
| POST | /drafts | Create a new question draft |
| POST | /versions | Create a question version draft |
| POST | /parts | Attach a part to a version |
| POST | /assets | Attach an asset to a version |
| POST | /answer-keys | Attach an answer key to a version |
| POST | /rubrics | Attach a rubric to a version |
| POST | /objective-mappings | Map a version to a learning objective |
| POST | /source-records | Record a question source |
| POST | /curriculum-validity | Check curriculum validity for a version |
| POST | /usage-eligibility | Check usage eligibility for a version |
| POST | /submit-approval | Submit a question for approval |

### Ingestion

| Method | Path | Purpose |
|--------|------|---------|
| POST | /ingestion/batches | Create an ingestion batch |
| POST | /ingestion/candidates | Add a manual ingestion candidate |
| POST | /ingestion/candidates/:candidateId/validate | Validate a candidate |
| POST | /ingestion/candidates/:candidateId/accept | Accept candidate as question draft |
| POST | /ingestion/candidates/:candidateId/reject | Reject a candidate with reason |
| GET | /ingestion/batches/:batchId/candidates | List all candidates in a batch |

### Approval

| Method | Path | Purpose |
|--------|------|---------|
| POST | /approval-requests | Create an approval request |
| GET | /approval-requests/pending | List pending approval requests |
| POST | /approval-requests/:approvalRequestId/decision | Record an approval decision |

### Duplicate Candidates

| Method | Path | Purpose |
|--------|------|---------|
| POST | /duplicate-candidates | Record a suspected duplicate |
| POST | /duplicate-candidates/:duplicateCandidateId/resolve | Resolve a duplicate candidate |

### Exposure Holds

| Method | Path | Purpose |
|--------|------|---------|
| POST | /exposure-holds | Place an exposure hold on a question |
| POST | /exposure-holds/:exposureHoldId/release | Release an exposure hold |
| GET | /questions/:questionId/exposure-holds | List active exposure holds for a question |

### Read Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /questions/:questionId | Get question item (safe projection) |
| GET | /questions/:questionId/versions | List versions for a question |
| GET | /versions/:questionVersionId | Get version detail (safe projection) |

## Request Body Summary

All POST routes accept JSON bodies. Key fields for each route:

- `/drafts`: `{ schoolId, subjectId, topicId, skillId, curriculumVersionId, primaryObjectiveId, sourceType, securityClass }`
- `/versions`: `{ questionId, stemSafeText, questionType, difficultyBand, language, studentSafeExplanation, teacherExplanation, estimatedTimeSeconds }`
- `/ingestion/batches`: `{ sourceType, approvedSourceId, importBatchRef, safeSummary }`
- `/ingestion/candidates`: `{ ingestionBatchId, candidateType, stemSafeText, questionType, subjectId, topicId, skillId, curriculumVersionId, primaryObjectiveId, approvedSourceId, sourceRef, safeMetadataJson }`
- `/approval-requests`: `{ questionId, questionVersionId, requestReason }`
- `/approval-requests/:id/decision`: `{ decision, decisionReason, reasonCodes }`
- `/duplicate-candidates`: `{ sourceQuestionVersionId, candidateQuestionVersionId, contentHash, similarityReason }`
- `/exposure-holds`: `{ questionId, questionVersionId, holdType, reasonCode, safeSummary }`

## Response Envelope

All responses use the safe response envelope shape:
```json
{
  "ok": true,
  "requestId": "uuid",
  "correlationId": "uuid",
  "resourceId": "uuid-or-null",
  "resourceVersion": "version-or-null",
  "status": "descriptive_status",
  "safeMessage": "Human-readable message",
  "reasonCode": "MACHINE_REASON",
  "policyDecision": "decision-or-null",
  "nextAllowedActions": [],
  "data": {},
  "errorCode": null
}
```

## Idempotency Behavior

All mutating POST routes require an idempotency key via `x-idempotency-key` header or `idempotencyKey` in the request body. Routes return 400 if idempotency key is missing.

Child commands within multi-step operations (e.g., accept candidate → create draft + version) derive child idempotency keys by appending `-draft`, `-version` suffixes.

## Role/School Context Behavior

Actor context is extracted via `extractMockAssessmentActorContext` (dev-only) from headers:
- `x-school-id` — required
- `x-actor-id` — defaults to `mock-actor`
- `x-actor-role` — defaults to `teacher`; validated against allowed roles

Student/parent roles receive limited projections:
- Answer keys, teacher-only notes, and marking guidance are not included
- `teacherExplanation` is excluded from student/parent responses

## Safe Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `SCHOOL_CONTEXT_REQUIRED` | 400 | Missing school context |
| `VALIDATION_FAILED` | 400 | Input validation failure |
| `APPROVED_SOURCE_REQUIRED` | 400 | Approved source ID required for import |
| `IDEMPOTENCY_REQUIRED` | 400 | Missing idempotency key |
| `AUTH_REQUIRED` | 401 | Authentication required |
| `POLICY_BLOCKED` | 403 | Policy enforcement blocked the action |
| `FORBIDDEN_FIELD` | 403 | Field not allowed for this role |
| `NOT_FOUND` | 404 | Resource not found |
| `IDEMPOTENCY_CONFLICT` | 409 | Idempotency key conflict |
| `VERSION_CONFLICT` | 409 | Version conflict |
| `INVALID_STATE` | 409 | Resource in wrong state for action |
| `DEPENDENCY_UNAVAILABLE` | 503 | External dependency unavailable |

## Forbidden Leakage Rules

- Routes must not import: `openai`, `genkit`, `pinecone`, `ollama`, `react`, `next`, `frontend`
- `backend/src/routes/ai.ts` must not import or reference question bank functionality
- Student-safe GET projections must exclude: `answerKey`, `correctAnswer`, `modelAnswer`, `markingScheme`, `rubricInternal`, `teacherOnlyNotes`, `hiddenReasoning`
