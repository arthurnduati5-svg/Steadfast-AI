# Package 5 - Route Contract

## Route Table

| Method | Path | Purpose | Request Body | Idempotency | Role |
|--------|------|---------|-------------|-------------|------|
| POST | /api/question-bank/marking/runs | Create marking run | sourceType, sourceRef, safeSummary | YES | teacher/lead_teacher/admin/system_job |
| POST | /api/question-bank/marking/runs/:markingRunId/snapshots | Mark single snapshot | snapshot, input | YES | teacher/lead_teacher/admin |
| POST | /api/question-bank/marking/runs/:markingRunId/batches | Mark batch | snapshots[], inputs[] | YES | teacher/lead_teacher/admin |
| GET | /api/question-bank/marking/runs/:markingRunId | Get marking run | - | NO | Any authenticated |
| GET | /api/question-bank/marking/runs/:markingRunId/results | List results | - | NO | Any authenticated |
| GET | /api/question-bank/marking/results/:markingResultVersionId | Get result | - | NO | Any authenticated |
| GET | /api/question-bank/marking/results/:markingResultVersionId/breakdown | Get breakdown | - | NO | Any authenticated |
| GET | /api/question-bank/marking/review-groups/open | List open review groups | - | NO | teacher/lead_teacher/admin |
| GET | /api/question-bank/marking/review-groups/:groupId/items | List review items | - | NO | teacher/lead_teacher/admin |
| POST | /api/question-bank/marking/review-items/:itemId/assign | Assign review item | - | YES | teacher/lead_teacher/admin |
| POST | /api/question-bank/marking/review-items/:itemId/resolve | Resolve review item | resolution | YES | teacher/lead_teacher/admin |
| POST | /api/question-bank/marking/results/:resultId/overrides | Create teacher override | decision, newMarks, reasonCode | YES | teacher/lead_teacher/admin |
| POST | /api/question-bank/marking/results/:resultId/moderation | Create moderation | decision, safeReason | YES | lead_teacher/department_head/admin |
| POST | /api/question-bank/marking/results/:resultId/challenges | Submit challenge | studentId, challengeReasonCode | YES | student (own) |
| POST | /api/question-bank/marking/challenges/:challengeId/resolve | Resolve challenge | resolution, summary | YES | teacher/lead_teacher/admin |

## Response Envelope
```json
{
  "ok": true,
  "requestId": "uuid",
  "correlationId": "uuid",
  "resourceId": "uuid",
  "status": "string",
  "safeMessage": "string",
  "reasonCode": "string",
  "data": {}
}
```

## Safe Error Codes
AUTH_REQUIRED, SCHOOL_CONTEXT_REQUIRED, VALIDATION_FAILED, POLICY_BLOCKED, IDEMPOTENCY_CONFLICT, VERSION_CONFLICT, NOT_FOUND, FORBIDDEN_FIELD, UNSUPPORTED_QUESTION_TYPE, ANSWER_KEY_REQUIRED, RUBRIC_REQUIRED, TEACHER_REVIEW_REQUIRED, MODERATION_REQUIRED, CHALLENGE_NOT_ALLOWED, DEPENDENCY_DEFERRED, UNKNOWN_SAFE_ERROR

## Forbidden Leakage Rules
- Student projections strip answerKeySafeRef, correctAnswerSummary, teacherOnlyNotes
- Parent projections additionally strip confidence, reviewReasonCode, safeTeacherSummary
- No route exposes rawStudentWork, rawFileUpload, rawAudio, rawImage, OCR text, hidden reasoning
