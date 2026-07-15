# Package 15: Route Contract — Controlled Report Card Access Readiness

## Mount

```
Path: /api/question-bank/result-report-card-access
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

| Role | Grant | Recipient | Preview | Token Intent | Acknowledgement | Revocation | Expiry | Timeline | Summary |
|------|-------|-----------|---------|-------------|----------------|------------|--------|----------|---------|
| teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| lead_teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| department_head | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| admin | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| system_job | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| student | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| parent | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| guest | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| unknown | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

## Forbidden Leakage Rules (All Routes)

No route may leak:
- answerKeySafeRef, answerKeyText, correctAnswerSummary
- rubricInternal, rubricText, rawRubric
- markingNotesTeacherOnly, teacherOnlyNotes
- hiddenReasoning, chainOfThought
- rawStudentAnswer
- unreleasedScore, unreleasedGrade
- livePortalUrl, portalUrl, signedUrl
- accessToken, refreshToken, loginToken, jwt, sessionCookie, password
- apiKey, providerSecret
- rawEmail, emailAddress, rawPhone, phoneNumber
- notificationPayload, emailPayload, smsPayload, pushPayload, whatsAppPayload
- pdfBinary, pdfBuffer, pdfBase64
- htmlExport, htmlFile, portalPayload
- externalSyncPayload
- aiNarrative, generatedNarrative, modelOutput
- ocrText

## Route Endpoints

### Access Grants

| Method | Path | Purpose | Request Body | Deferred Behavior |
|--------|------|---------|-------------|-------------------|
| POST | /grants | Create access grant from export readiness | CreateAccessGrantInput | No live portal, no token, no notification, no PDF |
| GET | /grants | List grants for school | query: status?, audienceType? | — |
| GET | /grants/:resultReportCardAccessGrantId | Get grant by ID | — | — |
| GET | /students/:studentRef/grants | List grants for student | — | — |
| GET | /assemblies/:resultReportCardAssemblyId/grants | List grants for assembly | — | — |
| GET | /export-jobs/:resultReportCardExportJobId/grants | List grants for export job | — | — |
| POST | /grants/:resultReportCardAccessGrantId/validate | Validate grant | — | — |
| POST | /grants/:resultReportCardAccessGrantId/ready | Mark ready for future access | — | No live portal activation |
| POST | /grants/:resultReportCardAccessGrantId/suppress | Suppress grant | — | — |
| POST | /grants/:resultReportCardAccessGrantId/revoke | Revoke grant | — | No live portal session termination |
| POST | /grants/:resultReportCardAccessGrantId/expire | Expire grant | — | No worker scheduling |
| POST | /grants/:resultReportCardAccessGrantId/block | Block grant | — | — |
| POST | /grants/:resultReportCardAccessGrantId/void | Void grant | — | — |

### Recipients

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/recipients | Create access recipient | CreateAccessRecipientInput |
| GET | /grants/:resultReportCardAccessGrantId/recipients | List recipients for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId | Get recipient by ID | — |
| GET | /students/:studentRef/recipients | List recipients for student | — |
| POST | /recipients/:resultReportCardAccessRecipientId/validate | Validate recipient | — |
| POST | /recipients/:resultReportCardAccessRecipientId/suppress | Suppress recipient | — |
| POST | /recipients/:resultReportCardAccessRecipientId/revoke | Revoke recipient | — |
| POST | /recipients/:resultReportCardAccessRecipientId/block | Block recipient | — |
| POST | /recipients/:resultReportCardAccessRecipientId/void | Void recipient | — |

### Portal Previews

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/previews | Compose mock portal preview | ComposePortalPreviewInput |
| GET | /grants/:resultReportCardAccessGrantId/previews | List previews for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId/previews | List previews for recipient | — |
| GET | /previews/:resultReportCardPortalPreviewId | Get preview by ID | — |
| POST | /previews/:resultReportCardPortalPreviewId/seal | Seal preview | — |
| POST | /previews/:resultReportCardPortalPreviewId/suppress | Suppress preview | — |
| POST | /previews/:resultReportCardPortalPreviewId/block | Block preview | — |
| POST | /previews/:resultReportCardPortalPreviewId/void | Void preview | — |

### Token Intents

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/token-intents | Create token intent | CreateTokenIntentInput |
| GET | /grants/:resultReportCardAccessGrantId/token-intents | List token intents for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId/token-intents | List token intents for recipient | — |
| GET | /token-intents/:resultReportCardAccessTokenIntentId | Get token intent by ID | — |
| POST | /token-intents/:resultReportCardAccessTokenIntentId/validate | Validate token intent | — |
| POST | /token-intents/:resultReportCardAccessTokenIntentId/block | Block token intent | — |
| POST | /token-intents/:resultReportCardAccessTokenIntentId/void | Void token intent | — |

### Acknowledgements

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/acknowledgements | Record access acknowledgement | RecordAcknowledgementInput |
| GET | /grants/:resultReportCardAccessGrantId/acknowledgements | List acknowledgements for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId/acknowledgements | List acknowledgements for recipient | — |
| GET | /previews/:resultReportCardPortalPreviewId/acknowledgements | List acknowledgements for preview | — |
| GET | /acknowledgements/:resultReportCardAccessAcknowledgementId | Get acknowledgement by ID | — |
| POST | /acknowledgements/:resultReportCardAccessAcknowledgementId/block | Block acknowledgement | — |
| POST | /acknowledgements/:resultReportCardAccessAcknowledgementId/void | Void acknowledgement | — |

### Revocations

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/revocations | Create revocation | CreateRevocationInput |
| GET | /grants/:resultReportCardAccessGrantId/revocations | List revocations for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId/revocations | List revocations for recipient | — |
| GET | /revocations/:resultReportCardAccessRevocationId | Get revocation by ID | — |
| POST | /revocations/:resultReportCardAccessRevocationId/apply | Apply revocation | — |
| POST | /revocations/:resultReportCardAccessRevocationId/void | Void revocation | — |

### Expiries

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/expiries | Create expiry | CreateExpiryInput |
| GET | /grants/:resultReportCardAccessGrantId/expiries | List expiries for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId/expiries | List expiries for recipient | — |
| GET | /expiries/:resultReportCardAccessExpiryId | Get expiry by ID | — |
| POST | /expiries/:resultReportCardAccessExpiryId/schedule | Schedule expiry | — |
| POST | /expiries/:resultReportCardAccessExpiryId/apply | Apply expiry | — |
| POST | /expiries/:resultReportCardAccessExpiryId/cancel | Cancel expiry | — |
| POST | /expiries/:resultReportCardAccessExpiryId/void | Void expiry | — |

### Timeline

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /grants/:resultReportCardAccessGrantId/timeline | Record timeline event | RecordTimelineInput |
| GET | /grants/:resultReportCardAccessGrantId/timeline | List timeline for grant | — |
| GET | /recipients/:resultReportCardAccessRecipientId/timeline | List timeline for recipient | — |
| GET | /students/:studentRef/timeline | List timeline for student | — |
| POST | /timeline/:resultReportCardAccessTimelineId/suppress | Suppress timeline event | — |
| POST | /timeline/:resultReportCardAccessTimelineId/void | Void timeline event | — |

### Summaries

| Method | Path | Purpose | Request Body |
|--------|------|---------|-------------|
| POST | /summaries | Create access summary | CreateSummaryInput |
| GET | /summaries | List summaries for school | — |
| GET | /students/:studentRef/summaries | List summaries for student | — |
| GET | /assemblies/:resultReportCardAssemblyId/summaries | List summaries for assembly | — |
| GET | /export-jobs/:resultReportCardExportJobId/summaries | List summaries for export job | — |
| GET | /summaries/:resultReportCardAccessSummaryId | Get summary by ID | — |
| POST | /summaries/:resultReportCardAccessSummaryId/refresh | Refresh summary | — |
| POST | /summaries/:resultReportCardAccessSummaryId/stale | Mark summary stale | — |
| POST | /summaries/:resultReportCardAccessSummaryId/block | Block summary | — |
| POST | /summaries/:resultReportCardAccessSummaryId/void | Void summary | — |

## Safe Error Codes

| Code | Meaning |
|------|---------|
| SCHOOL_MISMATCH | School context does not match resource school |
| MISSING_SCHOOL_CONTEXT | School context not provided |
| FORBIDDEN_ROLE | Actor role not allowed for operation |
| POLICY_BLOCKED | Policy enforcement blocked operation |
| MISSING_EXPORT_JOB | Required Package 14 export job reference missing |
| MISSING_EXPORT_ENVELOPE | Required Package 14 export envelope reference missing |
| MISSING_EXPORT_RECEIPT | Required Package 14 export receipt reference missing |
| MISSING_ARCHIVE_MANIFEST | Required Package 14 archive manifest reference missing |
| NOT_FOUND | Requested resource not found |
| INVALID_STATUS_TRANSITION | Status transition not allowed |
| IDEMPOTENCY_CONFLICT | Idempotency key conflict |
| VALIDATION_ERROR | Request body validation failed |
| LIVE_PORTAL_BLOCKED | Live portal publication blocked by policy |
| LIVE_TOKEN_BLOCKED | Real token creation blocked by policy |
| NOTIFICATION_BLOCKED | Notification sending blocked by policy |
| SAFETY_CHECK_FAILED | Safety assertion failed |
