# Package 25 Route Contract

## Base Path

```
/api/question-bank/recovery-case-triage
```

## Auth Middleware

- `schoolAuthMiddleware`
- `requireVerifiedSchoolContext`

All routes require a valid school context. Requests without a verified school context are rejected with 401 Unauthorized.

## Idempotency Key Requirement

All POST operations require the `x-idempotency-key` header. Requests without this header are rejected with 400 Bad Request. Duplicate keys within the same school and same 24-hour window return the existing result without executing the operation again.

## Route Groups

### 1. /triage-runs

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | / | admin, teacher | Generate a new triage run |
| GET | / | admin, teacher | List triage runs by school |
| GET | /by-status/:status | admin, teacher | List triage runs by status |
| GET | /latest | admin, teacher | Get the most recent triage run |
| GET | /:id | admin, teacher | Get triage run by ID |
| POST | /:id/refresh | admin | Refresh (regenerate) a triage run |
| POST | /:id/suppress | admin | Suppress a triage run |
| POST | /:id/void | admin | Void a triage run |

### 2. /triage-entries

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | / | admin, teacher | List triage entries by run |
| GET | /by-student/:studentRef | admin, teacher | List entries by student |
| GET | /by-plan/:planId | admin, teacher | List entries by plan |
| GET | /by-priority-band/:band | admin, teacher | List entries by P1-P5 band |
| GET | /by-score-range/:min/:max | admin, teacher | List entries by score range |
| GET | /by-blocked | admin, teacher | List hard-blocked entries |
| GET | /by-suppressed-duplicate | admin, teacher | List suppressed duplicate entries |
| GET | /:id | admin, teacher | Get triage entry by ID |
| GET | /:id/explanation | admin, teacher | Get human-readable score explanation |

### 3. /allocation-drafts

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | / | admin | Create allocation draft |
| GET | / | admin, teacher | List allocation drafts by run |
| GET | /by-actor/:actorId | admin, teacher | List drafts by actor |
| GET | /by-role/:role | admin, teacher | List drafts by role |
| GET | /by-capacity-status/:status | admin, teacher | List by capacity status (normal, exceeded) |
| GET | /:id | admin, teacher | Get allocation draft by ID |
| POST | /:id/suppress | admin | Suppress allocation draft |
| POST | /:id/void | admin | Void allocation draft |

### 4. /escalation-drafts

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | / | admin | Create escalation draft |
| GET | / | admin | List escalation drafts by run |
| GET | /by-level/:escalationLevel | admin | List drafts by escalation level |
| GET | /:id | admin | Get escalation draft by ID |
| POST | /:id/suppress | admin | Suppress escalation draft |
| POST | /:id/void | admin | Void escalation draft |

### 5. /review-window-drafts

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | / | admin | Create review window draft |
| GET | / | admin, teacher | List review window drafts by run |
| GET | /by-actor/:actorId | admin, teacher | List drafts by actor |
| GET | /:id | admin, teacher | Get review window draft by ID |
| POST | /:id/suppress | admin | Suppress review window draft |
| POST | /:id/void | admin | Void review window draft |

### 6. /duplicate-suppression-log

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | / | admin | List duplicate suppression log by run |
| GET | /by-student/:studentRef | admin | List by student |
| GET | /:id | admin | Get suppression log entry by ID |

### 7. /capacity-snapshots

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | / | admin | Create capacity snapshot |
| GET | / | admin, teacher | List capacity snapshots by run |
| GET | /latest | admin, teacher | Get latest capacity snapshot |
| GET | /:id | admin, teacher | Get capacity snapshot by ID |

### 8. /fairness-checks

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | / | admin | List fairness checks by run |
| GET | /by-status/:status | admin | List by status |
| GET | /:id | admin | Get fairness check by ID |

### 9. /priority-factor-config

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | / | admin | Create priority factor config |
| GET | / | admin | List configs by school |
| GET | /active | admin | Get active config |
| GET | /:id | admin | Get config by ID |
| POST | /:id/activate | admin | Activate config |
| POST | /:id/suppress | admin | Suppress config |
| POST | /:id/void | admin | Void config |

### 10. /hard-block-log

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | / | admin | List hard-block log by run |
| GET | /by-block-condition/:condition | admin | List by H1-H8 condition code |
| GET | /:id | admin | Get hard-block log entry by ID |

### 11. /tie-break-log

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | / | admin | List tie-break log by run |
| GET | /by-level/:level | admin | List by tie-break level (1-4) |
| GET | /:id | admin | Get tie-break log entry by ID |

### 12. /score-explanations

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | / | admin, teacher | List score explanations by run |
| GET | /by-entry/:entryId | admin, teacher | Get explanation by triage entry |
| GET | /:id | admin, teacher | Get score explanation by ID |

## Role Rules Summary

| Role | Triage Runs | Entries | Allocation Drafts | Escalation Drafts | Review Window Drafts | Suppression Log | Capacity Snapshots | Fairness Checks | Factor Config | Hard-Block Log | Tie-Break Log | Score Explanations |
|------|-------------|---------|-------------------|-------------------|----------------------|-----------------|-------------------|-----------------|---------------|----------------|----------------|-------------------|
| admin | CRUD | READ | CRUD | CRUD | CRUD | READ | CRUD | READ | CRUD | READ | READ | READ |
| teacher | READ (limited) | READ | READ | NONE | READ | NONE | READ | NONE | NONE | NONE | NONE | READ |

- `admin` = school administrator role
- `teacher` = school teacher role
- Teachers cannot create, modify, suppress, or void any records
- Teachers cannot access escalation drafts, suppression logs, fairness checks, factor configs, hard-block logs, or tie-break logs
- All role restrictions are enforced server-side via middleware

## Safe Response Envelope

```json
{
  "success": true,
  "status": "created",
  "data": { },
  "correlationId": "uuid"
}
```

- `success`: boolean — true for successful operations
- `status`: string — operation result (created, updated, found, suppressed, voided, noop)
- `data`: object — response payload
- `correlationId`: string — UUID for request tracing

## Forbidden Routes

The following routes are explicitly forbidden and must never be implemented in Package 25:

- `POST /api/question-bank/recovery-case-triage/triage-entries/assign` — no live assignment
- `POST /api/question-bank/recovery-case-triage/allocation-drafts/commit` — no commit to live
- `POST /api/question-bank/recovery-case-triage/escalation-drafts/dispatch` — no dispatch
- `POST /api/question-bank/recovery-case-triage/review-window-drafts/schedule` — no calendar schedule
- `POST /api/question-bank/recovery-case-triage/capacity-snapshots/enforce` — no capacity enforcement
- `POST /api/question-bank/recovery-case-triage/notify` — no notification dispatch
- `POST /api/question-bank/recovery-case-triage/export` — no data export
- Any route path containing `/live`, `/execute`, `/dispatch`, `/assign`, `/commit`, `/schedule`, `/notify`, `/publish`, `/sync`

## Forbidden Actions

Package 25 routes must never perform:

- AI calls (no LLMs, no ML inference, no generative models)
- Notification dispatch (no email, no SMS, no push)
- Score or mastery mutation
- Portal publishing (student, parent, teacher dashboards)
- Live recovery execution
- Live recovery authorization
- Live recovery closure
- External system sync
- PDF or HTML generation
- Calendar event creation
- Teacher or admin assignment (binding commitment)
- Capacity enforcement (hard limits)
- Student or parent data export
- Cross-school data aggregation
