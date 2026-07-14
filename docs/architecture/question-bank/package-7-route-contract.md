# Package 7: Route Contract

Base path: `/api/question-bank/exam-delivery`

## Session Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| POST | /sessions | Create delivery session | Required | Required |
| GET | /sessions/:deliverySessionId | Get session | N/A | Required |
| GET | /sessions | List sessions (query: status) | N/A | Required |
| POST | /sessions/:deliverySessionId/open | Open session | Required | Required |
| POST | /sessions/:deliverySessionId/pause | Pause session | Required | Required |
| POST | /sessions/:deliverySessionId/resume | Resume session | Required | Required |
| POST | /sessions/:deliverySessionId/close | Close session | Required | Required |
| POST | /sessions/:deliverySessionId/cancel | Cancel session | Required | Required |

## Assignment Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| POST | /sessions/:deliverySessionId/assignments | Assign variant to student | Required | Required |
| POST | /sessions/:deliverySessionId/assignments/bulk | Bulk assign variants | Required | Required |
| GET | /sessions/:deliverySessionId/assignments | List assignments | N/A | Required |
| GET | /sessions/:deliverySessionId/assignments/:studentRef | Get student assignment | N/A | Required |
| POST | /assignments/:variantAssignmentId/revoke | Revoke assignment | Required | Required |

## Attempt Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| POST | /assignments/:variantAssignmentId/attempts | Start attempt | Required | Required |
| GET | /attempts/:attemptId | Get attempt | N/A | Required |
| POST | /attempts/:attemptId/pause | Pause attempt | Required | Required |
| POST | /attempts/:attemptId/resume | Resume attempt | Required | Required |
| POST | /attempts/:attemptId/cancel | Cancel attempt | Required | Required |
| POST | /attempts/:attemptId/expire | Expire attempt | Required | Required |
| POST | /attempts/:attemptId/submit | Submit attempt | Required | Required |

## Question Snapshot Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| GET | /attempts/:attemptId/questions | List question snapshots | N/A | Required |

## Answer Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| POST | /attempts/:attemptId/answers | Save/submit answer | Required | Required |
| GET | /attempts/:attemptId/answers | List answers | N/A | Required |
| POST | /answers/:answerSubmissionId/submit | Submit specific answer | Required | Required |

## Timing Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| POST | /attempts/:attemptId/timing/heartbeat | Record heartbeat | Not required | Required |

## Submission Snapshot Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| POST | /attempts/:attemptId/submission-snapshot | Seal submission snapshot | Required | Required |
| GET | /attempts/:attemptId/submission-snapshot | Get submission snapshot | N/A | Required |

## Projection Routes

| Method | Path | Purpose | Idempotency | School Context |
|--------|------|---------|-------------|----------------|
| GET | /attempts/:attemptId/projection/student | Student attempt view | N/A | Required |
| GET | /sessions/:deliverySessionId/projection/teacher | Teacher session view | N/A | Required |
| GET | /sessions/:deliverySessionId/projection/admin | Admin session view | N/A | Required |

## Response Envelope
```json
{
  "ok": true,
  "requestId": "...",
  "correlationId": "...",
  "resourceId": "...",
  "resourceVersion": null,
  "status": "ok",
  "safeMessage": "...",
  "reasonCode": "...",
  "policyDecision": { "allowed": true, ... },
  "nextAllowedActions": [],
  "data": {}
}
```

## Safe Error Codes
AUTH_REQUIRED, SCHOOL_CONTEXT_REQUIRED, VALIDATION_FAILED, POLICY_BLOCKED, IDEMPOTENCY_CONFLICT, NOT_FOUND, SESSION_NOT_OPEN, ATTEMPT_NOT_ACTIVE, ATTEMPT_SUBMITTED, ANSWER_KEY_PROTECTED, RUBRIC_PROTECTED, MARKING_DEFERRED, FINALIZATION_DEFERRED, PARENT_RELEASE_DEFERRED, MASTERY_MUTATION_DEFERRED, UNKNOWN_SAFE_ERROR

## Forbidden Fields in Student Projection
answerKeySafeRef, answerKeyText, correctAnswerSummary, rubricInternal, rubricText, markingNotesTeacherOnly, teacherOnlyNotes, selectionReasonInternal, variantAlgorithmInternals, sourceDraftScoringInternals, hiddenReasoning, chainOfThought, rawQuestionMetadata, deliveryActivationToken, markingResult, score, finalGrade, parentReleaseStatus, masteryMutation

## Deferred Behavior
- Route mounting in backend index.ts (deferred to integration step).
- No marking run creation.
- No score calculation.
- No finalization.
- No parent release.
