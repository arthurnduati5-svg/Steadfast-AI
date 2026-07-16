# Package 26 — Route Contract

## Base Path

```
/api/question-bank/recovery-case-adjudication
```

## Middleware

All routes are mounted with:

```typescript
app.use(
  '/api/question-bank/recovery-case-adjudication',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  recoveryCaseAdjudicationRoutes
);
```

## Response Envelope Format

All responses use the following safe envelope:

```typescript
interface RecoveryCaseAdjudicationSafeEnvelope<T = unknown> {
  success: boolean;    // true for success, false for error
  status: string;      // human-readable status string
  data?: T;            // payload (present on success)
  message?: string;    // optional message
  correlationId?: string;  // correlation ID from request
  errorCode?: string;  // error code (present on error)
}
```

## Route Groups

### Group 1: Adjudication Readiness (12 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/adjudication-readiness` | Yes | teacher, lead_teacher, department_head, admin |
| GET | `/adjudication-readiness` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/adjudication-readiness/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/adjudication-readiness/by-student/:studentRef` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/adjudication-readiness/by-plan/:planId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/adjudication-readiness/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/adjudication-readiness/by-status/:status` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/adjudication-readiness/:id/ready` | Yes | teacher, lead_teacher, department_head, admin |
| POST | `/adjudication-readiness/:id/review-ready` | Yes | teacher, lead_teacher, department_head, admin |
| POST | `/adjudication-readiness/:id/stale` | Yes | system_job |
| POST | `/adjudication-readiness/:id/block` | Yes | department_head, admin |
| POST | `/adjudication-readiness/:id/suppress` | Yes | admin |
| POST | `/adjudication-readiness/:id/void` | Yes | admin |

### Group 2: Review Sessions (12 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/review-sessions` | Yes | teacher, lead_teacher, department_head, admin |
| GET | `/review-sessions` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-sessions/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-sessions/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-sessions/by-reviewer/:reviewerId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-sessions/by-status/:status` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/review-sessions/:id/start` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-sessions/:id/review-ready` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-sessions/:id/needs-second-review` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-sessions/:id/needs-more-evidence` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-sessions/:id/block` | Yes | department_head, admin |
| POST | `/review-sessions/:id/void` | Yes | admin |

### Group 3: Evidence Bundles (10 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/evidence-bundles` | Yes | teacher, lead_teacher, department_head, admin |
| GET | `/evidence-bundles` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/evidence-bundles/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/evidence-bundles/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/evidence-bundles/by-review-session/:sessionId` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/evidence-bundles/:id/verify-digest` | Yes | system_job |
| POST | `/evidence-bundles/:id/review-ready` | Yes | teacher, lead_teacher, department_head, admin |
| POST | `/evidence-bundles/:id/stale` | Yes | system_job |
| POST | `/evidence-bundles/:id/block` | Yes | department_head, admin |
| POST | `/evidence-bundles/:id/void` | Yes | admin |

### Group 4: Review Checklists (10 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/review-checklists` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-checklists/:id/evaluate` | Yes | teacher, lead_teacher, department_head |
| GET | `/review-checklists/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-checklists/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-checklists/by-session/:sessionId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/review-checklists/by-outcome/:outcome` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/review-checklists/:id/review-ready` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-checklists/:id/needs-more-evidence` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-checklists/:id/needs-conflict-declaration` | Yes | teacher, lead_teacher, department_head |
| POST | `/review-checklists/:id/block` | Yes | department_head, admin |
| POST | `/review-checklists/:id/void` | Yes | admin |

### Group 5: Conflict Declarations (10 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/conflict-declarations` | Yes | teacher, lead_teacher, department_head, admin |
| POST | `/conflict-declarations/:id/evaluate` | Yes | teacher, lead_teacher, department_head, admin |
| GET | `/conflict-declarations/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/conflict-declarations/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/conflict-declarations/by-reviewer/:reviewerId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/conflict-declarations/by-status/:status` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/conflict-declarations/:id/no-conflict` | Yes | teacher, lead_teacher, department_head, admin |
| POST | `/conflict-declarations/:id/hard-conflict` | Yes | teacher, lead_teacher, department_head, admin |
| POST | `/conflict-declarations/:id/needs-alternate-reviewer` | Yes | department_head, admin |
| POST | `/conflict-declarations/:id/void` | Yes | admin |

### Group 6: Reviewer Decisions (11 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/reviewer-decisions` | Yes | teacher, lead_teacher, department_head, admin |
| GET | `/reviewer-decisions/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/reviewer-decisions` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/reviewer-decisions/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/reviewer-decisions/by-session/:sessionId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/reviewer-decisions/by-reviewer/:reviewerId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/reviewer-decisions/by-status/:status` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/reviewer-decisions/:id/review-ready` | Yes | teacher, lead_teacher, department_head |
| POST | `/reviewer-decisions/:id/needs-second-review` | Yes | teacher, lead_teacher, department_head |
| POST | `/reviewer-decisions/:id/needs-more-evidence` | Yes | teacher, lead_teacher, department_head |
| POST | `/reviewer-decisions/:id/block` | Yes | department_head, admin |
| POST | `/reviewer-decisions/:id/suppress` | Yes | admin |
| POST | `/reviewer-decisions/:id/void` | Yes | admin |

### Group 7: Priority Overrides (11 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/priority-overrides` | Yes | teacher, lead_teacher, department_head |
| GET | `/priority-overrides/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/priority-overrides` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/priority-overrides/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/priority-overrides/by-requestor/:actorId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/priority-overrides/by-status/:status` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/priority-overrides/:id/review-ready` | Yes | lead_teacher, department_head |
| POST | `/priority-overrides/:id/needs-second-review` | Yes | lead_teacher, department_head |
| POST | `/priority-overrides/:id/approve-future-use` | Yes | department_head, admin |
| POST | `/priority-overrides/:id/reject` | Yes | department_head, admin |
| POST | `/priority-overrides/:id/block` | Yes | department_head, admin |
| POST | `/priority-overrides/:id/suppress` | Yes | admin |
| POST | `/priority-overrides/:id/void` | Yes | admin |

### Group 8: Second Review Requests (9 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/second-review-requests` | Yes | teacher, lead_teacher, department_head |
| GET | `/second-review-requests/:id` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/second-review-requests` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/second-review-requests/by-queue-item/:queueItemId` | N/A | teacher, lead_teacher, department_head, admin |
| GET | `/second-review-requests/by-status/:status` | N/A | teacher, lead_teacher, department_head, admin |
| POST | `/second-review-requests/:id/review-ready` | Yes | lead_teacher, department_head |
| POST | `/second-review-requests/:id/awaiting-reviewer` | Yes | lead_teacher, department_head |
| POST | `/second-review-requests/:id/review-received` | Yes | lead_teacher, department_head |
| POST | `/second-review-requests/:id/block` | Yes | department_head, admin |
| POST | `/second-review-requests/:id/suppress` | Yes | admin |
| POST | `/second-review-requests/:id/void` | Yes | admin |

### Group 9: Consensus Records (10 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/consensus-records` | Yes | lead_teacher, department_head |
| POST | `/consensus-records/evaluate` | Yes | lead_teacher, department_head, admin |
| GET | `/consensus-records/:id` | N/A | lead_teacher, department_head, admin |
| GET | `/consensus-records` | N/A | lead_teacher, department_head, admin |
| GET | `/consensus-records/by-queue-item/:queueItemId` | N/A | lead_teacher, department_head, admin |
| GET | `/consensus-records/by-status/:status` | N/A | lead_teacher, department_head, admin |
| POST | `/consensus-records/:id/consensus` | Yes | lead_teacher, department_head, admin |
| POST | `/consensus-records/:id/partial-consensus` | Yes | lead_teacher, department_head, admin |
| POST | `/consensus-records/:id/disagreement` | Yes | lead_teacher, department_head, admin |
| POST | `/consensus-records/:id/needs-more-evidence` | Yes | lead_teacher, department_head |
| POST | `/consensus-records/:id/block` | Yes | department_head, admin |
| POST | `/consensus-records/:id/void` | Yes | admin |

### Group 10: Disagreement Resolutions (9 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/disagreement-resolutions` | Yes | department_head, admin |
| GET | `/disagreement-resolutions/:id` | N/A | department_head, admin |
| GET | `/disagreement-resolutions` | N/A | department_head, admin |
| GET | `/disagreement-resolutions/by-queue-item/:queueItemId` | N/A | department_head, admin |
| GET | `/disagreement-resolutions/by-status/:status` | N/A | department_head, admin |
| POST | `/disagreement-resolutions/:id/review-ready` | Yes | department_head |
| POST | `/disagreement-resolutions/:id/approve-future-use` | Yes | department_head, admin |
| POST | `/disagreement-resolutions/:id/block` | Yes | department_head, admin |
| POST | `/disagreement-resolutions/:id/suppress` | Yes | admin |
| POST | `/disagreement-resolutions/:id/void` | Yes | admin |

### Group 11: Queue Dispositions (9 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/queue-dispositions` | Yes | lead_teacher, department_head |
| GET | `/queue-dispositions/:id` | N/A | lead_teacher, department_head, admin |
| GET | `/queue-dispositions` | N/A | lead_teacher, department_head, admin |
| GET | `/queue-dispositions/by-queue-item/:queueItemId` | N/A | lead_teacher, department_head, admin |
| GET | `/queue-dispositions/by-code/:code` | N/A | lead_teacher, department_head, admin |
| GET | `/queue-dispositions/by-status/:status` | N/A | lead_teacher, department_head, admin |
| POST | `/queue-dispositions/:id/review-ready` | Yes | lead_teacher, department_head |
| POST | `/queue-dispositions/:id/approve-future-use` | Yes | department_head, admin |
| POST | `/queue-dispositions/:id/block` | Yes | department_head, admin |
| POST | `/queue-dispositions/:id/suppress` | Yes | admin |
| POST | `/queue-dispositions/:id/void` | Yes | admin |

### Group 12: Quality Samples (8 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/quality-samples` | Yes | admin, system_job |
| POST | `/quality-samples/calculate` | Yes | system_job |
| GET | `/quality-samples/:id` | N/A | admin, system_job |
| GET | `/quality-samples` | N/A | admin, system_job |
| GET | `/quality-samples/by-queue-item/:queueItemId` | N/A | admin, system_job |
| GET | `/quality-samples/selected` | N/A | admin, system_job |
| GET | `/quality-samples/by-policy/:policyVersion` | N/A | admin, system_job |
| POST | `/quality-samples/:id/void` | Yes | admin |

### Group 13: Adjudication Summaries (8 routes)

| Method | Path | Idempotent | Actor Roles |
|--------|------|------------|-------------|
| POST | `/adjudication-summaries` | Yes | department_head, admin |
| GET | `/adjudication-summaries/:id` | N/A | department_head, admin |
| GET | `/adjudication-summaries` | N/A | department_head, admin |
| GET | `/adjudication-summaries/by-student/:studentRef` | N/A | department_head, admin |
| GET | `/adjudication-summaries/by-plan/:planId` | N/A | department_head, admin |
| GET | `/adjudication-summaries/by-queue-item/:queueItemId` | N/A | department_head, admin |
| POST | `/adjudication-summaries/:id/refresh` | Yes | system_job |
| POST | `/adjudication-summaries/:id/review-ready` | Yes | department_head, admin |
| POST | `/adjudication-summaries/:id/stale` | Yes | system_job |
| POST | `/adjudication-summaries/:id/block` | Yes | department_head, admin |
| POST | `/adjudication-summaries/:id/void` | Yes | admin |

## Route Summary

| Group | Routes |
|-------|--------|
| Adjudication Readiness | 13 routes (7 GET, 6 POST) |
| Review Sessions | 12 routes (5 GET, 7 POST) |
| Evidence Bundles | 10 routes (4 GET, 6 POST) |
| Review Checklists | 10 routes (4 GET + 1 POST create, 5 POST status) |
| Conflict Declarations | 10 routes (5 GET, 5 POST) |
| Reviewer Decisions | 13 routes (6 GET, 7 POST) |
| Priority Overrides | 13 routes (5 GET, 8 POST) |
| Second Review Requests | 11 routes (5 GET, 6 POST) |
| Consensus Records | 11 routes (4 GET, 7 POST) |
| Disagreement Resolutions | 10 routes (4 GET, 6 POST) |
| Queue Dispositions | 11 routes (5 GET, 6 POST) |
| Quality Samples | 8 routes (5 GET, 3 POST) |
| Adjudication Summaries | 11 routes (5 GET, 6 POST) |
| **Total** | **92 routes (64 GET, 28 POST)** |

## Idempotency Requirements

All POST (mutation) routes require an `Idempotency-Key` header. The idempotency key is used to:

1. Check for duplicate requests via `RecoveryCaseAdjudicationIdempotencyRecord`
2. Return the same response for repeated identical requests within the idempotency window
3. Prevent duplicate audit events

Idempotency compound key: `(schoolId, idempotencyKey, operation)`

## Forbidden Routes

The following route patterns are explicitly forbidden and VERIFIED ABSENT from the route file:

| Route Pattern | Reason |
|---------------|--------|
| `/assign` | Live assignment |
| `/reassign` | Live reassignment |
| `/dispatch` | Live dispatch |
| `/send` | Live sending |
| `/notify` | Live notification |
| `/publish` | Live publishing |
| `/execute` | Live execution |
| `/activate` | Live activation |
| `/sync` | External sync |
| `/calendar` | Calendar creation |
| `/regrade` | Live regrade execution |
| `/rerank` | Queue ranking mutation |
| `/update-priority` | Priority mutation |
| `/update-queue` | Queue mutation |
| `/apply-override` | Un-governed override application |
| `/mutate-score` | Score mutation |
| `/mutate-mastery` | Mastery mutation |

## Forbidden Actions

All roles (including admin) are denied the following actions by safety policy:

| Action | Policy |
|--------|--------|
| Live assignment | `NO_LIVE_ASSIGNMENT` |
| Review dispatch | `NO_REVIEW_DISPATCH` |
| Escalation dispatch | `NO_ESCALATION_DISPATCH` |
| Notification | `NO_NOTIFICATION` |
| Calendar event | `NO_CALENDAR_EVENT` |
| Portal publish | `NO_PORTAL_PUBLISH` |
| External sync | `NO_EXTERNAL_SYNC` |
| Live execution | `NO_LIVE_EXECUTION` |
| Live authorization | `NO_LIVE_AUTHORIZATION` |
| Live closure | `NO_LIVE_CLOSURE` |
| Priority mutation | `NO_PRIORITY_MUTATION` |
| Queue mutation | `NO_QUEUE_MUTATION` |
| Score mutation | `NO_SCORE_MUTATION` |
| Mastery mutation | `NO_MASTERY_MUTATION` |
| Regrade execution | `NO_REGRADE_EXECUTION` |
| AI decision | `NO_AI_DECISION` |
| Generated question | `NO_GENERATED_QUESTION` |
| OCR | `NO_OCR` |
| PDF | `NO_PDF` |
| Sensitive factor use | `NO_SENSITIVE_FACTOR_USE` |

## Mounting

```typescript
import recoveryCaseAdjudicationRoutes from './routes/recoveryCaseAdjudication';
app.use(
  '/api/question-bank/recovery-case-adjudication',
  schoolAuthMiddleware,
  requireVerifiedSchoolContext,
  recoveryCaseAdjudicationRoutes
);
```

## Duplication Verification

- Route file `backend/src/routes/recoveryCaseAdjudication.ts` is distinct from Pkg 25 route file `recoveryCaseTriage.ts`
- No Pkg 25 route prefixes are reused (`/triage-runs`, `/triage-entries`, `/allocation-drafts`, `/escalation-drafts`, `/review-window-drafts`, `/duplicate-suppression-log`, `/capacity-snapshots`)
- No Pkg 17-24 route prefixes are reused
- No Task 029 route prefixes are reused (`/expansion-operations`, `/operations-dashboard`)
- No teacher intervention route prefixes are reused (`/teacher-interventions`, `/teacher-queue`)
