# Package 8 Route Contract

All routes mounted under `/api/question-bank/marking-invocation` with `schoolAuthMiddleware` and `requireVerifiedSchoolContext`.

## Route Table

| Method | Path | Purpose | Idempotency | Role |
|--------|------|---------|-------------|------|
| POST | /requests | Create marking invocation request | Required | teacher/admin/system_job |
| GET | /requests/:id | Get invocation request | Not required | teacher/admin |
| GET | /requests | List school invocation requests | Not required | teacher/admin |
| POST | /requests/:id/validate | Validate invocation request | Required | teacher/admin |
| POST | /requests/:id/queue | Queue invocation request | Required | teacher/admin |
| POST | /requests/:id/cancel | Cancel invocation request | Required | teacher/admin |
| POST | /requests/:id/intake-snapshots | Intake submission snapshots | Required | teacher/admin |
| GET | /requests/:id/intake-snapshots | List intakes for request | Not required | teacher/admin |
| GET | /intake-snapshots/:id | Get single snapshot intake | Not required | teacher/admin |
| POST | /requests/:id/readiness-checks | Run readiness check | Required | teacher/admin |
| GET | /requests/:id/readiness-checks | List readiness checks | Not required | teacher/admin |
| POST | /requests/:id/batches | Create marking batch | Required | teacher/admin |
| GET | /requests/:id/batches | List batches for request | Not required | teacher/admin |
| GET | /batches/:id | Get single batch | Not required | teacher/admin |
| GET | /batches/:id/items | List batch items | Not required | teacher/admin |
| POST | /batches/:id/queue | Queue batch for execution | Required | teacher/admin |
| POST | /batches/:id/execute-deterministic | Execute deterministic marking | Required | teacher/admin |
| POST | /batch-items/:id/execute-deterministic | Execute single deterministic item | Required | teacher/admin |
| POST | /batch-items/:id/dispatch-teacher-review | Dispatch to teacher review | Required | teacher/admin |
| GET | /batch-items/:id/result-links | Get result links for item | Not required | teacher/admin |
| GET | /requests/:id/result-links | Get result links for request | Not required | teacher/admin |
| GET | /requests/:id/projection/teacher | Teacher projection | Not required | teacher |
| GET | /requests/:id/projection/admin | Admin projection | Not required | admin |
| GET | /requests/:id/projection/student-safe | Student-safe projection | Not required | student |

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
AUTH_REQUIRED, SCHOOL_CONTEXT_REQUIRED, VALIDATION_FAILED, POLICY_BLOCKED, IDEMPOTENCY_CONFLICT, NOT_FOUND, FORBIDDEN_FIELD, SNAPSHOT_ALREADY_INTAKEN, DETERMINISTIC_MARKING_UNSUPPORTED, AI_MARKING_DEFERRED, UNKNOWN_SAFE_ERROR

## Forbidden Leakage Rules
- No answer keys in any response
- No rubric internals in student-safe projections
- No final grades
- No parent release status
- No mastery mutation fields

## Deferred Behavior
- AI marking: deferred (returns AI_MARKING_DEFERRED)
- OCR: deferred (not implemented)
- Finalization: deferred
- Parent release: deferred
