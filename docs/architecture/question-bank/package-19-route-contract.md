# Package 19: Route Contract — Recovery Outcome Decision Gate

## Mount

```
Path: /api/question-bank/recovery-outcome
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```

## Safe Response Envelope

```typescript
{
  ok: boolean;
  requestId?: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: { allowed: boolean; reasonCode: string; safeMessage: string; policyFamily: string; status: string };
  nextAllowedActions?: string[];
  data?: unknown;
}
```

## Idempotency

All mutating operations accept `x-idempotency-key` header. If absent, a UUID is auto-generated. Completed idempotency keys return 409 CONFLICT.

## School Context Behavior

All routes require a verified school context. The school ID is extracted from the verified context and used for all scoped queries. Missing school context returns `SCHOOL_CONTEXT_REQUIRED`.

## Role Behavior

| Role | All Entity Operations |
|------|----------------------|
| teacher | ALLOWED |
| lead_teacher | ALLOWED |
| department_head | ALLOWED |
| admin | ALLOWED |
| system_job | ALLOWED |
| student | BLOCKED |
| parent | BLOCKED |
| guest | BLOCKED |
| unknown | BLOCKED |

## Forbidden Content Categories (All Routes)

All content passing through Package 19 routes is validated by `RecoveryOutcomeSafetyService`. The following categories are blocked from any request body or response data:

- Answer keys, rubrics, raw student answers
- Teacher-only notes, hidden reasoning
- Unreleased grades, score mutations, mastery mutations
- Notifications (parent, student, teacher, email, SMS, push, WhatsApp)
- Live assignments, calendar events, external sync
- Provider secrets, portal URLs, access tokens
- AI narratives, generated questions, generated answer keys
- OCR text, PDF binary, HTML export
- Unsafe diagnosis, safeguarding disclosure

## Endpoints

### 1. Decision Readiness

| Method | Path | Action |
|--------|------|--------|
| POST | /decision-readiness | Create decision readiness |
| GET | /decision-readiness | List for school |
| GET | /decision-readiness/:id | Get by ID |
| GET | /students/:studentRef/decision-readiness | List by student |
| GET | /plans/:planId/decision-readiness | List by plan |
| GET | /decision-readiness/status/:status | List by status |
| POST | /decision-readiness/:id/review-ready | Mark review ready |
| POST | /decision-readiness/:id/approve-future-use | Mark approved for future use |
| POST | /decision-readiness/:id/suppress | Suppress |
| POST | /decision-readiness/:id/block | Block |
| POST | /decision-readiness/:id/void | Void |

### 2. Exit Criteria

| Method | Path | Action |
|--------|------|--------|
| POST | /exit-criteria | Create exit criteria |
| GET | /exit-criteria | List for school |
| GET | /exit-criteria/:id | Get by ID |
| GET | /plans/:planId/exit-criteria | List by plan |
| GET | /exit-criteria/status/:status | List by status |
| POST | /exit-criteria/:id/review-ready | Mark review ready |
| POST | /exit-criteria/:id/approve-future-use | Mark approved |
| POST | /exit-criteria/:id/suppress | Suppress |
| POST | /exit-criteria/:id/block | Block |
| POST | /exit-criteria/:id/void | Void |

### 3. Exit Criteria Evaluations

| Method | Path | Action |
|--------|------|--------|
| POST | /exit-criteria-evaluations | Create evaluation |
| GET | /exit-criteria-evaluations | List for school |
| GET | /exit-criteria-evaluations/:id | Get by ID |
| GET | /criteria/:criteriaId/exit-criteria-evaluations | List by criteria |
| GET | /plans/:planId/exit-criteria-evaluations | List by plan |
| GET | /students/:studentRef/exit-criteria-evaluations | List by student |
| GET | /exit-criteria-evaluations/result/:result | List by result |
| POST | /exit-criteria-evaluations/:id/review-ready | Mark review ready |
| POST | /exit-criteria-evaluations/:id/approve-future-use | Mark approved |
| POST | /exit-criteria-evaluations/:id/suppress | Suppress |
| POST | /exit-criteria-evaluations/:id/block | Block |
| POST | /exit-criteria-evaluations/:id/void | Void |

### 4. Continuation Decision Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /continuation-drafts | Create draft |
| GET | /continuation-drafts | List for school |
| GET | /continuation-drafts/:id | Get by ID |
| GET | /plans/:planId/continuation-drafts | List by plan |
| GET | /students/:studentRef/continuation-drafts | List by student |
| GET | /continuation-drafts/status/:status | List by status |
| POST | /continuation-drafts/:id/review-ready | Mark review ready |
| POST | /continuation-drafts/:id/approve-future-use | Mark approved |
| POST | /continuation-drafts/:id/suppress | Suppress |
| POST | /continuation-drafts/:id/block | Block |
| POST | /continuation-drafts/:id/void | Void |

### 5. Intensification Decision Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /intensification-drafts | Create draft |
| GET | /intensification-drafts | List for school |
| GET | /intensification-drafts/:id | Get by ID |
| GET | /plans/:planId/intensification-drafts | List by plan |
| GET | /students/:studentRef/intensification-drafts | List by student |
| GET | /intensification-drafts/status/:status | List by status |
| POST | /intensification-drafts/:id/review-ready | Mark review ready |
| POST | /intensification-drafts/:id/approve-future-use | Mark approved |
| POST | /intensification-drafts/:id/suppress | Suppress |
| POST | /intensification-drafts/:id/block | Block |
| POST | /intensification-drafts/:id/void | Void |

### 6. Pause Decision Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /pause-drafts | Create draft |
| GET | /pause-drafts | List for school |
| GET | /pause-drafts/:id | Get by ID |
| GET | /plans/:planId/pause-drafts | List by plan |
| GET | /students/:studentRef/pause-drafts | List by student |
| GET | /pause-drafts/status/:status | List by status |
| POST | /pause-drafts/:id/review-ready | Mark review ready |
| POST | /pause-drafts/:id/approve-future-use | Mark approved |
| POST | /pause-drafts/:id/suppress | Suppress |
| POST | /pause-drafts/:id/block | Block |
| POST | /pause-drafts/:id/void | Void |

### 7. Closure Decision Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /closure-drafts | Create draft |
| GET | /closure-drafts | List for school |
| GET | /closure-drafts/:id | Get by ID |
| GET | /plans/:planId/closure-drafts | List by plan |
| GET | /students/:studentRef/closure-drafts | List by student |
| GET | /closure-drafts/status/:status | List by status |
| POST | /closure-drafts/:id/review-ready | Mark review ready |
| POST | /closure-drafts/:id/approve-future-use | Mark approved |
| POST | /closure-drafts/:id/suppress | Suppress |
| POST | /closure-drafts/:id/block | Block |
| POST | /closure-drafts/:id/void | Void |

### 8. Teacher Review Packets

| Method | Path | Action |
|--------|------|--------|
| POST | /teacher-review-packets | Create packet |
| GET | /teacher-review-packets | List for school |
| GET | /teacher-review-packets/:id | Get by ID |
| GET | /plans/:planId/teacher-review-packets | List by plan |
| GET | /students/:studentRef/teacher-review-packets | List by student |
| GET | /teachers/:teacherRef/teacher-review-packets | List by teacher |
| POST | /teacher-review-packets/:id/review-ready | Mark review ready |
| POST | /teacher-review-packets/:id/approve-future-use | Mark approved |
| POST | /teacher-review-packets/:id/suppress | Suppress |
| POST | /teacher-review-packets/:id/block | Block |
| POST | /teacher-review-packets/:id/void | Void |

### 9. Student Next Step Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /student-next-step-drafts | Create draft |
| GET | /student-next-step-drafts | List for school |
| GET | /student-next-step-drafts/:id | Get by ID |
| GET | /plans/:planId/student-next-step-drafts | List by plan |
| GET | /students/:studentRef/student-next-step-drafts | List by student |
| GET | /student-next-step-drafts/status/:status | List by status |
| POST | /student-next-step-drafts/:id/review-ready | Mark review ready |
| POST | /student-next-step-drafts/:id/approve-future-use | Mark approved |
| POST | /student-next-step-drafts/:id/suppress | Suppress |
| POST | /student-next-step-drafts/:id/block | Block |
| POST | /student-next-step-drafts/:id/void | Void |

### 10. Parent Update Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /parent-update-drafts | Create draft |
| GET | /parent-update-drafts | List for school |
| GET | /parent-update-drafts/:id | Get by ID |
| GET | /plans/:planId/parent-update-drafts | List by plan |
| GET | /students/:studentRef/parent-update-drafts | List by student |
| GET | /parent-update-drafts/status/:status | List by status |
| POST | /parent-update-drafts/:id/review-ready | Mark review ready |
| POST | /parent-update-drafts/:id/approve-future-use | Mark approved |
| POST | /parent-update-drafts/:id/suppress | Suppress |
| POST | /parent-update-drafts/:id/block | Block |
| POST | /parent-update-drafts/:id/void | Void |

### 11. Outcome Decision Summaries

| Method | Path | Action |
|--------|------|--------|
| POST | /summaries | Create summary |
| GET | /summaries | List for school |
| GET | /summaries/:id | Get by ID |
| GET | /plans/:planId/summaries | List by plan |
| GET | /students/:studentRef/summaries | List by student |
| POST | /summaries/:id/refresh | Refresh summary |
| POST | /summaries/:id/mark-stale | Mark stale |
| POST | /summaries/:id/block | Block |
| POST | /summaries/:id/void | Void |

## Forbidden Route Categories

The following route patterns are intentionally absent:

- `/decision-readiness/:id/score` — no score mutation
- `/decision-readiness/:id/mastery` — no mastery mutation
- `/decision-readiness/:id/notify` — no live notifications
- `/decision-readiness/:id/assign` — no live assignment
- `/decision-readiness/:id/generate` — no AI generation
- `/decision-readiness/:id/export-pdf` — no PDF export
- `/exit-criteria/:id/execute` — no live execution
- `/teacher-review-packets/:id/approve-live` — no live approval
- `/closure-drafts/:id/graduate` — no live graduation
- `/parent-update-drafts/:id/send` — no live sending

## Error Codes

| ReasonCode | HTTP Status | Meaning |
|-----------|-------------|---------|
| SCHOOL_CONTEXT_REQUIRED | 400 | Missing school context |
| NOT_FOUND | 400 | Resource not found |
| POLICY_BLOCKED | 400 | Role not authorized |
| IDEMPOTENCY_CONFLICT | 400 | Duplicate idempotency key |
| INVALID_STATUS | 400 | Invalid status transition (e.g. void -> suppress) |
| *any LEAKAGE code* | 400 | Safety check failed |
| DRAFT_ONLY_OPERATION | 400 | Live operation attempted on draft-only entity |
