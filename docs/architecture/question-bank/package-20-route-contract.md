# Package 20: Route Contract — Controlled Recovery Outcome Action Preparation

## Mount

```
Path: /api/question-bank/recovery-outcome-action
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

All content passing through Package 20 routes is validated by `RecoveryOutcomeActionSafetyService`. The following categories are blocked from any request body or response data:

- Answer keys, rubrics, raw student answers
- Teacher-only notes, hidden reasoning
- Unreleased grades, score mutations, mastery mutations
- Live recovery activation, live recovery completion, live recovery closure payloads
- Notifications (parent, student, teacher, email, SMS, push, WhatsApp)
- Live assignments, calendar events, external sync
- Provider secrets, portal URLs, access tokens, signed URLs
- AI narratives, AI-generated questions, AI-generated answer keys
- OCR text, PDF binary, HTML export
- Unsafe diagnosis, safeguarding disclosure

## Endpoints

### 1. Action Readiness

| Method | Path | Action |
|--------|------|--------|
| POST | /action-readiness | Create action readiness |
| GET | /action-readiness | List for school (query: studentRef, planId, status) |
| GET | /action-readiness/:id | Get by ID |
| POST | /action-readiness/:id/review-ready | Mark review ready |
| POST | /action-readiness/:id/approve-future-use | Mark approved for future use |
| POST | /action-readiness/:id/suppress | Suppress |
| POST | /action-readiness/:id/block | Block |
| POST | /action-readiness/:id/void | Void |

### 2. Action Bundles

| Method | Path | Action |
|--------|------|--------|
| POST | /action-bundles | Create action bundle |
| GET | /action-bundles | List for school (query: studentRef, planId, status) |
| GET | /action-bundles/:id | Get by ID |
| POST | /action-bundles/:id/review-ready | Mark review ready |
| POST | /action-bundles/:id/approve-future-use | Mark approved for future use |
| POST | /action-bundles/:id/suppress | Suppress |
| POST | /action-bundles/:id/block | Block |
| POST | /action-bundles/:id/void | Void |

### 3. Continuation Action Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /continuation-action-drafts | Create continuation action draft |
| GET | /continuation-action-drafts | List for school (query: planId, studentRef, status) |
| GET | /continuation-action-drafts/:id | Get by ID |
| POST | /continuation-action-drafts/:id/review-ready | Mark review ready |
| POST | /continuation-action-drafts/:id/approve-future-use | Mark approved for future use |
| POST | /continuation-action-drafts/:id/suppress | Suppress |
| POST | /continuation-action-drafts/:id/block | Block |
| POST | /continuation-action-drafts/:id/void | Void |

### 4. Intensification Action Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /intensification-action-drafts | Create intensification action draft |
| GET | /intensification-action-drafts | List for school (query: planId, studentRef, status) |
| GET | /intensification-action-drafts/:id | Get by ID |
| POST | /intensification-action-drafts/:id/review-ready | Mark review ready |
| POST | /intensification-action-drafts/:id/approve-future-use | Mark approved for future use |
| POST | /intensification-action-drafts/:id/suppress | Suppress |
| POST | /intensification-action-drafts/:id/block | Block |
| POST | /intensification-action-drafts/:id/void | Void |

### 5. Pause Action Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /pause-action-drafts | Create pause action draft |
| GET | /pause-action-drafts | List for school (query: planId, studentRef, status) |
| GET | /pause-action-drafts/:id | Get by ID |
| POST | /pause-action-drafts/:id/review-ready | Mark review ready |
| POST | /pause-action-drafts/:id/approve-future-use | Mark approved for future use |
| POST | /pause-action-drafts/:id/suppress | Suppress |
| POST | /pause-action-drafts/:id/block | Block |
| POST | /pause-action-drafts/:id/void | Void |

### 6. Closure Action Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /closure-action-drafts | Create closure action draft |
| GET | /closure-action-drafts | List for school (query: planId, studentRef, status) |
| GET | /closure-action-drafts/:id | Get by ID |
| POST | /closure-action-drafts/:id/review-ready | Mark review ready |
| POST | /closure-action-drafts/:id/approve-future-use | Mark approved for future use |
| POST | /closure-action-drafts/:id/suppress | Suppress |
| POST | /closure-action-drafts/:id/block | Block |
| POST | /closure-action-drafts/:id/void | Void |

### 7. Approval Gates

| Method | Path | Action |
|--------|------|--------|
| POST | /approval-gates | Create approval gate |
| GET | /approval-gates | List for school (query: planId, studentRef, status) |
| GET | /approval-gates/:id | Get by ID |
| POST | /approval-gates/:id/satisfied | Mark satisfied |
| POST | /approval-gates/:id/blocked | Mark blocked |
| POST | /approval-gates/:id/void | Void |

### 8. Mock Activation Queue

| Method | Path | Action |
|--------|------|--------|
| POST | /mock-activation-queue | Create mock queue item |
| GET | /mock-activation-queue | List for school (query: planId, status) |
| GET | /mock-activation-queue/:id | Get by ID |
| POST | /mock-activation-queue/:id/dry-run-ready | Mark dry-run ready |
| POST | /mock-activation-queue/:id/suppress | Suppress |
| POST | /mock-activation-queue/:id/block | Block |
| POST | /mock-activation-queue/:id/void | Void |

### 9. Dry-Run Receipts

| Method | Path | Action |
|--------|------|--------|
| POST | /dry-run-receipts | Create dry-run receipt |
| GET | /dry-run-receipts | List (query: queueItemId, planId, result — at least one required) |
| GET | /dry-run-receipts/:id | Get by ID |
| POST | /dry-run-receipts/:id/void | Void |

### 10. Rollback Plans

| Method | Path | Action |
|--------|------|--------|
| POST | /rollback-plans | Create rollback plan |
| GET | /rollback-plans | List for school (query: planId, status) |
| GET | /rollback-plans/:id | Get by ID |
| POST | /rollback-plans/:id/review-ready | Mark review ready |
| POST | /rollback-plans/:id/approve-future-use | Mark approved for future use |
| POST | /rollback-plans/:id/suppress | Suppress |
| POST | /rollback-plans/:id/block | Block |
| POST | /rollback-plans/:id/void | Void |

### 11. Suppression Rules

| Method | Path | Action |
|--------|------|--------|
| POST | /suppression-rules | Create suppression rule |
| GET | /suppression-rules | List for school (query: planId, status) |
| GET | /suppression-rules/:id | Get by ID |
| POST | /suppression-rules/:id/activate | Activate for future use |
| POST | /suppression-rules/:id/suppress | Suppress |
| POST | /suppression-rules/:id/block | Block |
| POST | /suppression-rules/:id/void | Void |

### 12. Action Summaries

| Method | Path | Action |
|--------|------|--------|
| POST | /summaries | Create action summary |
| GET | /summaries | List for school (query: studentRef, planId) |
| GET | /summaries/:id | Get by ID |
| POST | /summaries/:id/refresh | Refresh summary |
| POST | /summaries/:id/stale | Mark stale |
| POST | /summaries/:id/block | Block |
| POST | /summaries/:id/void | Void |

## Forbidden Route Categories

The following route patterns are intentionally absent:

- `/action-readiness/:id/score` — no score mutation
- `/action-readiness/:id/mastery` — no mastery mutation
- `/action-readiness/:id/notify` — no live notifications
- `/action-readiness/:id/assign` — no live assignment
- `/action-readiness/:id/generate` — no AI generation
- `/action-readiness/:id/export-pdf` — no PDF export
- `/action-readiness/:id/activate-live` — no live activation
- `/action-bundles/:id/execute` — no live execution
- `/action-bundles/:id/assign` — no live assignment
- `/approval-gates/:id/execute-check` — no live precondition check
- `/mock-activation-queue/:id/activate` — no live activation
- `/dry-run-receipts/:id/convert-live` — no receipt-to-live conversion
- `/rollback-plans/:id/execute-rollback` — no live rollback
- `/suppression-rules/:id/apply` — no live suppression enforcement
- `/closure-action-drafts/:id/graduate` — no live graduation
- `/continuation-action-drafts/:id/start` — no live start

## Error Codes

| ReasonCode | HTTP Status | Meaning |
|-----------|-------------|---------|
| SCHOOL_CONTEXT_REQUIRED | 400 | Missing school context |
| NOT_FOUND | 404 | Resource not found |
| POLICY_BLOCKED | 400 | Role not authorized |
| IDEMPOTENCY_CONFLICT | 409 | Duplicate idempotency key |
| INVALID_STATUS | 400 | Invalid status transition (e.g. void -> suppress) |
| *any LEAKAGE code* | 400 | Safety check failed |
| DRAFT_ONLY_OPERATION | 400 | Live operation attempted on draft-only entity |
