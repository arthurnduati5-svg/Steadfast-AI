# Package 6 - Route Contract

## Mounting

All routes mounted under `/api/question-bank/exam-papers` with `schoolAuthMiddleware` and `requireVerifiedSchoolContext`.

## Routes

| Method | Path | Purpose | Idempotency | Safeguards |
|--------|------|---------|-------------|------------|
| POST | `/api/question-bank/exam-papers` | Create new paper shell | Required | School context, role validation |
| POST | `/api/question-bank/exam-papers/from-draft/:draftId` | Assemble paper from draft | Required | School context, role validation |
| GET | `/api/question-bank/exam-papers/:paperId` | Get paper metadata | N/A | School context |
| GET | `/api/question-bank/exam-papers/:paperId/versions` | List paper versions | N/A | School context |
| POST | `/api/question-bank/exam-papers/:paperId/versions` | Create new version | Required | School context, role validation |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId` | Get version details | N/A | School context |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/sections` | List sections | N/A | School context |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/questions` | List questions | N/A | School context |
| POST | `/api/question-bank/exam-paper-versions/:paperVersionId/variants` | Create variant plan | Required | School context, role validation |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/variants` | List variants | N/A | School context |
| POST | `/api/question-bank/exam-paper-versions/:paperVersionId/access-policy` | Create access policy | Required | School context, role validation |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/access-policy` | Get access policy | N/A | School context |
| POST | `/api/question-bank/exam-paper-versions/:paperVersionId/approve` | Approve paper version | Required | School context, approval role |
| POST | `/api/question-bank/exam-paper-versions/:paperVersionId/delivery-bridge` | Create delivery bridge | Required | School context, role validation |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/delivery-bridge` | Get delivery bridge | N/A | School context |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/projection/teacher` | Teacher projection | N/A | School context, role scoped |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/projection/student-preview` | Student preview | N/A | School context, no answer keys |
| GET | `/api/question-bank/exam-paper-versions/:paperVersionId/projection/parent-preview` | Parent preview | N/A | School context, no answer keys |

## Response Envelope

```json
{
  "ok": true,
  "requestId": "uuid",
  "correlationId": "uuid",
  "resourceId": "uuid",
  "resourceVersion": "1",
  "status": "draft",
  "safeMessage": "Operation completed",
  "reasonCode": "OK",
  "policyDecision": "ALLOWED",
  "nextAllowedActions": ["action1", "action2"],
  "data": {}
}
```

## Safe Error Codes

- AUTH_REQUIRED
- SCHOOL_CONTEXT_REQUIRED
- VALIDATION_FAILED
- POLICY_BLOCKED
- IDEMPOTENCY_CONFLICT
- VERSION_CONFLICT
- NOT_FOUND
- FORBIDDEN_FIELD
- DRAFT_NOT_APPROVED
- DRAFT_SELECTION_REQUIRED
- QUESTION_HELD
- ANSWER_KEY_PROTECTED
- RUBRIC_PROTECTED
- VARIANT_NOT_ALLOWED
- ACCESS_POLICY_INVALID
- APPROVAL_REQUIRED
- DELIVERY_BRIDGE_DEFERRED
- DELIVERY_NOT_ACTIVE
- DEPENDENCY_DEFERRED
- DEPENDENCY_UNAVAILABLE
- UNKNOWN_SAFE_ERROR

## Forbidden Leakage Rules

- Student preview routes never expose answerKeyText, correctAnswerSummary, rubricInternal, rubricText
- Parent preview routes never expose any question content
- Teacher projection remains role-scoped
- Delivery bridge routes never create live sessions

## Deferred Behavior

- Equivalent question variant generation returns blocked status with explanation
- Full Prisma integration requires running Prisma Generate
