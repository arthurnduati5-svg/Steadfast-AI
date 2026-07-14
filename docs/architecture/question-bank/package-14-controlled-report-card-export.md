# Package 14: Controlled Report Card Export Adapter

## 1. Package 14 Scope

Package 14 builds the backend controlled report card export adapter layer on top of Package 13's report card assembly infrastructure. It creates export jobs, targets, envelopes, mock export attempts, dry-run receipts, suppression decisions, retry plans, and archive-ready manifests — all without generating real PDFs, publishing to portals, sending notifications, or executing live exports.

## 2. Package 13 Dependency Proof

Package 14 consumes these Package 13 records by reference:
- `ResultReportCardAssemblyRecord` — source for export job creation
- `ResultReportCardAudienceProjectionRecord` — safe payload source for envelopes
- `ResultReportCardReviewRecord` — approval source for export eligibility
- `ResultReportCardExportIntentRecord` — export eligibility and channel source
- `ResultReportCardRenderManifestRecord` — layout and render-readiness source
- `ResultReportCardEvidenceLinkRecord` — safe evidence reference only

Package 14 maintains foreign key references (IDs) to these records without duplicating their data.

## 3. Prisma Models Added

| Model | Purpose |
|-------|---------|
| ResultReportCardExportJobRecord | School-scoped controlled export job |
| ResultReportCardExportTargetRecord | Future export target descriptor |
| ResultReportCardExportEnvelopeRecord | Safe export payload envelope |
| ResultReportCardMockExportAttemptRecord | Dry-run export attempt simulation |
| ResultReportCardExportReceiptRecord | Safe dry-run export receipt |
| ResultReportCardExportSuppressionRecord | Policy and safety suppression decision |
| ResultReportCardExportRetryPlanRecord | Non-executing retry plan |
| ResultReportCardArchiveManifestRecord | Archive-ready metadata manifest |
| ResultReportCardExportAuditRecord | Safe audit trail |
| ResultReportCardExportIdempotencyRecord | Idempotency guard |

## 4. Export Job Lifecycle

```
draft → validated → queued_mock → mock_exported → receipt_recorded → archive_manifest_ready
                                                                         ↓
                                                                    blocked / cancelled / void
```

## 5. Export Target Lifecycle

```
draft → validated → suppressed / blocked / void
```

Target types (all future-intent, no live destinations):
- pdf_export_future
- parent_portal_future
- student_portal_future
- teacher_dashboard_future
- admin_archive_future
- external_school_system_future
- print_package_future

## 6. Export Envelope Lifecycle

```
draft → composed → sealed / suppressed / blocked / void
```

Envelope modes: mock_payload_only, preview_payload_only, archive_metadata_only

## 7. Mock Export Attempt Lifecycle

```
created → started → completed / failed / blocked / void
```

## 8. Dry-Run Receipt Lifecycle

```
created → recorded / blocked / void
```

## 9. Suppression Lifecycle

```
active → lifted / void
```

Scopes: job, target, envelope, attempt, receipt

## 10. Retry Plan Lifecycle

```
draft → planned → cancelled / exhausted / void
```

## 11. Archive Manifest Lifecycle

```
draft → generated → sealed / blocked / void
```

Modes: metadata_only, future_archive_ready, future_print_ready, future_pdf_ready

## 12. Export Safety Rules

Safety service enforces:
- No answer key leakage in export envelopes
- No rubric leakage
- No raw student answer leakage
- No teacher-only notes in parent/student envelopes
- No hidden reasoning leakage
- No unreleased grade leakage
- No live provider payload
- No provider secrets
- No portal payload
- No notification payload
- No PDF binary
- No HTML export file
- No external sync payload
- No AI narrative
- No OCR text
- No raw mastery delta

## 13. No-PDF / No-Live-Publication Policy

Two always-blocked policy families:
- `RESULT_REPORT_CARD_EXPORT_NO_PDF_BINARY` — blocks all PDF/binary generation
- `RESULT_REPORT_CARD_EXPORT_NO_LIVE_PUBLICATION` — blocks all live export/publication

## 14. AI/OCR/Narrative Deferral

- AI narrative generation: DEFERRED to future package
- OCR processing: DEFERRED to future package
- All AI provider calls (OpenAI, Genkit, Gemini, Anthropic, Ollama, Pinecone): DEFERRED
- No AI imports in Package 14

## 15. Notification/Portal/PDF Deferral

- Email, SMS, push, WhatsApp notifications: DEFERRED
- Parent/student portal publication: DEFERRED
- Real PDF generation: DEFERRED
- HTML export file generation: DEFERRED
- External school system sync: DEFERRED

## 16. Forbidden Scope Not Touched

- No frontend UI files modified
- No AI routes modified
- No scoring or result version changes
- No Package 13 record mutations
- No live export execution
- No package-lock changes

## 17. Tests

9 test files with assertions covering:
- Contract existence and type definitions
- Export job lifecycle
- Target resolution
- Envelope safety
- Mock export receipts
- Suppression and retry plans
- Archive manifest
- Routes and no-duplication
- No-live-export safety

## 18. Package 15 Readiness

Package 15 is ready to prompt. Package 14 establishes the controlled export job infrastructure. The next package may build on this with integration testing, notification preparation, or portal payload preparation — remaining within mock/dry-run safety limits.
