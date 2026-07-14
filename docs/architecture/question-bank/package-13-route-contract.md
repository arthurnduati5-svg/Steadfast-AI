# Package 13: Route Contract

## Base Path

```
/api/question-bank/result-report-cards
```

## Middleware

- `schoolAuthMiddleware`
- `requireVerifiedSchoolContext`

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
  policyDecision?: ResultReportCardPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}
```

## Safe Error Codes

- `AUTH_REQUIRED` — Authentication required
- `SCHOOL_CONTEXT_REQUIRED` — School ID not found
- `VALIDATION_FAILED` — Request body validation failed
- `POLICY_BLOCKED` — Policy evaluation denied the operation
- `IDEMPOTENCY_CONFLICT` — Conflicting idempotency key
- `NOT_FOUND` — Resource not found
- `FORBIDDEN_FIELD` — Request contains forbidden field
- `FORBIDDEN` — Actor role not permitted
- `TEMPLATE_NOT_FOUND` — Template not found
- `TEMPLATE_STATUS_CONFLICT` — Template status does not allow transition
- `TEMPLATE_ALREADY_ACTIVE` — Template already in active state
- `TEMPLATE_NOT_ACTIVE` — Template not in active state
- `TEMPLATE_VERSION_NOT_FOUND` — Template version not found
- `TEMPLATE_VERSION_STATUS_CONFLICT` — Template version status conflict
- `ASSEMBLY_NOT_FOUND` — Assembly not found
- `ASSEMBLY_STATUS_CONFLICT` — Assembly status conflict
- `SECTION_NOT_FOUND` — Section not found
- `SECTION_STATUS_CONFLICT` — Section status conflict
- `EVIDENCE_LINK_NOT_FOUND` — Evidence link not found
- `EVIDENCE_LINK_STATUS_CONFLICT` — Evidence link status conflict
- `PROJECTION_NOT_FOUND` — Audience projection not found
- `PROJECTION_STATUS_CONFLICT` — Projection status conflict
- `REVIEW_NOT_FOUND` — Review not found
- `REVIEW_STATUS_CONFLICT` — Review status conflict
- `REVIEW_ROLE_BLOCKED` — Actor role cannot perform review decision
- `EXPORT_INTENT_NOT_FOUND` — Export intent not found
- `EXPORT_INTENT_STATUS_CONFLICT` — Export intent status conflict
- `RENDER_MANIFEST_NOT_FOUND` — Render manifest not found
- `RENDER_MANIFEST_STATUS_CONFLICT` — Render manifest status conflict
- `LIVE_EXPORT_BLOCKED` — Live export channel blocked
- `LIVE_RENDER_BLOCKED` — Live render mode blocked
- `ANSWER_KEY_LEAKAGE` — Answer key field detected
- `RUBRIC_LEAKAGE` — Rubric field detected
- `RAW_STUDENT_ANSWER_LEAKAGE` — Raw student answer detected
- `TEACHER_ONLY_LEAKAGE` — Teacher-only field detected
- `HIDDEN_REASONING_LEAKAGE` — Hidden reasoning field detected
- `UNRELEASED_GRADE_LEAKAGE` — Unreleased grade field detected
- `PORTAL_PAYLOAD_LEAKAGE` — Portal payload detected
- `NOTIFICATION_PAYLOAD_LEAKAGE` — Notification payload detected
- `PDF_PAYLOAD_LEAKAGE` — PDF payload detected
- `RAW_MASTERY_DELTA_LEAKAGE` — Raw mastery delta detected
- `AI_NARRATIVE_DEFERRED` — AI narrative not implemented
- `OCR_DEFERRED` — OCR not implemented
- `PARENT_NOTIFICATION_DEFERRED` — Parent notification not implemented
- `STUDENT_NOTIFICATION_DEFERRED` — Student notification not implemented
- `PDF_EXPORT_DEFERRED` — PDF export not implemented
- `EXTERNAL_SYNC_DEFERRED` — External sync not implemented
- `PORTAL_PUBLISHING_DEFERRED` — Portal publishing not implemented
- `UNKNOWN_SECTION_TYPE` — Unknown section type
- `UNKNOWN_AUDIENCE_TYPE` — Unknown audience type
- `UNKNOWN_SAFE_ERROR` — Unexpected error

## Forbidden Leakage Rules

- No route returns answer keys, rubric internals, raw student answers, teacher-only notes, hidden reasoning, unreleased grades, delivery payloads, portal payloads, notification payloads, PDF binaries, mastery deltas, AI narratives, or OCR text in student/parent projections
- No route sends notifications
- No route publishes to portals
- No route generates PDF exports
- No route performs OCR
- No route calls AI providers
- No route syncs with external school systems
- No route changes marking scores or overwrites result versions
- No route exposes provider secrets or API keys

## No-PDF Behavior

- No route returns PDF binary, PDF buffer, or PDF base64 in any response
- Render manifests describe intended layout only; `renderMode` cannot be `pdf_live` — returns `LIVE_RENDER_BLOCKED`
- Export intents use `pdf_export_future` channel — attempting `pdf_export_live` returns `LIVE_EXPORT_BLOCKED`

## No-Live-Delivery Behavior

- Any request with a `*_live` export channel returns `LIVE_EXPORT_BLOCKED`
- Any request with a `*_live` render mode returns `LIVE_RENDER_BLOCKED`
- All delivery channels are referenced as provenance only (Package 12 receipts)

## Deferred Behavior

- Real PDF generation
- Real portal publication
- Real notification sending
- External school system sync
- AI narrative generation
- OCR processing
- Frontend integration

---

## Templates (6 Routes)

### POST /templates

| Property | Value |
|----------|-------|
| **Purpose** | Create a new report card template |
| **Request body** | `{ templateKey, templateName, templateAudience, templatePurpose, safeTemplateSummary }` |
| **Response envelope** | SafeEnvelope with template data |
| **Idempotency** | Required (`x-idempotency-key` header) |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin, system_job |
| **Error codes** | `SCHOOL_CONTEXT_REQUIRED`, `VALIDATION_FAILED`, `POLICY_BLOCKED`, `IDEMPOTENCY_CONFLICT` |
| **Leakage** | safeTemplateSummary must not contain forbidden fields |
| **Deferred** | None |

### GET /templates

| Property | Value |
|----------|-------|
| **Purpose** | List all templates for the school |
| **Response envelope** | SafeEnvelope with template array |
| **School context** | Required |
| **Error codes** | `SCHOOL_CONTEXT_REQUIRED` |

### GET /templates/:resultReportCardTemplateId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific template by ID |
| **Response envelope** | SafeEnvelope with template data |
| **School context** | Required |
| **Error codes** | `TEMPLATE_NOT_FOUND` |

### POST /templates/:resultReportCardTemplateId/activate

| Property | Value |
|----------|-------|
| **Purpose** | Activate a template (draft -> active) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with updated template |
| **Idempotency** | Recommended |
| **Error codes** | `TEMPLATE_NOT_FOUND`, `TEMPLATE_STATUS_CONFLICT`, `TEMPLATE_ALREADY_ACTIVE` |

### POST /templates/:resultReportCardTemplateId/disable

| Property | Value |
|----------|-------|
| **Purpose** | Disable an active template (active -> disabled) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with updated template |
| **Idempotency** | Recommended |
| **Error codes** | `TEMPLATE_NOT_FOUND`, `TEMPLATE_STATUS_CONFLICT`, `TEMPLATE_NOT_ACTIVE` |

### POST /templates/:resultReportCardTemplateId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void a template (any non-void -> void) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with updated template |
| **Idempotency** | Recommended |
| **Error codes** | `TEMPLATE_NOT_FOUND`, `TEMPLATE_STATUS_CONFLICT` |

---

## Template Versions (6 Routes)

### POST /templates/:resultReportCardTemplateId/versions

| Property | Value |
|----------|-------|
| **Purpose** | Create a new template version |
| **Request body** | `{ templateVersion, layoutMode, sectionSchemaJson?, allowedSectionTypesJson?, blockedFieldNamesJson?, redactionRulesJson?, safeVersionSummary }` |
| **Response envelope** | SafeEnvelope with version data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin, system_job |
| **Error codes** | `TEMPLATE_NOT_FOUND`, `VALIDATION_FAILED`, `IDEMPOTENCY_CONFLICT` |
| **Leakage** | safeVersionSummary must not contain forbidden fields |

### GET /templates/:resultReportCardTemplateId/versions

| Property | Value |
|----------|-------|
| **Purpose** | List versions for a template |
| **Response envelope** | SafeEnvelope with version array |
| **School context** | Required |
| **Error codes** | `TEMPLATE_NOT_FOUND` |

### GET /template-versions/:resultReportCardTemplateVersionId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific template version by ID |
| **Response envelope** | SafeEnvelope with version data |
| **School context** | Required |
| **Error codes** | `TEMPLATE_VERSION_NOT_FOUND` |

### POST /template-versions/:resultReportCardTemplateVersionId/activate

| Property | Value |
|----------|-------|
| **Purpose** | Activate a template version (draft -> active) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with updated version |
| **Idempotency** | Recommended |
| **Error codes** | `TEMPLATE_VERSION_NOT_FOUND`, `TEMPLATE_VERSION_STATUS_CONFLICT` |

### POST /template-versions/:resultReportCardTemplateVersionId/retire

| Property | Value |
|----------|-------|
| **Purpose** | Retire an active template version (active -> retired) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with updated version |
| **Idempotency** | Recommended |
| **Error codes** | `TEMPLATE_VERSION_NOT_FOUND`, `TEMPLATE_VERSION_STATUS_CONFLICT` |

### POST /template-versions/:resultReportCardTemplateVersionId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void a template version (any non-void -> void) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with updated version |
| **Idempotency** | Recommended |
| **Error codes** | `TEMPLATE_VERSION_NOT_FOUND`, `TEMPLATE_VERSION_STATUS_CONFLICT` |

---

## Assemblies (12 Routes)

### POST /assemblies

| Property | Value |
|----------|-------|
| **Purpose** | Create a report card assembly from a release packet |
| **Request body** | `{ resultReportCardTemplateId, resultReportCardTemplateVersionId, resultReleasePacketId, resultReleaseApprovalId, resultAudienceProjectionId, studentResultReportSnapshotId, parentSafeResultSummaryId?, studentSafeResultSummaryId?, resultDeliveryJobId?, resultDeliveryReceiptId?, resultFinalizationDecisionId, resultReleaseBoundaryId, resultLearningEvidenceBridgeId?, markingResultVersionId, studentRef, paperId, paperVersionId, deliverySessionId, assemblyMode, audienceType, safeReportTitle, safeReportSummary, sourceRefsJson?, allowedFieldsJson?, blockedFieldsJson? }` |
| **Response envelope** | SafeEnvelope with assembly data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin, system_job |
| **Error codes** | `VALIDATION_FAILED`, `POLICY_BLOCKED`, `IDEMPOTENCY_CONFLICT`, `TEMPLATE_NOT_FOUND`, `TEMPLATE_NOT_ACTIVE` |
| **Leakage** | safeReportTitle and safeReportSummary must not contain forbidden fields |
| **Deferred** | No notification, no portal publishing, no PDF |

### GET /assemblies

| Property | Value |
|----------|-------|
| **Purpose** | List all assemblies for the school |
| **Query** | `?status=X&studentRef=X` |
| **Response envelope** | SafeEnvelope with assembly preview array |
| **School context** | Required |
| **Error codes** | `SCHOOL_CONTEXT_REQUIRED` |

### GET /assemblies/:resultReportCardAssemblyId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific assembly by ID |
| **Response envelope** | SafeEnvelope with full assembly data (teacher/admin view) |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |
| **Leakage** | Returns safe fields only; forbidden fields filtered for student/parent audience |

### GET /students/:studentRef/assemblies

| Property | Value |
|----------|-------|
| **Purpose** | List assemblies for a specific student |
| **Response envelope** | SafeEnvelope with assembly preview array |
| **School context** | Required |
| **Error codes** | `SCHOOL_CONTEXT_REQUIRED` |
| **Roles** | teacher, lead_teacher, department_head, admin, student (own), parent (own child) |

### GET /release-packets/:resultReleasePacketId/assemblies

| Property | Value |
|----------|-------|
| **Purpose** | List assemblies created from a specific release packet |
| **Response envelope** | SafeEnvelope with assembly preview array |
| **School context** | Required |
| **Error codes** | `SCHOOL_CONTEXT_REQUIRED` |

### POST /assemblies/:resultReportCardAssemblyId/run-source-checks

| Property | Value |
|----------|-------|
| **Purpose** | Run source integrity checks on the assembly |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

### POST /assemblies/:resultReportCardAssemblyId/safety-checked

| Property | Value |
|----------|-------|
| **Purpose** | Mark assembly as safety-checked (forbidden field scan passed) |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

### POST /assemblies/:resultReportCardAssemblyId/seal

| Property | Value |
|----------|-------|
| **Purpose** | Seal an assembly (content frozen) |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

### POST /assemblies/:resultReportCardAssemblyId/ready-for-review

| Property | Value |
|----------|-------|
| **Purpose** | Mark assembly ready for review |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

### POST /assemblies/:resultReportCardAssemblyId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block an assembly (non-terminal) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

### POST /assemblies/:resultReportCardAssemblyId/cancel

| Property | Value |
|----------|-------|
| **Purpose** | Cancel an assembly (non-terminal) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

### POST /assemblies/:resultReportCardAssemblyId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void an assembly (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `ASSEMBLY_STATUS_CONFLICT` |

---

## Sections (6 Routes)

### POST /assemblies/:resultReportCardAssemblyId/sections

| Property | Value |
|----------|-------|
| **Purpose** | Compose a section in an assembly (per section type) |
| **Request body** | `{ sectionKey, sectionType, sectionOrder, safeHeading, safeSummary, safeBodyJson?, sourceRefsJson?, allowedFieldNamesJson?, blockedFieldNamesJson?, redactionRulesJson? }` |
| **sectionType switch** | `result_overview`, `strengths`, `growth_areas`, `objective_mastery`, `practice_next_steps`, `parent_support_guidance`, `student_reflection_prompt`, `teacher_review_note`, `admin_audit_summary`, `delivery_readiness_summary` |
| **Response envelope** | SafeEnvelope with section data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `VALIDATION_FAILED`, `UNKNOWN_SECTION_TYPE` |
| **Leakage** | safeHeading, safeSummary, safeBodyJson must not contain forbidden fields |

### GET /assemblies/:resultReportCardAssemblyId/sections

| Property | Value |
|----------|-------|
| **Purpose** | List all sections for an assembly |
| **Response envelope** | SafeEnvelope with section array |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |

### GET /sections/:resultReportCardSectionId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific section by ID |
| **Response envelope** | SafeEnvelope with section data |
| **School context** | Required |
| **Error codes** | `SECTION_NOT_FOUND` |

### POST /sections/:resultReportCardSectionId/seal

| Property | Value |
|----------|-------|
| **Purpose** | Seal a section (content frozen) |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `SECTION_NOT_FOUND`, `SECTION_STATUS_CONFLICT` |

### POST /sections/:resultReportCardSectionId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block a section (non-terminal) |
| **Roles** | admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `SECTION_NOT_FOUND`, `SECTION_STATUS_CONFLICT` |

### POST /sections/:resultReportCardSectionId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void a section (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `SECTION_NOT_FOUND`, `SECTION_STATUS_CONFLICT` |

---

## Evidence Links (6 Routes)

### POST /assemblies/:resultReportCardAssemblyId/evidence-links

| Property | Value |
|----------|-------|
| **Purpose** | Create an evidence link for an assembly |
| **Request body** | `{ resultReportCardSectionId?, sourceRecordType, sourceRecordId, sourcePackage, evidenceUse, safeEvidenceSummary, allowedUseJson?, blockedUseJson? }` |
| **sourcePackage** | `package_5_marking`, `package_9_result_governance`, `package_10_learning_evidence`, `package_11_result_release`, `package_12_result_delivery` |
| **Response envelope** | SafeEnvelope with evidence link data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `SECTION_NOT_FOUND`, `VALIDATION_FAILED`, `IDEMPOTENCY_CONFLICT` |
| **Leakage** | safeEvidenceSummary must not contain forbidden fields |

### GET /assemblies/:resultReportCardAssemblyId/evidence-links

| Property | Value |
|----------|-------|
| **Purpose** | List evidence links for an assembly |
| **Response envelope** | SafeEnvelope with evidence link array |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |

### GET /sections/:resultReportCardSectionId/evidence-links

| Property | Value |
|----------|-------|
| **Purpose** | List evidence links for a section |
| **Response envelope** | SafeEnvelope with evidence link array |
| **School context** | Required |
| **Error codes** | `SECTION_NOT_FOUND` |

### GET /evidence-links/:resultReportCardEvidenceLinkId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific evidence link by ID |
| **Response envelope** | SafeEnvelope with evidence link data |
| **School context** | Required |
| **Error codes** | `EVIDENCE_LINK_NOT_FOUND` |

### POST /evidence-links/:resultReportCardEvidenceLinkId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block an evidence link (non-terminal) |
| **Roles** | admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `EVIDENCE_LINK_NOT_FOUND`, `EVIDENCE_LINK_STATUS_CONFLICT` |

### POST /evidence-links/:resultReportCardEvidenceLinkId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void an evidence link (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `EVIDENCE_LINK_NOT_FOUND`, `EVIDENCE_LINK_STATUS_CONFLICT` |

---

## Audience Projections (6 Routes + 4 Projection Access = 10)

### POST /assemblies/:resultReportCardAssemblyId/audience-projections

| Property | Value |
|----------|-------|
| **Purpose** | Generate an audience projection for an assembly |
| **Request body** | `{ audienceType, safeProjectionJson?, safeProjectionSummary, allowedFieldNamesJson?, blockedFieldNamesJson?, redactionRulesJson? }` |
| **audienceType switch** | `teacher`, `admin`, `student`, `parent` |
| **Response envelope** | SafeEnvelope with projection data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `VALIDATION_FAILED`, `UNKNOWN_AUDIENCE_TYPE` |
| **Leakage** | Student/parent projections must not contain forbidden fields |
| **Deferred** | No portal publishing |

### GET /assemblies/:resultReportCardAssemblyId/audience-projections

| Property | Value |
|----------|-------|
| **Purpose** | List audience projections for an assembly |
| **Response envelope** | SafeEnvelope with projection array |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |

### GET /audience-projections/:resultReportCardAudienceProjectionId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific audience projection by ID |
| **Response envelope** | SafeEnvelope with projection data |
| **School context** | Required |
| **Error codes** | `PROJECTION_NOT_FOUND` |

### POST /audience-projections/:resultReportCardAudienceProjectionId/seal

| Property | Value |
|----------|-------|
| **Purpose** | Seal an audience projection (content frozen) |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `PROJECTION_NOT_FOUND`, `PROJECTION_STATUS_CONFLICT` |

### POST /audience-projections/:resultReportCardAudienceProjectionId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block an audience projection (non-terminal) |
| **Roles** | admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `PROJECTION_NOT_FOUND`, `PROJECTION_STATUS_CONFLICT` |

### POST /audience-projections/:resultReportCardAudienceProjectionId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void an audience projection (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `PROJECTION_NOT_FOUND`, `PROJECTION_STATUS_CONFLICT` |

### GET /assemblies/:resultReportCardAssemblyId/projection/teacher

| Property | Value |
|----------|-------|
| **Purpose** | Teacher-safe projection of assembly (full operational data) |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |
| **Leakage** | No forbidden field redaction (teacher-level access) |

### GET /assemblies/:resultReportCardAssemblyId/projection/admin

| Property | Value |
|----------|-------|
| **Purpose** | Admin projection with aggregate summaries |
| **School context** | Required |
| **Roles** | admin, system_job |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |
| **Leakage** | Full access |

### GET /assemblies/:resultReportCardAssemblyId/projection/student-safe

| Property | Value |
|----------|-------|
| **Purpose** | Student-safe projection (forbidden fields redacted) |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin (generates safe view for student) |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |
| **Leakage** | Forbidden fields (answer keys, rubrics, raw answers, hidden reasoning, unreleased grades, delivery/portal/notification/PDF payloads, mastery deltas, AI narratives, OCR text) redacted |

### GET /assemblies/:resultReportCardAssemblyId/projection/parent-boundary

| Property | Value |
|----------|-------|
| **Purpose** | Parent-boundary projection (scores, answer keys, rubrics, teacher-only notes redacted) |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin (generates parent-safe view) |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |
| **Leakage** | Only parent-safe fields returned; scores, answer keys, rubrics, teacher-only notes, delivery payloads redacted |

---

## Reviews (8 Routes)

### POST /assemblies/:resultReportCardAssemblyId/reviews

| Property | Value |
|----------|-------|
| **Purpose** | Create a review for an assembly |
| **Request body** | `{ resultReportCardAudienceProjectionId?, reviewType, safeReviewSummary, reasonCodesJson? }` |
| **Response envelope** | SafeEnvelope with review data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `VALIDATION_FAILED`, `IDEMPOTENCY_CONFLICT` |
| **Leakage** | safeReviewSummary must not contain forbidden fields |

### GET /assemblies/:resultReportCardAssemblyId/reviews

| Property | Value |
|----------|-------|
| **Purpose** | List reviews for an assembly |
| **Response envelope** | SafeEnvelope with review array |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |

### GET /reviews/:resultReportCardReviewId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific review by ID |
| **Response envelope** | SafeEnvelope with review data |
| **School context** | Required |
| **Error codes** | `REVIEW_NOT_FOUND` |

### POST /reviews/:resultReportCardReviewId/start

| Property | Value |
|----------|-------|
| **Purpose** | Start a review (draft -> in_review) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `REVIEW_NOT_FOUND`, `REVIEW_STATUS_CONFLICT`, `REVIEW_ROLE_BLOCKED` |

### POST /reviews/:resultReportCardReviewId/approve-for-export-intent

| Property | Value |
|----------|-------|
| **Purpose** | Approve review for export intent (in_review -> approved) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `REVIEW_NOT_FOUND`, `REVIEW_STATUS_CONFLICT`, `REVIEW_ROLE_BLOCKED` |
| **Behavior** | Also transitions linked assembly to `approved_for_export_intent` |

### POST /reviews/:resultReportCardReviewId/request-revision

| Property | Value |
|----------|-------|
| **Purpose** | Request revision (in_review -> draft, resets for revision) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `REVIEW_NOT_FOUND`, `REVIEW_STATUS_CONFLICT`, `REVIEW_ROLE_BLOCKED` |

### POST /reviews/:resultReportCardReviewId/reject

| Property | Value |
|----------|-------|
| **Purpose** | Reject review (in_review -> rejected) |
| **Roles** | teacher, lead_teacher, department_head, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `REVIEW_NOT_FOUND`, `REVIEW_STATUS_CONFLICT`, `REVIEW_ROLE_BLOCKED` |

### POST /reviews/:resultReportCardReviewId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block a review (non-terminal) |
| **Roles** | admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `REVIEW_NOT_FOUND`, `REVIEW_STATUS_CONFLICT` |

### POST /reviews/:resultReportCardReviewId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void a review (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `REVIEW_NOT_FOUND`, `REVIEW_STATUS_CONFLICT` |

---

## Export Intents (6 Routes)

### POST /assemblies/:resultReportCardAssemblyId/export-intents

| Property | Value |
|----------|-------|
| **Purpose** | Create an export intent (deferred export plan) |
| **Request body** | `{ resultReportCardReviewId, resultReportCardAudienceProjectionId, exportChannel, exportMode, safeExportIntentSummary, blockedReasonCodesJson?, sourceRefsJson? }` |
| **exportChannel** | Must be `*_future` suffixed |
| **exportMode** | `intent_only`, `preflight_only`, `mock_export_only` |
| **Response envelope** | SafeEnvelope with export intent data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `REVIEW_NOT_FOUND`, `VALIDATION_FAILED`, `LIVE_EXPORT_BLOCKED` (if `*_live` channel), `IDEMPOTENCY_CONFLICT` |
| **Deferred** | All channels are `_future`; no actual export occurs |

### GET /assemblies/:resultReportCardAssemblyId/export-intents

| Property | Value |
|----------|-------|
| **Purpose** | List export intents for an assembly |
| **Response envelope** | SafeEnvelope with export intent preview array |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |

### GET /export-intents/:resultReportCardExportIntentId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific export intent by ID |
| **Response envelope** | SafeEnvelope with export intent data |
| **School context** | Required |
| **Error codes** | `EXPORT_INTENT_NOT_FOUND` |

### POST /export-intents/:resultReportCardExportIntentId/eligible

| Property | Value |
|----------|-------|
| **Purpose** | Mark export intent as eligible for future export (draft -> eligible_for_future_export) |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `EXPORT_INTENT_NOT_FOUND`, `EXPORT_INTENT_STATUS_CONFLICT` |
| **Deferred** | No actual export occurs |

### POST /export-intents/:resultReportCardExportIntentId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block an export intent (non-terminal) |
| **Roles** | admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `EXPORT_INTENT_NOT_FOUND`, `EXPORT_INTENT_STATUS_CONFLICT` |

### POST /export-intents/:resultReportCardExportIntentId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void an export intent (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `EXPORT_INTENT_NOT_FOUND`, `EXPORT_INTENT_STATUS_CONFLICT` |

---

## Render Manifests (6 Routes)

### POST /assemblies/:resultReportCardAssemblyId/render-manifests

| Property | Value |
|----------|-------|
| **Purpose** | Create a render manifest (preview-only description of how to render) |
| **Request body** | `{ resultReportCardTemplateVersionId, renderMode, safeManifestSummary, layoutJson?, sectionOrderJson?, assetRefsJson?, blockedFieldNamesJson? }` |
| **renderMode** | Must be `preview_only`, `future_pdf_ready`, `future_portal_ready`, or `future_print_ready` |
| **Response envelope** | SafeEnvelope with manifest data |
| **Idempotency** | Required |
| **School context** | Required |
| **Roles** | teacher, admin |
| **Error codes** | `ASSEMBLY_NOT_FOUND`, `TEMPLATE_VERSION_NOT_FOUND`, `VALIDATION_FAILED`, `LIVE_RENDER_BLOCKED` (if `*_live` mode), `IDEMPOTENCY_CONFLICT` |
| **Deferred** | No actual PDF/portal rendering occurs |

### GET /assemblies/:resultReportCardAssemblyId/render-manifests

| Property | Value |
|----------|-------|
| **Purpose** | List render manifests for an assembly |
| **Response envelope** | SafeEnvelope with manifest array |
| **School context** | Required |
| **Error codes** | `ASSEMBLY_NOT_FOUND` |

### GET /render-manifests/:resultReportCardRenderManifestId

| Property | Value |
|----------|-------|
| **Purpose** | Get a specific render manifest by ID |
| **Response envelope** | SafeEnvelope with manifest data |
| **School context** | Required |
| **Error codes** | `RENDER_MANIFEST_NOT_FOUND` |

### POST /render-manifests/:resultReportCardRenderManifestId/seal

| Property | Value |
|----------|-------|
| **Purpose** | Seal a render manifest (content frozen) |
| **Roles** | teacher, admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `RENDER_MANIFEST_NOT_FOUND`, `RENDER_MANIFEST_STATUS_CONFLICT` |

### POST /render-manifests/:resultReportCardRenderManifestId/block

| Property | Value |
|----------|-------|
| **Purpose** | Block a render manifest (non-terminal) |
| **Roles** | admin |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `RENDER_MANIFEST_NOT_FOUND`, `RENDER_MANIFEST_STATUS_CONFLICT` |

### POST /render-manifests/:resultReportCardRenderManifestId/void

| Property | Value |
|----------|-------|
| **Purpose** | Void a render manifest (terminal) |
| **Roles** | admin, system_job |
| **Response envelope** | SafeEnvelope with status update |
| **Idempotency** | Recommended |
| **Error codes** | `RENDER_MANIFEST_NOT_FOUND`, `RENDER_MANIFEST_STATUS_CONFLICT` |

---

## Route Summary

| Section | Routes |
|---------|--------|
| Templates | 6 |
| Template Versions | 6 |
| Assemblies | 12 |
| Sections | 6 |
| Evidence Links | 6 |
| Audience Projections | 6 |
| Projection Access | 4 |
| Reviews | 9 (8 listed + void counted in review lifecycle) |
| Export Intents | 6 |
| Render Manifests | 6 |
| **Total** | **67** |
