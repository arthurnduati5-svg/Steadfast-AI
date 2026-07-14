# Package 4: Route Contract

## Routes Implemented

All routes mounted at `/api/question-bank` prefix.

### POST /api/question-bank/blueprints
- Purpose: Create a new exam blueprint
- Request body: title, subjectId, curriculumVersionId, gradeBand, examType
- Response envelope: ok, requestId, correlationId, resourceId (blueprintId), status
- Idempotency: Required via x-idempotency-key header
- Role context: Requires teacher/lead_teacher/admin role
- Safe error codes: SCHOOL_CONTEXT_REQUIRED, POLICY_BLOCKED, VALIDATION_FAILED

### POST /api/question-bank/blueprints/:blueprintId/versions
- Purpose: Create a new version of an existing blueprint
- Request body: title, safeDescription, durationMinutes, totalMarks, targetQuestionCount, difficultyMixJson, questionTypeMixJson, securityClassRequirement, coveragePolicy, selectionStrategy
- Response envelope: resourceId (blueprintVersionId)
- Idempotency: Required
- Forbidden leakage: None

### POST /api/question-bank/blueprint-versions/:blueprintVersionId/requirements
- Purpose: Add a coverage requirement to a blueprint version
- Request body: requirementType, subjectId, topicId, skillId, objectiveId, requiredQuestionCount, requiredMarks, minimumDifficulty, maximumDifficulty, questionType, weight, isMandatory
- Idempotency: Required
- Immutability: Cannot modify approved versions

### POST /api/question-bank/blueprint-versions/:blueprintVersionId/submit-approval
- Purpose: Submit blueprint version for approval
- Idempotency: Required
- Role context: Requires teacher/lead_teacher/admin

### POST /api/question-bank/blueprint-versions/:blueprintVersionId/approve
- Purpose: Approve a blueprint version (makes it immutable)
- Idempotency: Required
- Role context: Requires lead_teacher/department_head/admin; student/parent blocked

### POST /api/question-bank/blueprint-versions/:blueprintVersionId/draft-sets
- Purpose: Generate draft paper candidates from an approved blueprint
- Request body: requestedDraftCount (3-10)
- Idempotency: Required
- Forbidden leakage: No answer keys or correctAnswerSummary

### GET /api/question-bank/blueprints/:blueprintId
- Purpose: Get blueprint by ID
- Role context: All authenticated roles
- No idempotency required (read-only)

### GET /api/question-bank/blueprints/:blueprintId/versions
- Purpose: List all versions for a blueprint
- Role context: All authenticated roles

### GET /api/question-bank/blueprint-versions/:blueprintVersionId/requirements
- Purpose: List requirements for a blueprint version
- Role context: All authenticated roles

### GET /api/question-bank/draft-sets/:draftSetId
- Purpose: Get draft set by ID
- Role context: All authenticated roles

### GET /api/question-bank/draft-sets/:draftSetId/drafts
- Purpose: List drafts within a draft set
- Role context: Teacher/admin views include draft details

### GET /api/question-bank/drafts/:draftId
- Purpose: Get draft with question references
- Role context: Student/parent returns FORBIDDEN
- Safety: No answer key leakage

## Safe Response Envelope

All responses use `createSafeResponseEnvelope` with keys: ok, requestId, correlationId, resourceId, resourceVersion, status, safeMessage, reasonCode, policyDecision, nextAllowedActions, data, errorCode.

## Safe Error Codes

AUTH_REQUIRED, SCHOOL_CONTEXT_REQUIRED, VALIDATION_FAILED, POLICY_BLOCKED, IDEMPOTENCY_CONFLICT, VERSION_CONFLICT, NOT_FOUND, FORBIDDEN_FIELD, INSUFFICIENT_QUESTION_POOL, COVERAGE_GAP, DEPENDENCY_UNAVAILABLE, UNKNOWN_SAFE_ERROR

## Forbidden Leakage Rules

- Student/parent views are forbidden for draft internals
- Answer keys (answerKeySafeRef, correctAnswerSummary, markingNotesTeacherOnly, rubricInternal) never exposed
- No AI/OCR/provider calls
- No ExamMode, attempt, or mastery mutations
