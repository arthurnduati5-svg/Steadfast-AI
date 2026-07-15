# Package 23 Route Contract

## Base Path

```
/api/question-bank/recovery-execution-authorization-preview
```

## Auth Middleware

- `schoolAuthMiddleware` — extracts and validates school context
- `requireVerifiedSchoolContext` — ensures school context is verified

## Route Groups

### /authorization-readiness
- `POST /` — Create authorization readiness record
- `GET /` — List authorization readiness records (query: schoolId, studentRef, planId, status)
- `GET /:id` — Get authorization readiness record by ID
- `POST /:id/review-ready` — Mark as review ready
- `POST /:id/authorization-preview-ready` — Mark as authorization preview ready
- `POST /:id/suppress` — Suppress
- `POST /:id/block` — Block with reason codes
- `POST /:id/void` — Void

### /authorization-request-drafts
- `POST /` — Create authorization request draft
- `GET /` — List (query: studentRef, planId, status)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/authorization-preview-ready`
- `POST /:id/suppress`
- `POST /:id/block`
- `POST /:id/void`

### /authorization-eligibility-checks
- `POST /` — Create eligibility check
- `GET /` — List (query: planId, decision)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/block`
- `POST /:id/void`

### /authority-matrix-snapshots
- `POST /` — Create authority matrix snapshot
- `GET /` — List (query: planId, status)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/approval-chain-ready`
- `POST /:id/suppress`
- `POST /:id/block`
- `POST /:id/void`

### /approval-chain-drafts
- `POST /` — Create approval chain draft
- `GET /` — List (query: planId, approverRef, status)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/approval-chain-ready`
- `POST /:id/suppress`
- `POST /:id/block`
- `POST /:id/void`

### /risk-attestations
- `POST /` — Create risk attestation
- `GET /` — List (query: planId, riskLevel, status)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/risk-attested`
- `POST /:id/veto`
- `POST /:id/suppress`
- `POST /:id/block`
- `POST /:id/void`

### /consent-boundary-checks
- `POST /` — Create consent boundary check
- `GET /` — List (query: planId, decision)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/block`
- `POST /:id/void`

### /vetoes
- `POST /` — Create veto
- `GET /` — List (query: planId, reason, actorId)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/suppress`
- `POST /:id/void`

### /preflight-checklists
- `POST /` — Create preflight checklist
- `GET /` — List (query: planId, status)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/authorization-preview-ready`
- `POST /:id/block`
- `POST /:id/void`
- `POST /:id/refresh`

### /authorization-dry-runs
- `POST /` — Create authorization dry run
- `GET /` — List (query: planId, decision)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/mock-authorized`
- `POST /:id/mock-denied`
- `POST /:id/void`

### /pre-live-decision-packets
- `POST /` — Create pre-live decision packet
- `GET /` — List (query: planId, status)
- `GET /:id` — Get by ID
- `POST /:id/review-ready`
- `POST /:id/authorization-preview-ready`
- `POST /:id/suppress`
- `POST /:id/block`
- `POST /:id/void`

### /mock-authorization-receipts
- `POST /` — Create mock authorization receipt
- `GET /` — List (query: planId, decision)
- `GET /:id` — Get by ID
- `POST /:id/void`

### /authorization-summaries
- `POST /` — Create authorization summary
- `GET /` — List (query: studentRef, planId)
- `GET /:id` — Get by ID
- `POST /:id/refresh`
- `POST /:id/stale`
- `POST /:id/review-ready`
- `POST /:id/block`
- `POST /:id/void`

## Required Headers

- `x-idempotency-key` — Required for all POST/POST.../:id/... mutations

## Safe Envelope Format

```json
{
  "success": true,
  "status": "ok",
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "status": "error",
  "message": "...",
  "errorCodes": ["..."],
  "correlationId": "..."
}
```

## Forbidden Behavior

This route must NEVER:
- Authorize live execution
- Execute live recovery closure
- Send notifications
- Publish to portals
- Mutate scores or mastery
- Call AI services
- Generate PDF or HTML exports
- Sync with external systems
- Create calendar events
- Execute Package 20 action queue items
- Execute Package 21 simulation verdicts
- Execute Package 22 closure readiness
