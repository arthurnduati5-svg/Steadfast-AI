# Package 21: Route Contract — Recovery Outcome Execution Simulation

## Mount

```
Path: /api/question-bank/recovery-outcome-execution-simulation
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```

## Safe Response Envelope

All routes return responses in the following safe envelope:

```typescript
{
  success: boolean;
  data?: T;
  status: string;
  message?: string;
  metadata?: Record<string, unknown>;
  blockedReasonCodes?: string[];
  idempotencyKey?: string;
}
```

## Idempotency

All mutating operations accept `x-idempotency-key` header. If absent, a UUID is auto-generated. Completed idempotency keys return `DUPLICATE` status. The envelope includes the `idempotencyKey` field in every mutating response.

## School Context Behavior

All routes require a verified school context. The school ID is extracted from the verified context and used for all scoped queries. Missing school context returns an error with status `error`.

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

All content passing through Package 21 routes is validated by `RecoveryOutcomeExecutionSimulationSafetyService`. The following categories are blocked from any request body or response data:

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

### 1. Simulation Readiness

| Method | Path | Action |
|--------|------|--------|
| POST | /simulation-readiness | Create simulation readiness |
| GET | /simulation-readiness | List for school (query: studentRef, planId, status) |
| GET | /simulation-readiness/:id | Get by ID |
| POST | /simulation-readiness/:id/review-ready | Mark review ready |
| POST | /simulation-readiness/:id/approve-future-use | Mark approved for future use |
| POST | /simulation-readiness/:id/suppress | Suppress |
| POST | /simulation-readiness/:id/block | Block |
| POST | /simulation-readiness/:id/void | Void |

### 2. Simulation Plans

| Method | Path | Action |
|--------|------|--------|
| POST | /simulation-plans | Create simulation plan |
| GET | /simulation-plans | List for school (query: studentRef, planId, status) |
| GET | /simulation-plans/:id | Get by ID |
| POST | /simulation-plans/:id/simulation-ready | Mark simulation ready |
| POST | /simulation-plans/:id/review-ready | Mark review ready |
| POST | /simulation-plans/:id/approve-future-use | Mark approved for future use |
| POST | /simulation-plans/:id/suppress | Suppress |
| POST | /simulation-plans/:id/block | Block |
| POST | /simulation-plans/:id/void | Void |

### 3. Simulation Runs

| Method | Path | Action |
|--------|------|--------|
| POST | /simulation-runs | Create simulation run |
| GET | /simulation-runs | List for school (query: studentRef, planId, simulationPlanId, status) |
| GET | /simulation-runs/:id | Get by ID |
| POST | /simulation-runs/:id/simulating | Mark simulating |
| POST | /simulation-runs/:id/simulated | Mark simulated |
| POST | /simulation-runs/:id/review-ready | Mark review ready |
| POST | /simulation-runs/:id/suppress | Suppress |
| POST | /simulation-runs/:id/block | Block |
| POST | /simulation-runs/:id/void | Void |

### 4. Simulation Steps

| Method | Path | Action |
|--------|------|--------|
| POST | /simulation-steps | Create simulation step |
| GET | /simulation-steps | List for simulation run or status (query: simulationRunId, status) |
| GET | /simulation-steps/:id | Get by ID |
| POST | /simulation-steps/:id/simulated | Mark step simulated |
| POST | /simulation-steps/:id/blocked | Mark step blocked |
| POST | /simulation-steps/:id/void | Void step |

### 5. Eligibility Checks

| Method | Path | Action |
|--------|------|--------|
| POST | /eligibility-checks | Create eligibility check |
| GET | /eligibility-checks | List for plan or bundle (query: planId, actionBundleId, result) |
| GET | /eligibility-checks/:id | Get by ID |
| POST | /eligibility-checks/:id/review-ready | Mark review ready |
| POST | /eligibility-checks/:id/void | Void |

### 6. Blocked Action Diagnostics

| Method | Path | Action |
|--------|------|--------|
| POST | /blocked-action-diagnostics | Create blocked action diagnostic |
| GET | /blocked-action-diagnostics | List for run, plan, or reason (query: simulationRunId, planId, reason) |
| GET | /blocked-action-diagnostics/:id | Get by ID |
| POST | /blocked-action-diagnostics/:id/review-ready | Mark review ready |
| POST | /blocked-action-diagnostics/:id/suppress | Suppress |
| POST | /blocked-action-diagnostics/:id/void | Void |

### 7. Failure Injections

| Method | Path | Action |
|--------|------|--------|
| POST | /failure-injections | Create failure injection scenario |
| GET | /failure-injections | List for plan or type (query: planId, injectionType) |
| GET | /failure-injections/:id | Get by ID |
| POST | /failure-injections/:id/review-ready | Mark review ready |
| POST | /failure-injections/:id/approve-future-use | Mark approved for future use |
| POST | /failure-injections/:id/suppress | Suppress |
| POST | /failure-injections/:id/block | Block |
| POST | /failure-injections/:id/void | Void |

### 8. Simulation Results

| Method | Path | Action |
|--------|------|--------|
| POST | /simulation-results | Create simulation result |
| GET | /simulation-results | List for run, plan, or outcome (query: simulationRunId, planId, outcome) |
| GET | /simulation-results/:id | Get by ID |
| POST | /simulation-results/:id/review-ready | Mark review ready |
| POST | /simulation-results/:id/void | Void |

### 9. Teacher Simulation Reviews

| Method | Path | Action |
|--------|------|--------|
| POST | /teacher-simulation-reviews | Create teacher simulation review |
| GET | /teacher-simulation-reviews | List for plan, run, or teacher (query: planId, simulationRunId, teacherRef) |
| GET | /teacher-simulation-reviews/:id | Get by ID |
| POST | /teacher-simulation-reviews/:id/review-ready | Mark review ready |
| POST | /teacher-simulation-reviews/:id/approve-future-use | Mark approved for future use |
| POST | /teacher-simulation-reviews/:id/suppress | Suppress |
| POST | /teacher-simulation-reviews/:id/block | Block |
| POST | /teacher-simulation-reviews/:id/void | Void |

### 10. Student Preview Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /student-preview-drafts | Create student preview draft |
| GET | /student-preview-drafts | List for plan or status (query: planId, status) |
| GET | /student-preview-drafts/:id | Get by ID |
| POST | /student-preview-drafts/:id/review-ready | Mark review ready |
| POST | /student-preview-drafts/:id/approve-future-use | Mark approved for future use |
| POST | /student-preview-drafts/:id/suppress | Suppress |
| POST | /student-preview-drafts/:id/block | Block |
| POST | /student-preview-drafts/:id/void | Void |

### 11. Parent Preview Drafts

| Method | Path | Action |
|--------|------|--------|
| POST | /parent-preview-drafts | Create parent preview draft |
| GET | /parent-preview-drafts | List for plan or status (query: planId, status) |
| GET | /parent-preview-drafts/:id | Get by ID |
| POST | /parent-preview-drafts/:id/review-ready | Mark review ready |
| POST | /parent-preview-drafts/:id/approve-future-use | Mark approved for future use |
| POST | /parent-preview-drafts/:id/suppress | Suppress |
| POST | /parent-preview-drafts/:id/block | Block |
| POST | /parent-preview-drafts/:id/void | Void |

### 12. Readiness Verdicts

| Method | Path | Action |
|--------|------|--------|
| POST | /readiness-verdicts | Create readiness verdict |
| GET | /readiness-verdicts | List for plan, run, or status (query: planId, simulationRunId, status) |
| GET | /readiness-verdicts/:id | Get by ID |
| POST | /readiness-verdicts/:id/review-ready | Mark review ready |
| POST | /readiness-verdicts/:id/approve-future-use | Mark approved for future use |
| POST | /readiness-verdicts/:id/suppress | Suppress |
| POST | /readiness-verdicts/:id/block | Block |
| POST | /readiness-verdicts/:id/void | Void |

### 13. Summaries

| Method | Path | Action |
|--------|------|--------|
| POST | /summaries | Create simulation summary |
| GET | /summaries | List for school (query: studentRef, planId) |
| GET | /summaries/:id | Get by ID |
| POST | /summaries/:id/refresh | Refresh summary |
| POST | /summaries/:id/stale | Mark stale |
| POST | /summaries/:id/block | Block |
| POST | /summaries/:id/void | Void |

## Forbidden Route Categories

The following route patterns are intentionally absent:

- `/simulation-readiness/:id/score` — no score mutation
- `/simulation-readiness/:id/mastery` — no mastery mutation
- `/simulation-readiness/:id/notify` — no live notifications
- `/simulation-readiness/:id/assign` — no live assignment
- `/simulation-readiness/:id/generate` — no AI generation
- `/simulation-readiness/:id/export-pdf` — no PDF export
- `/simulation-readiness/:id/activate-live` — no live activation
- `/simulation-plans/:id/execute` — no live execution
- `/simulation-plans/:id/assign` — no live assignment
- `/simulation-runs/:id/activate` — no live activation from run
- `/simulation-runs/:id/complete` — no live completion
- `/eligibility-checks/:id/execute-check` — no live precondition check
- `/failure-injections/:id/execute-failure` — no live failure execution
- `/simulation-results/:id/convert-live` — no result-to-live conversion
- `/student-preview-drafts/:id/publish` — no live portal publish
- `/parent-preview-drafts/:id/publish` — no live portal publish
- `/readiness-verdicts/:id/execute-rollback` — no live rollback
- `/summaries/:id/export` — no PDF/HTML export

## Error Codes

| ReasonCode | HTTP Status | Meaning |
|-----------|-------------|---------|
| SCHOOL_CONTEXT_REQUIRED | 400 | Missing school context |
| NOT_FOUND | 404 | Resource not found |
| POLICY_BLOCKED | 400 | Role not authorized |
| IDEMPOTENCY_CONFLICT | 409 | Duplicate idempotency key |
| INVALID_STATUS | 400 | Invalid status transition |
| *any LEAKAGE code* | 400 | Safety check failed |
| DUPLICATE | 409 | Idempotency key already processed |
| DRAFT_ONLY_OPERATION | 400 | Live operation attempted on simulation-only entity |
