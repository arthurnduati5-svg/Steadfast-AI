# Package 14: Route Contract — Controlled Report Card Export

## Mount

```
Path: /api/question-bank/result-report-card-export
Middleware: schoolAuthMiddleware, requireVerifiedSchoolContext
```

## Safe Response Envelope

```typescript
{
  ok: boolean;
  requestId: string;
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

All mutating operations require `x-idempotency-key` header. If absent, a UUID is auto-generated.

## Role Behavior

| Role | Export Job Creation | Target Resolution | Envelope Composition | Mock Attempts | Receipts | Suppressions | Retry Plans | Archive Manifests |
|------|-------------------|-------------------|---------------------|---------------|----------|--------------|-------------|-------------------|
| teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| lead_teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| department_head | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| admin | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| system_job | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| student | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| parent | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| guest | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| unknown | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

## Route Endpoints

### Export Jobs

| Method | Path | Purpose | Request Body | Forbidden Leakage |
|--------|------|---------|-------------|-------------------|
| POST | /jobs | Create export job from intent | CreateExportJobInput | No answer keys, rubrics, raw answers, hidden reasoning, grades before release, PDF binary, portal payload, notification payload, external sync payload, AI narrative, OCR text |
| GET | /jobs | List jobs for school | query: status? | Same |
| GET | /jobs/:jobId | Get export job | — | Same |
| GET | /students/:studentRef/jobs | List jobs for student | — | Same |
| GET | /assemblies/:assemblyId/jobs | List jobs for assembly | — | Same |
| GET | /export-intents/:intentId/jobs | List jobs for export intent | — | Same |
| POST | /jobs/:jobId/validate | Validate export job | — | No-PDF, no-live-publication enforced |
| POST | /jobs/:jobId/queue-mock | Queue mock export | — | Mock-only |
| POST | /jobs/:jobId/mock-exported | Mark mock exported | — | Mock-only |
| POST | /jobs/:jobId/receipt-recorded | Mark receipt recorded | — | Mock-only |
| POST | /jobs/:jobId/archive-manifest-ready | Mark archive ready | — | Metadata only |
| POST | /jobs/:jobId/block | Block export job | — | Safety block |
| POST | /jobs/:jobId/cancel | Cancel export job | — | Status transition |
| POST | /jobs/:jobId/void | Void export job | — | Status transition |

### Export Targets

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/targets | Create export target | CreateExportTargetInput |
| GET | /jobs/:jobId/targets | List targets for job | — |
| GET | /targets/:targetId | Get export target | — |
| POST | /targets/:targetId/validate | Validate target | — |
| POST | /targets/:targetId/suppress | Suppress target | — |
| POST | /targets/:targetId/block | Block target | — |
| POST | /targets/:targetId/void | Void target | — |

### Export Envelopes

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/envelopes | Compose export envelope | CreateExportEnvelopeInput |
| GET | /jobs/:jobId/envelopes | List envelopes for job | — |
| GET | /targets/:targetId/envelopes | List envelopes for target | — |
| GET | /envelopes/:envelopeId | Get export envelope | — |
| POST | /envelopes/:envelopeId/seal | Seal envelope | — |
| POST | /envelopes/:envelopeId/suppress | Suppress envelope | — |
| POST | /envelopes/:envelopeId/block | Block envelope | — |
| POST | /envelopes/:envelopeId/void | Void envelope | — |

### Mock Export Attempts

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/mock-attempts | Create mock attempt | CreateMockExportAttemptInput |
| GET | /jobs/:jobId/mock-attempts | List attempts for job | — |
| GET | /targets/:targetId/mock-attempts | List attempts for target | — |
| GET | /mock-attempts/:attemptId | Get mock attempt | — |
| POST | /mock-attempts/:attemptId/start | Start mock attempt | — |
| POST | /mock-attempts/:attemptId/complete | Complete mock attempt | — |
| POST | /mock-attempts/:attemptId/fail | Fail mock attempt | — |
| POST | /mock-attempts/:attemptId/block | Block mock attempt | — |
| POST | /mock-attempts/:attemptId/void | Void mock attempt | — |

### Export Receipts

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/receipts | Record export receipt | CreateExportReceiptInput |
| GET | /jobs/:jobId/receipts | List receipts for job | — |
| GET | /targets/:targetId/receipts | List receipts for target | — |
| GET | /mock-attempts/:attemptId/receipts | List receipts for attempt | — |
| GET | /receipts/:receiptId | Get export receipt | — |
| POST | /receipts/:receiptId/block | Block receipt | — |
| POST | /receipts/:receiptId/void | Void receipt | — |

### Export Suppressions

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/suppressions | Create suppression | CreateExportSuppressionInput |
| GET | /jobs/:jobId/suppressions | List suppressions for job | — |
| GET | /targets/:targetId/suppressions | List suppressions for target | — |
| GET | /envelopes/:envelopeId/suppressions | List suppressions for envelope | — |
| GET | /suppressions/:suppressionId | Get suppression | — |
| POST | /suppressions/:suppressionId/lift | Lift suppression | — |
| POST | /suppressions/:suppressionId/void | Void suppression | — |

### Export Retry Plans

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/retry-plans | Create retry plan | CreateExportRetryPlanInput |
| GET | /jobs/:jobId/retry-plans | List retry plans for job | — |
| GET | /mock-attempts/:attemptId/retry-plans | List plans for attempt | — |
| GET | /retry-plans/:planId | Get retry plan | — |
| POST | /retry-plans/:planId/planned | Mark retry planned | — |
| POST | /retry-plans/:planId/cancel | Cancel retry plan | — |
| POST | /retry-plans/:planId/exhaust | Exhaust retry plan | — |
| POST | /retry-plans/:planId/void | Void retry plan | — |

### Archive Manifests

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /jobs/:jobId/archive-manifests | Create archive manifest | CreateArchiveManifestInput |
| GET | /jobs/:jobId/archive-manifests | List manifests for job | — |
| GET | /archive-manifests/:manifestId | Get archive manifest | — |
| POST | /archive-manifests/:manifestId/seal | Seal archive manifest | — |
| POST | /archive-manifests/:manifestId/block | Block archive manifest | — |
| POST | /archive-manifests/:manifestId/void | Void archive manifest | — |

## Safe Error Codes

| Code | Meaning |
|------|---------|
| EXPORT_JOB_CREATED, VALIDATED, QUEUED_MOCK, MOCK_EXPORTED, RECEIPT_RECORDED, ARCHIVE_MANIFEST_READY | Success status transitions |
| EXPORT_JOB_BLOCKED, CANCELLED, VOIDED | Status transitions |
| POLICY_BLOCKED | Policy evaluation blocked the operation |
| IDEMPOTENCY_CONFLICT | Duplicate idempotency key with completed operation |
| NOT_FOUND | Resource not found |
| FORBIDDEN | Role not authorized |
| FORBIDDEN_FIELD | Leakage detected in payload |
| ANSWER_KEY_LEAKAGE | Answer key detected in export envelope |
| RUBRIC_LEAKAGE | Rubric detected in export envelope |
| RAW_STUDENT_ANSWER_LEAKAGE | Raw student answer detected |
| PDF_BINARY_BLOCKED | PDF binary blocked by policy |
| LIVE_EXPORT_BLOCKED | Live export blocked by policy |
| NOTIFICATION_BLOCKED | Notification blocked by policy |
| PORTAL_PAYLOAD_LEAKAGE | Portal payload detected |
| EXTERNAL_SYNC_PAYLOAD_LEAKAGE | External sync payload detected |
| AI_NARRATIVE_BLOCKED | AI narrative blocked |
| OCR_BLOCKED | OCR blocked |
| UNKNOWN_SAFE_ERROR | Unexpected safe error |

## No-PDF Behavior

All routes enforce no-PDF/no-binary policy. Any request resulting in PDF binary, PDF buffer, or HTML export file generation returns a blocked decision with `PDF_BINARY_BLOCKED` or `PDF_EXPORT_BLOCKED` reason code.

## No-Live-Publication Behavior

All routes enforce no-live-publication policy. Any request resulting in live portal publication, external sync, notification sending, or AI narrative generation returns a blocked decision.

## Deferred Behavior

- Real PDF generation: DEFERRED
- HTML export file generation: DEFERRED
- Portal live publication: DEFERRED
- External school system sync: DEFERRED
- Email/SMS/Push/WhatsApp notification: DEFERRED
- AI narrative generation: DEFERRED
- OCR processing: DEFERRED
