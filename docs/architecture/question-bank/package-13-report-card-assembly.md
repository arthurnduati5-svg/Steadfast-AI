# Package 13: Report Card Assembly System

## 1. Package 13 Scope

Package 13 builds the backend report card assembly foundation. It creates template governance, template version management, report card assembly from Package 11 release packets, section composition with safety checks, evidence linking to upstream packages (5, 9, 10, 11, 12), audience-scoped projections, review workflow, export intents (deferred), and render manifests (preview only). All routes are backend-only. No PDF, no live export, no portal publication, no AI narrative, no OCR.

## 2. Package 12 Dependency Proof

Package 12 commit `35e5522 feat(qbank): add package 12 controlled result delivery adapter` and closure `5a40281 docs(qbank): finalize package 12 accountability with real verification results` are in the current working tree lineage.

- Package 12 final accountability exists: YES
- Package 12 contains `ACCEPTED_READY`: YES
- Package 12 contains `STEADFAST_QBANK_PACKAGE_12_CONTROLLED_RESULT_DELIVERY_ACCEPTED_READY`: YES
- Package 12 marked Package 13 ready to prompt: YES

Package 13 consumes:
- `ResultDeliveryJobRecord` — referenced as `resultDeliveryJobId` in assembly (delivery-readiness provenance)
- `ResultDeliveryReceiptRecord` — referenced as `resultDeliveryReceiptId` in assembly (dry-run proof)

## 3. Package 11 Release Packet Reuse Proof

Package 11 release packet (`ResultReleasePacketRecord`) is reused as the primary assembly source:

- `resultReleasePacketId` is required in every assembly creation call
- `ResultReleaseApprovalRecord` is referenced as `resultReleaseApprovalId` in the assembly
- `ResultAudienceProjectionRecord` (Package 11) is referenced as `resultAudienceProjectionId`
- No Package 11 models are duplicated

Package 11 commit: `d3e6510 feat(task-041): implement Package 11 parent-safe result release readiness`
Package 11 closure: `7895426 docs(qbank): finalize package 11 accountability with real verification results`

## 4. Package 11 Report Snapshot and Safe Summary Reuse Proof

Package 11 report snapshot (`StudentResultReportSnapshotRecord`) is reused as the primary snapshot source in every assembly:

- `studentResultReportSnapshotId` is required in assembly creation
- `ParentSafeResultSummaryRecord` is referenced as `parentSafeResultSummaryId` (optional)
- `StudentSafeResultSummaryRecord` is referenced as `studentSafeResultSummaryId` (optional)
- No Package 11 snapshot/summary models are duplicated

## 5. Package 12 Delivery-Readiness Provenance Proof

Package 12 delivery job (`ResultDeliveryJobRecord`) and delivery receipt (`ResultDeliveryReceiptRecord`) are reused as optional delivery-readiness provenance:

- `resultDeliveryJobId` referenced in assembly (provenance only)
- `resultDeliveryReceiptId` referenced in assembly (provenance only)
- No Package 12 models are duplicated

## 6. Package 10 Learning Evidence Reuse Proof

Package 10 evidence bridge (`ResultLearningEvidenceBridgeRecord`) is reused as optional learning-evidence provenance in the assembly:

- `resultLearningEvidenceBridgeId` referenced in assembly (optional)
- Evidence link records can reference Package 10 evidence bridge records by sourceRecordType/sourceRecordId
- No Package 10 models are duplicated

Package 10 commit: `2865831 feat(qbank): add package 10 mastery evidence bridge`
Package 10 closure: `44eb2a9 docs(qbank): finalize package 10 accountability with real verification results`

## 7. Package 9 Release Boundary Reuse Proof

Package 9 release boundary (`ResultReleaseBoundaryRecord`) is reused as boundary enforcement reference:

- `resultReleaseBoundaryId` is required in every assembly
- The boundary lifecycle (draft -> active -> blocked/void) is owned by Package 9
- Package 13 treats boundaries as read-only references
- No Package 9 boundary models are duplicated

Package 9 commit: `3fa30df feat(qbank): add package 9 result finalization governance`
Package 9 closure: `70f8a73 docs(qbank): finalize package 5 accountability with real verification results`

## 8. Package 5 Marking Result Version Reuse Proof

Package 5 marking result version (`MarkingResultVersionRecord`) is reused as authoritative result provenance:

- `markingResultVersionId` is required in every assembly
- Evidence links can reference Package 5 marking result versions by sourceRecordType/sourceRecordId
- No scores are changed, no result versions overwritten
- No Package 5 models are duplicated

Package 5 commit: `d82846d feat(qbank): add package 5 marking review moderation spine`
Package 5 closure: `70f8a73 docs(qbank): finalize package 5 accountability with real verification results`

## 9. Package 13 No-Duplication Scan Summary

A full repository audit was performed. See `package-13-no-duplication-scan.md` for complete results.

Key findings:
- 11 new Prisma models created (no existing model duplicated)
- 6 existing Package 11/12 records reused by reference
- Forbidden models (PDF, portal, notification, AI narrative, OCR, external sync) confirmed absent
- No existing system replaced

## 10. Prisma Models Added or Reused

### Added (11 models)

1. `ResultReportCardTemplateRecord` — template governance with status lifecycle
2. `ResultReportCardTemplateVersionRecord` — template versioning with version status lifecycle
3. `ResultReportCardAssemblyRecord` — report card assembly from release packet
4. `ResultReportCardSectionRecord` — section composition with safety checks
5. `ResultReportCardEvidenceLinkRecord` — evidence link to upstream packages
6. `ResultReportCardAudienceProjectionRecord` — audience-scoped safe projection
7. `ResultReportCardReviewRecord` — review workflow for assemblies
8. `ResultReportCardExportIntentRecord` — deferred export intent (no live export)
9. `ResultReportCardRenderManifestRecord` — preview-only render manifest
10. `ResultReportCardAuditRecord` — audit trail for all Package 13 operations
11. `ResultReportCardIdempotencyRecord` — idempotency guard

### Reused (by reference, not duplicated)

- `StudentResultReportSnapshotRecord` (Package 11)
- `ParentSafeResultSummaryRecord` (Package 11)
- `StudentSafeResultSummaryRecord` (Package 11)
- `ResultAudienceProjectionRecord` (Package 11)
- `ResultReleasePacketRecord` (Package 11)
- `ResultReleaseApprovalRecord` (Package 11)
- `ResultDeliveryJobRecord` (Package 12)
- `ResultDeliveryReceiptRecord` (Package 12)
- `ResultReleaseBoundaryRecord` (Package 9)
- `ResultLearningEvidenceBridgeRecord` (Package 10)
- `MarkingResultVersionRecord` (Package 5)

## 11. Existing Systems Reused

| Source Package | Record | Reuse Method |
|---------------|--------|-------------|
| Package 5 | `MarkingResultVersionRecord` | Reference by ID in assembly |
| Package 6 | `ExamPaperRecord`, `ExamPaperVersionRecord` | Reference by ID in assembly |
| Package 7 | `ExamAttemptRecord`, `ExamAttemptSubmissionSnapshotRecord` | Reference by ID in assembly |
| Package 9 | `ResultFinalizationDecisionRecord` | Reference by ID in assembly |
| Package 9 | `ResultReleaseBoundaryRecord` | Reference by ID in assembly |
| Package 10 | `ResultLearningEvidenceBridgeRecord` | Reference by ID in assembly + evidence links |
| Package 11 | `ResultReleasePacketRecord` | Reference by ID in assembly |
| Package 11 | `ResultReleaseApprovalRecord` | Reference by ID in assembly |
| Package 11 | `ResultAudienceProjectionRecord` | Reference by ID in assembly |
| Package 11 | `StudentResultReportSnapshotRecord` | Reference by ID in assembly |
| Package 11 | `ParentSafeResultSummaryRecord` | Reference by ID in assembly |
| Package 11 | `StudentSafeResultSummaryRecord` | Reference by ID in assembly |
| Package 12 | `ResultDeliveryJobRecord` | Reference by ID in assembly |
| Package 12 | `ResultDeliveryReceiptRecord` | Reference by ID in evidence links |

## 12. Template Lifecycle

```
draft -> active -> disabled -> void
```

1. `draft` — Template created, not yet active
2. `active` — Template activated for use
3. `disabled` — Template disabled (non-terminal)
4. `void` — Terminal state

Roles: teacher, lead_teacher, department_head, admin, system_job may create and activate templates. Admin/system_job may void.

## 13. Template Version Lifecycle

```
draft -> active -> retired -> void
```

1. `draft` — Version created under a template
2. `active` — Version activated (becomes the active version for the template)
3. `retired` — Version retired (superseded by a newer active version)
4. `void` — Terminal state

Each version carries layoutMode, sectionSchemaJson, allowedSectionTypesJson, blockedFieldNamesJson, and redactionRulesJson.

## 14. Report Card Assembly Lifecycle

```
draft -> assembled -> safety_checked -> sealed -> ready_for_review -> reviewed -> approved_for_export_intent
   |         |              |              |           |                |
   +-> blocked +-> blocked  +-> blocked   +-> blocked +-> blocked      +-> blocked
   +-> cancelled             +-> cancelled +-> cancelled
   +-> void                  +-> void      +-> void
```

1. `draft` — Assembly created from release packet, approval, boundary, etc.
2. `assembled` — Assembly assembled (run source checks completed)
3. `safety_checked` — Safety checks passed (forbidden field scan)
4. `sealed` — Assembly sealed (content frozen)
5. `ready_for_review` — Assembly ready for review workflow
6. `reviewed` — Review completed (linked to review records)
7. `approved_for_export_intent` — Approved for export intent creation
8. `blocked` — Non-terminal block
9. `cancelled` — Cancelled (non-terminal for assembly)
10. `void` — Terminal state

## 15. Section Composition Lifecycle

```
draft -> composed -> sealed -> blocked -> void
```

1. `draft` — Section created
2. `composed` — Section content composed (by section type)
3. `sealed` — Section sealed (content frozen)
4. `blocked` — Non-terminal block
5. `void` — Terminal state

Section types: result_overview, strengths, growth_areas, objective_mastery, practice_next_steps, parent_support_guidance, student_reflection_prompt, teacher_review_note, admin_audit_summary, delivery_readiness_summary.

## 16. Evidence-Link Lifecycle

```
active -> blocked -> void
```

1. `active` — Evidence link active, usable in projections and sections
2. `blocked` — Evidence link blocked (non-terminal)
3. `void` — Terminal state

Evidence links reference package_5_marking, package_9_result_governance, package_10_learning_evidence, package_11_result_release, or package_12_result_delivery sources via sourceRecordType/sourceRecordId.

## 17. Audience Projection Lifecycle

```
draft -> generated -> sealed -> blocked -> void
```

1. `draft` — Projection created
2. `generated` — Projection generated with safeProjectionJson
3. `sealed` — Projection sealed (content frozen)
4. `blocked` — Non-terminal block
5. `void` — Terminal state

Audience types: student, parent, teacher, admin, school_leadership, multi_audience.

## 18. Review Workflow Lifecycle

```
draft -> in_review -> approved / rejected / blocked -> void
```

1. `draft` — Review record created
2. `in_review` — Review started by reviewer
3. `approved` — Approved for export intent (triggers assembly status transition to `approved_for_export_intent`)
4. `rejected` — Review rejected (assembly can be revised)
5. `blocked` — Review blocked (non-terminal)
6. `void` — Terminal state

Review types: teacher_report_review, department_report_review, admin_report_review, system_preflight_review.
Review decisions: pending, approve_for_export_intent, request_revision, reject, block.
Allowed review decision roles: teacher, lead_teacher, department_head, admin, system_job.
Blocked review decision roles: student, parent, guest, unknown.

## 19. Export-Intent Lifecycle

```
draft -> eligible_for_future_export -> blocked -> void
```

1. `draft` — Export intent created with `_future` channel suffix
2. `eligible_for_future_export` — Marked eligible for future export (no actual export occurs)
3. `blocked` — Non-terminal block
4. `void` — Terminal state

All channels are `_future` suffixed: pdf_export_future, student_portal_future, parent_portal_future, teacher_dashboard_future, admin_archive_future, external_school_system_future, print_package_future.
Export modes: intent_only, preflight_only, mock_export_only.

## 20. Render-Manifest Lifecycle

```
draft -> generated -> sealed -> blocked -> void
```

1. `draft` — Manifest created
2. `generated` — Manifest generated with layoutJson, sectionOrderJson, assetRefsJson
3. `sealed` — Manifest sealed (content frozen)
4. `blocked` — Non-terminal block
5. `void` — Terminal state

Render modes: preview_only, future_pdf_ready, future_portal_ready, future_print_ready.
No actual PDF generation occurs. Manifests describe what a future render would include.

## 21. Projection Safety Rules

- **Student-safe projections**: Include safeProjectionJson, safeProjectionSummary, allowedFieldNames only. Exclude all forbidden fields.
- **Parent-boundary projections**: Same structure as student-safe. Additional parent-safe filtering applied.
- **Teacher projections**: Full operational data, no redaction.
- **Admin projections**: Full operational data with access to all records.
- **Forbidden fields** (redacted from student/parent projections): answer keys, rubric internals, raw student answers, teacher-only notes, hidden reasoning, unreleased scores/grades, delivery payloads, portal payloads, notification payloads, PDF binaries, mastery deltas, AI narratives, OCR text.
- No route returns provider secrets, API keys, or raw audit/delta data.

## 22. No-PDF / No-Live-Delivery Policy

- No route generates PDF binaries, PDF buffers, or PDF base64 content
- No route sends live email, SMS, push, or WhatsApp
- No route publishes to student or parent portals
- No route performs external school system sync
- All export channels are suffixed `_future`
- All render modes are `preview_only` or `future_*`
- Any request attempting a `*_live` export channel returns `LIVE_EXPORT_BLOCKED`
- Any request attempting a `*_live` render mode returns `LIVE_RENDER_BLOCKED`

## 23. AI/OCR/Narrative Deferral Explanation

Package 13 explicitly defers all AI-powered and content-generation features:

- **AI narrative generation**: No AI providers called. No generatedNarrative, modelOutput fields present. Reason code: `AI_NARRATIVE_DEFERRED`. Navigated by setting render mode to `preview_only` and export mode to `intent_only`.
- **OCR**: No OCR processing. `ocrText` is in the FORBIDDEN_REPORT_CARD_FIELDS list. Reason code: `OCR_DEFERRED`.
- **Report card narrative**: No narrative generation system built. Section content is composed from structured safe data only.

## 24. Notification, Portal, PDF, OCR, AI, and External-Sync Deferral Explanation

| Feature | Deferred To | Rationale |
|---------|-------------|-----------|
| Parent notification | Future package | Package 13 creates export intent only |
| Student notification | Future package | Package 13 creates export intent only |
| Portal publication | Future package | Package 13 creates export intent only |
| PDF export/generation | Future package | Package 13 creates render manifest and export intent only |
| OCR processing | Future package | Package 13 blocks OCR fields |
| AI narrative generation | Future package | Package 13 does not call AI |
| External school system sync | Future package | Package 13 creates export intent only |
| Live email/SMS/WhatsApp delivery | Already deferred in Package 12 | Package 13 references existing delivery receipts |

All deferred features return appropriate reason codes. Forbidden field names are defined in the contracts and enforced by the safety service.

## 25. Forbidden Scope Not Touched

- No frontend UI built
- No AI providers called (OpenAI, Genkit, Anthropic, Gemini, etc.)
- No OCR performed
- No scores changed
- No result versions overwritten
- No parent notifications sent
- No student notifications sent
- No portal publishing performed
- No PDF exports generated (binary, buffer, base64)
- No external school system sync
- No AI narratives generated
- No marking or regrade execution
- No live delivery channels implemented

## 26. Tests Run

9 test files exist in `backend/src/domains/assessment/result-report-card/tests/`:

1. `package-13-report-card-contracts.test.ts` — contract type definition tests
2. `package-13-template-versioning.test.ts` — template and version lifecycle tests
3. `package-13-assembly-lifecycle.test.ts` — assembly lifecycle transition tests
4. `package-13-section-composition-safety.test.ts` — section composition and safety check tests
5. `package-13-evidence-linking.test.ts` — evidence link lifecycle tests
6. `package-13-audience-projection-safety.test.ts` — audience projection generation and safety tests
7. `package-13-review-workflow.test.ts` — review workflow and role gating tests
8. `package-13-export-intent-and-render-manifest.test.ts` — export intent and render manifest lifecycle tests
9. `package-13-routes-and-no-duplication.test.ts` — route contract and no-duplication tests

## 27. Known Deferred Items

- Parent notification delivery (future package)
- Student notification delivery (future package)
- Portal publishing (future package)
- PDF export generation (future package)
- External school system sync (future package)
- AI narrative generation (future package)
- OCR processing (future package)
- Live report card export (future package)
- Frontend UI for report card assembly (future package)

## 28. Whether Package 14 is Ready to Prompt

YES. Package 13 is the final backend package in the question-bank assessment pipeline. Package 14 is ready to prompt for frontend integration or any future post-freeze extension.
