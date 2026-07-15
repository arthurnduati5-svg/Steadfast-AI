# Package 15: Controlled Report Card Access Readiness

## 1. Package 15 Scope

Package 15 builds the backend-only access readiness layer for controlled report card access. After a report card has been assembled, reviewed, exported through mock-only export jobs, and prepared as archive-ready metadata, Package 15 prepares controlled audience-safe access readiness for future parent, student, teacher, admin, archive, and print access without publishing a live portal, creating real links, sending notifications, generating PDFs, syncing externally, calling AI, leaking private data, or duplicating Package 11 through Package 14 logic.

## 2. Package 14 Dependency Proof

Package 15 requires Package 14 export job, export target, export envelope, dry-run receipt, and archive manifest records to create access grants. No access readiness record may exist without:

- A Package 13 report card assembly
- A Package 13 audience projection
- A Package 13 approved review
- A Package 14 export job
- A Package 14 safe export envelope
- A Package 14 dry-run export receipt or archive-ready manifest

## 3. Package 14 Export Job Reuse Proof

Package 15's `ResultReportCardAccessGrantRecord` references `resultReportCardExportJobId` — the Package 14 export job. The export job is never duplicated, only referenced by ID.

## 4. Package 14 Export Target Reuse Proof

Package 15's `ResultReportCardAccessGrantRecord` references `resultReportCardExportTargetId` — the Package 14 export target. The target is never duplicated, only referenced by ID.

## 5. Package 14 Export Envelope Reuse Proof

Package 15's `ResultReportCardAccessGrantRecord` and `ResultReportCardPortalPreviewRecord` reference `resultReportCardExportEnvelopeId` — the Package 14 safe export envelope. The envelope is never duplicated, only referenced by ID.

## 6. Package 14 Dry-Run Receipt Reuse Proof

Package 15's `ResultReportCardAccessGrantRecord` optionally references `resultReportCardExportReceiptId` — the Package 14 dry-run receipt. The receipt is never duplicated, only referenced by ID.

## 7. Package 14 Archive Manifest Reuse Proof

Package 15's `ResultReportCardAccessGrantRecord` and `ResultReportCardPortalPreviewRecord` optionally reference `resultReportCardArchiveManifestId` — the Package 14 archive manifest. The manifest is never duplicated, only referenced by ID.

## 8. Package 13 Audience Projection Reuse Proof

Package 15's `ResultReportCardAccessGrantRecord` and `ResultReportCardAccessRecipientRecord` reference `resultReportCardAudienceProjectionId` — the Package 13 audience projection. The projection is never duplicated, only referenced by ID.

## 9. Package 12 Recipient Boundary Reuse Proof

Package 15 recipient concepts follow the same pattern as Package 12 recipient boundary — no raw contact destinations are stored. Recipient descriptors use `safeRecipientSummary` and `recipientDescriptorJson` instead of raw email, phone, or notification payload.

## 10. Package 15 No-Duplication Scan Summary

All 11 ResultReportCardAccess*Record terms were NOT FOUND in the existing repository. Forbidden live portal/token/PDF/AI/OCR models do not exist and are not created. Existing Package 13/14 records are reused by reference only. See `package-15-no-duplication-scan.md` for full details.

## 11. Prisma Models Added or Reused

### Models Added (11)

1. ResultReportCardAccessGrantRecord
2. ResultReportCardAccessRecipientRecord
3. ResultReportCardPortalPreviewRecord
4. ResultReportCardAccessTokenIntentRecord
5. ResultReportCardAccessAcknowledgementRecord
6. ResultReportCardAccessRevocationRecord
7. ResultReportCardAccessExpiryRecord
8. ResultReportCardAccessTimelineRecord
9. ResultReportCardAccessSummaryRecord
10. ResultReportCardAccessAuditRecord
11. ResultReportCardAccessIdempotencyRecord

### Models Reused (by reference only)

- ResultReportCardExportJobRecord (Package 14)
- ResultReportCardExportTargetRecord (Package 14)
- ResultReportCardExportEnvelopeRecord (Package 14)
- ResultReportCardExportReceiptRecord (Package 14)
- ResultReportCardArchiveManifestRecord (Package 14)
- ResultReportCardAssemblyRecord (Package 13)
- ResultReportCardAudienceProjectionRecord (Package 13)
- ResultReportCardReviewRecord (Package 13)
- ResultReleasePacketRecord (Package 11)

## 12. Access Grant Lifecycle

```
draft → validated → ready_for_future_access
draft → validated → suppressed
draft → validated → blocked
draft → validated → revoked
draft → validated → expired
any → void
```

An access grant requires Package 14 export job, export target, export envelope, and either a dry-run receipt or archive manifest reference.

## 13. Recipient Descriptor Lifecycle

```
draft → validated
draft → suppressed
draft → revoked
draft → blocked
any → void
```

No raw email, phone, password, token, or notification payload stored.

## 14. Mock Portal Preview Lifecycle

```
draft → composed → sealed
draft → suppressed
draft → blocked
any → void
```

Safety checks block answer keys, raw rubrics, raw student answers, hidden reasoning, teacher-only notes, live URLs, tokens, PDFs, HTML exports, AI narratives, OCR text, and external sync payloads.

## 15. Token Intent Lifecycle

```
draft → validated
draft → blocked
any → void
```

No secret values stored — no token value, JWT, signed URL, session cookie, login bypass, password, or provider secret.

## 16. Acknowledgement Lifecycle

```
created → recorded
created → blocked
any → void
```

Dry-run acknowledgement only. No real notification sent.

## 17. Revocation Lifecycle

```
draft → applied
any → void
```

Revocation is a metadata decision record. Does not close live portal sessions (none exist).

## 18. Expiry Lifecycle

```
draft → scheduled → applied
draft → cancelled
any → void
```

Expiry is a metadata plan record. Does not schedule workers. Does not revoke live portal sessions.

## 19. Timeline Read Model Lifecycle

```
recorded
recorded → suppressed
any → void
```

Safe audit timeline events for access readiness operations.

## 20. Summary Read Model Lifecycle

```
active → stale
active → blocked
any → void
```

Aggregate read model summarizing access readiness by school, student, assembly, and export job.

## 21. No-Live-Portal Policy

Package 15 has a dedicated `RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL` policy family that blocks all live portal publication. Every service and route enforces this policy. Portal previews are mock-only metadata records.

## 22. No-Real-Token Policy

Package 15 has a dedicated `RESULT_REPORT_CARD_ACCESS_NO_REAL_TOKEN` policy family that blocks all real token creation. Token intents are non-secret metadata records.

## 23. No-Notification Policy

Package 15 has a dedicated `RESULT_REPORT_CARD_ACCESS_NO_NOTIFICATION` policy family that blocks all notification sending. Acknowledgements are dry-run metadata records.

## 24. AI/OCR/PDF/Notification/Portal/External-Sync Deferral Explanation

All real execution of portal publication, token generation, notification sending, PDF generation, HTML export, AI narrative generation, OCR processing, and external school sync is intentionally deferred to future packages. Package 15 creates only safe future-access readiness metadata.

## 25. Forbidden Scope Not Touched

- No frontend files modified
- No AI provider imports
- No OCR imports
- No notification sending
- No PDF generation
- No HTML export file creation
- No external sync
- No score changes
- No result version overwrites
- No regrade execution

## 26. Tests Run

See verification table in final accountability.

## 27. Known Deferred Items

- Real parent portal publication (future package)
- Real student portal publication (future package)
- Real teacher dashboard publication (future package)
- Real signed URL generation (future package)
- Real access token creation (future package)
- Email/SMS/push/WhatsApp notification sending (future package)
- Real PDF generation (future package)
- HTML export file generation (future package)
- External school system sync (future package)
- AI narrative generation (future package)
- OCR processing (future package)
- Frontend UI for access preview (future package)

## 28. Package 16 Readiness

Package 16 is ready to prompt after Package 15 is committed and accepted.
