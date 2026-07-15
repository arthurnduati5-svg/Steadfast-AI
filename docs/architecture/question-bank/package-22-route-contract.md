# Package 22: Route Contract — Recovery Lifecycle Closure Readiness

## Mount

```
Path: /api/question-bank/recovery-lifecycle-closure
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

All content passing through Package 22 routes is validated by `RecoveryLifecycleClosureSafetyService`. The following categories are blocked from any request body or response data:

- Answer keys, rubrics, raw student answers
- Teacher-only notes, hidden reasoning
- Unreleased grades, score mutations, mastery mutations
- Live recovery closure, live lifecycle closure, live recovery execution, live recovery activation payloads
- Notifications (parent, student, teacher, email, SMS, push, WhatsApp)
- Live assignments, calendar events, external sync
- Provider secrets, portal URLs, access tokens, signed URLs
- AI narratives, AI-generated questions, AI-generated answer keys
- OCR text, PDF binary, HTML export
- Unsafe diagnosis, safeguarding disclosure

## Endpoints

### 1. Closure Readiness

| Method | Path | Action |
|--------|------|--------|
| POST | /closure-readiness | Create closure readiness record |
| GET | /closure-readiness | List for school (query: studentRef, simulationRunId, status) |
| GET | /closure-readiness/:id | Get by ID |
| POST | /closure-readiness/:id/review-ready | Mark review ready |
| POST | /closure-readiness/:id/handoff-ready | Mark handoff ready |
| POST | /closure-readiness/:id/approve-future-use | Mark approved for future use |
| POST | /closure-readiness/:id/suppress | Suppress |
| POST | /closure-readiness/:id/block | Block |
| POST | /closure-readiness/:id/void | Void |

### 2. Post-Simulation Handoff Packets

| Method | Path | Action |
|--------|------|--------|
| POST | /post-simulation-handoff-packets | Create handoff packet |
| GET | /post-simulation-handoff-packets | List for school (query: closureReadinessId, simulationRunId, status) |
| GET | /post-simulation-handoff-packets/:id | Get by ID |
| POST | /post-simulation-handoff-packets/:id/review-ready | Mark review ready |
| POST | /post-simulation-handoff-packets/:id/handoff-ready | Mark handoff ready |
| POST | /post-simulation-handoff-packets/:id/approve-future-use | Mark approved for future use |
| POST | /post-simulation-handoff-packets/:id/suppress | Suppress |
| POST | /post-simulation-handoff-packets/:id/block | Block |
| POST | /post-simulation-handoff-packets/:id/void | Void |

### 3. Next-Cycle Recommendations

| Method | Path | Action |
|--------|------|--------|
| POST | /next-cycle-recommendations | Create next-cycle recommendation draft |
| GET | /next-cycle-recommendations | List for school (query: handoffPacketId, simulationRunId, status) |
| GET | /next-cycle-recommendations/:id | Get by ID |
| POST | /next-cycle-recommendations/:id/review-ready | Mark review ready |
| POST | /next-cycle-recommendations/:id/approve-future-use | Mark approved for future use |
| POST | /next-cycle-recommendations/:id/suppress | Suppress |
| POST | /next-cycle-recommendations/:id/block | Block |
| POST | /next-cycle-recommendations/:id/void | Void |

### 4. Deferred Integration Tickets

| Method | Path | Action |
|--------|------|--------|
| POST | /deferred-integration-tickets | Create deferred integration ticket |
| GET | /deferred-integration-tickets | List for school (query: handoffPacketId, simulationRunId, status) |
| GET | /deferred-integration-tickets/:id | Get by ID |
| POST | /deferred-integration-tickets/:id/review-ready | Mark review ready |
| POST | /deferred-integration-tickets/:id/approve-future-use | Mark approved for future use |
| POST | /deferred-integration-tickets/:id/suppress | Suppress |
| POST | /deferred-integration-tickets/:id/block | Block |
| POST | /deferred-integration-tickets/:id/void | Void |

### 5. Unresolved Risk Register

| Method | Path | Action |
|--------|------|--------|
| POST | /unresolved-risk-register | Create unresolved risk register record |
| GET | /unresolved-risk-register | List for school (query: handoffPacketId, simulationRunId, status) |
| GET | /unresolved-risk-register/:id | Get by ID |
| POST | /unresolved-risk-register/:id/review-ready | Mark review ready |
| POST | /unresolved-risk-register/:id/approve-future-use | Mark approved for future use |
| POST | /unresolved-risk-register/:id/suppress | Suppress |
| POST | /unresolved-risk-register/:id/block | Block |
| POST | /unresolved-risk-register/:id/void | Void |

### 6. Student Closure Reflections

| Method | Path | Action |
|--------|------|--------|
| POST | /student-closure-reflections | Create student closure reflection draft |
| GET | /student-closure-reflections | List for school (query: simulationRunId, status) |
| GET | /student-closure-reflections/:id | Get by ID |
| POST | /student-closure-reflections/:id/review-ready | Mark review ready |
| POST | /student-closure-reflections/:id/suppress | Suppress |
| POST | /student-closure-reflections/:id/void | Void |

### 7. Parent Closure Guidance

| Method | Path | Action |
|--------|------|--------|
| POST | /parent-closure-guidance | Create parent closure guidance draft |
| GET | /parent-closure-guidance | List for school (query: simulationRunId, status) |
| GET | /parent-closure-guidance/:id | Get by ID |
| POST | /parent-closure-guidance/:id/review-ready | Mark review ready |
| POST | /parent-closure-guidance/:id/suppress | Suppress |
| POST | /parent-closure-guidance/:id/void | Void |

### 8. Teacher Closure Reviews

| Method | Path | Action |
|--------|------|--------|
| POST | /teacher-closure-reviews | Create teacher closure review packet |
| GET | /teacher-closure-reviews | List for school (query: simulationRunId, readinessVerdictId, teacherRef, status) |
| GET | /teacher-closure-reviews/:id | Get by ID |
| POST | /teacher-closure-reviews/:id/review-ready | Mark review ready |
| POST | /teacher-closure-reviews/:id/approve-future-use | Mark approved for future use |
| POST | /teacher-closure-reviews/:id/suppress | Suppress |
| POST | /teacher-closure-reviews/:id/block | Block |
| POST | /teacher-closure-reviews/:id/void | Void |

### 9. Admin Governance Reviews

| Method | Path | Action |
|--------|------|--------|
| POST | /admin-governance-reviews | Create admin governance review packet |
| GET | /admin-governance-reviews | List for school (query: simulationRunId, status) |
| GET | /admin-governance-reviews/:id | Get by ID |
| POST | /admin-governance-reviews/:id/review-ready | Mark review ready |
| POST | /admin-governance-reviews/:id/approve-future-use | Mark approved for future use |
| POST | /admin-governance-reviews/:id/suppress | Suppress |
| POST | /admin-governance-reviews/:id/block | Block |
| POST | /admin-governance-reviews/:id/void | Void |

### 10. Archive Manifests

| Method | Path | Action |
|--------|------|--------|
| POST | /archive-manifests | Create archive manifest |
| GET | /archive-manifests | List for school (query: simulationRunId, status) |
| GET | /archive-manifests/:id | Get by ID |
| POST | /archive-manifests/:id/review-ready | Mark review ready |
| POST | /archive-manifests/:id/approve-future-use | Mark approved for future use |
| POST | /archive-manifests/:id/suppress | Suppress |
| POST | /archive-manifests/:id/block | Block |
| POST | /archive-manifests/:id/void | Void |

### 11. Final Lifecycle Summaries

| Method | Path | Action |
|--------|------|--------|
| POST | /final-lifecycle-summaries | Create final lifecycle summary |
| GET | /final-lifecycle-summaries | List for school (query: simulationSummaryId, status) |
| GET | /final-lifecycle-summaries/:id | Get by ID |
| POST | /final-lifecycle-summaries/:id/refresh | Refresh summary |
| POST | /final-lifecycle-summaries/:id/stale | Mark stale |
| POST | /final-lifecycle-summaries/:id/block | Block |
| POST | /final-lifecycle-summaries/:id/void | Void |

## Forbidden Route Categories

The following route patterns are intentionally absent:

- `/closure-readiness/:id/close` — no live closure
- `/closure-readiness/:id/execute` — no live execution
- `/closure-readiness/:id/score` — no score mutation
- `/closure-readiness/:id/mastery` — no mastery mutation
- `/closure-readiness/:id/notify` — no live notifications
- `/closure-readiness/:id/assign` — no live assignment
- `/closure-readiness/:id/generate` — no AI generation
- `/closure-readiness/:id/export-pdf` — no PDF export
- `/closure-readiness/:id/activate-live` — no live activation
- `/post-simulation-handoff-packets/:id/live-close` — no live closure from handoff
- `/post-simulation-handoff-packets/:id/execute-handoff` — no live handoff execution
- `/next-cycle-recommendations/:id/assign` — no live assignment from recommendation
- `/next-cycle-recommendations/:id/execute` — no live execution from recommendation
- `/deferred-integration-tickets/:id/sync-external` — no external sync
- `/unresolved-risk-register/:id/trigger-alert` — no live alert
- `/student-closure-reflections/:id/send` — no live delivery to student
- `/parent-closure-guidance/:id/send` — no live delivery to parent
- `/teacher-closure-reviews/:id/close-recovery` — no live recovery closure from review
- `/admin-governance-reviews/:id/approve-live` — no live execution approval
- `/archive-manifests/:id/export-pdf` — no PDF/HTML export
- `/archive-manifests/:id/export-html` — no HTML export
- `/final-lifecycle-summaries/:id/close-lifecycle` — no live lifecycle closure

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
| DRAFT_ONLY_OPERATION | 400 | Live operation attempted on closure-readiness-only entity |
