# Package 11 - Route Contract

## Mount Point

```
/api/question-bank/result-release
```

Middleware: `schoolAuthMiddleware`, `requireVerifiedSchoolContext`

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
  policyDecision?: ResultReleasePolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}
```

## Safe Error Codes

- `AUTH_REQUIRED` – Authentication required
- `SCHOOL_CONTEXT_REQUIRED` – School ID not found
- `VALIDATION_FAILED` – Request body validation failed
- `POLICY_BLOCKED` – Policy evaluation denied the operation
- `POLICY_ALLOWED` – Policy evaluation allowed
- `IDEMPOTENCY_CONFLICT` – Conflicting idempotency key
- `NOT_FOUND` – Resource not found
- `FORBIDDEN_FIELD` – Request contains forbidden field
- `FORBIDDEN` – Actor role not permitted
- `PACKET_NOT_FOUND` – Release packet not found
- `PACKET_STATUS_CONFLICT` – Packet status does not allow transition
- `PACKAGE_9_FINALIZATION_NOT_FOUND` – Finalization decision not found
- `PACKAGE_9_FINALIZATION_NOT_APPROVED` – Finalization not approved
- `PACKAGE_9_RELEASE_READINESS_NOT_FOUND` – Release readiness not found
- `PACKAGE_9_BOUNDARY_NOT_FOUND` – Release boundary not found
- `PACKAGE_5_RESULT_NOT_FOUND` – Marking result version not found
- `REGRADE_REQUEST_UNRESOLVED` – Unresolved regrade request blocks packet
- `BOUNDARY_ENFORCEMENT_FAILED` – Boundary enforcement rejected the packet
- `APPROVAL_NOT_FOUND` – Approval record not found
- `APPROVAL_STATUS_CONFLICT` – Approval status does not allow transition
- `APPROVAL_ROLE_BLOCKED` – Actor role cannot approve
- `PROJECTION_NOT_FOUND` – Audience projection not found
- `PROJECTION_STATUS_CONFLICT` – Projection status conflict
- `SNAPSHOT_NOT_FOUND` – Report snapshot not found
- `SNAPSHOT_STATUS_CONFLICT` – Snapshot status conflict
- `PARENT_SUMMARY_NOT_FOUND` – Parent safe summary not found
- `STUDENT_SUMMARY_NOT_FOUND` – Student safe summary not found
- `SUMMARY_STATUS_CONFLICT` – Summary status conflict
- `DELIVERY_INTENT_NOT_FOUND` – Delivery intent not found
- `DELIVERY_INTENT_STATUS_CONFLICT` – Intent status conflict
- `ANSWER_KEY_LEAKAGE` – Answer key field detected in payload
- `RUBRIC_LEAKAGE` – Rubric field detected in payload
- `RAW_STUDENT_ANSWER_LEAKAGE` – Raw student answer detected
- `TEACHER_ONLY_LEAKAGE` – Teacher-only field detected
- `HIDDEN_REASONING_LEAKAGE` – Hidden reasoning field detected
- `UNRELEASED_GRADE_LEAKAGE` – Unreleased grade field detected
- `PARENT_DELIVERY_PAYLOAD_LEAKAGE` – Parent delivery payload detected
- `STUDENT_DELIVERY_PAYLOAD_LEAKAGE` – Student delivery payload detected
- `PORTAL_PAYLOAD_LEAKAGE` – Portal payload detected
- `NOTIFICATION_PAYLOAD_LEAKAGE` – Notification payload detected
- `PDF_PAYLOAD_LEAKAGE` – PDF payload detected
- `RAW_MASTERY_DELTA_LEAKAGE` – Raw mastery delta detected
- `PARENT_NOTIFICATION_DEFERRED` – Parent notification not implemented
- `STUDENT_NOTIFICATION_DEFERRED` – Student notification not implemented
- `PORTAL_PUBLISHING_DEFERRED` – Portal publishing not implemented
- `PDF_EXPORT_DEFERRED` – PDF export not implemented
- `AI_NARRATIVE_DEFERRED` – AI narrative not implemented
- `EXTERNAL_SYNC_DEFERRED` – External school sync not implemented
- `OCR_DEFERRED` – OCR not implemented
- `UNKNOWN_SAFE_ERROR` – Unexpected error

## Forbidden Leakage Rules

- No route returns answer keys, rubric internals, raw student answers, hidden reasoning, teacher-only notes, unreleased grades, parent delivery payloads, student delivery payloads, portal payloads, notification payloads, PDF payloads, or raw mastery deltas in student/parent projections.
- No route sends parent notifications.
- No route sends student notifications.
- No route publishes to parent or student portal.
- No route generates PDF exports.
- No route performs OCR.
- No route calls AI providers.
- No route syncs with external school systems.
- No route changes marking scores or overwrites result versions.

## Packet Routes (9 Endpoints)

### POST /packets

- **Purpose**: Create a release packet from a finalized marking result
- **Body**: `{ resultFinalizationDecisionId, resultReleaseReadinessId, resultReleaseBoundaryId, resultLearningEvidenceBridgeId?, markingResultVersionId, studentRef, paperId?, paperVersionId?, deliverySessionId?, packetAudience, packetMode, safePacketSummary, allowedFieldsJson?, blockedFieldsJson?, sourceRefsJson? }`
- **Response**: SafeResponseEnvelope with packet data
- **Idempotency**: Required (`x-idempotency-key` header)
- **School context**: Required
- **Roles**: teacher, lead_teacher, department_head, admin, system_job
- **Error codes**: `SCHOOL_CONTEXT_REQUIRED`, `VALIDATION_FAILED`, `POLICY_BLOCKED`, `IDEMPOTENCY_CONFLICT`, `PACKAGE_9_FINALIZATION_NOT_FOUND`, `PACKAGE_9_FINALIZATION_NOT_APPROVED`, `PACKAGE_9_RELEASE_READINESS_NOT_FOUND`, `PACKAGE_9_BOUNDARY_NOT_FOUND`, `PACKAGE_5_RESULT_NOT_FOUND`, `REGRADE_REQUEST_UNRESOLVED`
- **Leakage**: Must not leak raw scores, answer keys, or unreleased grades in safePacketSummary
- **Deferred**: No notification sent, no portal publishing

### GET /packets/:resultReleasePacketId

- **Purpose**: Get release packet by ID
- **Response**: SafeResponseEnvelope with packet (teacher/admin view)
- **School context**: Required
- **Error codes**: `NOT_FOUND`
- **Leakage**: Returns safe fields only; forbidden fields redacted for student/parent audience
- **Deferred**: None

### GET /packets

- **Purpose**: List release packets for the school, optionally filtered by studentRef
- **Query**: `?studentRef=X`
- **Response**: SafeResponseEnvelope with packet array
- **School context**: Required
- **Error codes**: `SCHOOL_CONTEXT_REQUIRED`

### POST /packets/:resultReleasePacketId/run-source-checks

- **Purpose**: Run source integrity checks on the packet (verify references, regrade status)
- **Roles**: teacher, admin
- **Response**: SafeResponseEnvelope with status update
- **Idempotency**: Recommended
- **Error codes**: `PACKET_NOT_FOUND`, `PACKET_STATUS_CONFLICT`, `REGRADE_REQUEST_UNRESOLVED`

### POST /packets/:resultReleasePacketId/boundary-checked

- **Purpose**: Mark packet as boundary-checked (audience boundaries enforced)
- **Roles**: teacher, admin
- **Response**: SafeResponseEnvelope with status update
- **Error codes**: `PACKET_NOT_FOUND`, `PACKET_STATUS_CONFLICT`, `BOUNDARY_ENFORCEMENT_FAILED`

### POST /packets/:resultReleasePacketId/ready-for-approval

- **Purpose**: Mark packet ready for release approval
- **Roles**: teacher, admin
- **Response**: SafeResponseEnvelope with status update
- **Error codes**: `PACKET_NOT_FOUND`, `PACKET_STATUS_CONFLICT`

### POST /packets/:resultReleasePacketId/block

- **Purpose**: Block release packet (non-terminal for packet, terminal for this workflow path)
- **Roles**: teacher, lead_teacher, department_head, admin
- **Response**: SafeResponseEnvelope with status update
- **Error codes**: `PACKET_NOT_FOUND`, `PACKET_STATUS_CONFLICT`

### POST /packets/:resultReleasePacketId/cancel

- **Purpose**: Cancel release packet (non-terminal for packet, terminal for this workflow path)
- **Roles**: teacher, lead_teacher, department_head, admin
- **Response**: SafeResponseEnvelope with status update
- **Error codes**: `PACKET_NOT_FOUND`, `PACKET_STATUS_CONFLICT`

### POST /packets/:resultReleasePacketId/void

- **Purpose**: Void release packet (terminal)
- **Roles**: admin, system_job
- **Response**: SafeResponseEnvelope with status update
- **Error codes**: `PACKET_NOT_FOUND`, `PACKET_STATUS_CONFLICT`

## Approval Routes (7 Endpoints)

### POST /packets/:resultReleasePacketId/approvals

- **Purpose**: Create a release approval for a packet
- **Body**: `{ resultFinalizationDecisionId, studentRef, approvalType, approvedAudience, safeApprovalSummary, reasonCodesJson? }`
- **Idempotency**: Required
- **School context**: Required
- **Roles**: teacher, lead_teacher, department_head, admin, system_job
- **Error codes**: `PACKET_NOT_FOUND`, `PACKAGE_9_FINALIZATION_NOT_FOUND`, `POLICY_BLOCKED`

### GET /approvals/:resultReleaseApprovalId

- **Purpose**: Get approval by ID
- **School context**: Required
- **Error codes**: `APPROVAL_NOT_FOUND`

### GET /packets/:resultReleasePacketId/approvals

- **Purpose**: List approvals for a packet
- **School context**: Required

### POST /approvals/:resultReleaseApprovalId/approve

- **Purpose**: Approve release packet (transitions packet to approved_for_internal_release)
- **Roles**: teacher, lead_teacher, department_head, admin
- **Error codes**: `APPROVAL_NOT_FOUND`, `APPROVAL_STATUS_CONFLICT`, `APPROVAL_ROLE_BLOCKED`

### POST /approvals/:resultReleaseApprovalId/reject

- **Purpose**: Reject release approval
- **Roles**: teacher, lead_teacher, department_head, admin
- **Error codes**: `APPROVAL_NOT_FOUND`, `APPROVAL_STATUS_CONFLICT`

### POST /approvals/:resultReleaseApprovalId/block

- **Purpose**: Block release approval
- **Roles**: admin
- **Error codes**: `APPROVAL_NOT_FOUND`, `APPROVAL_STATUS_CONFLICT`

### POST /approvals/:resultReleaseApprovalId/void

- **Purpose**: Void release approval
- **Roles**: admin, system_job
- **Error codes**: `APPROVAL_NOT_FOUND`, `APPROVAL_STATUS_CONFLICT`

## Audience Projection Routes (5 Endpoints)

### POST /packets/:resultReleasePacketId/audience-projections

- **Purpose**: Generate an audience projection from a release packet
- **Body**: `{ audienceType, safeProjectionJson?, safeProjectionSummary, allowedFieldsJson?, blockedFieldsJson?, redactionRulesJson? }`
- **Idempotency**: Required
- **School context**: Required
- **Roles**: teacher, admin
- **Error codes**: `PACKET_NOT_FOUND`, `BOUNDARY_ENFORCEMENT_FAILED`, `FORBIDDEN_FIELD`
- **Leakage**: Must apply boundary allow/block lists; must not leak forbidden fields
- **Deferred**: No portal publishing

### GET /audience-projections/:resultAudienceProjectionId

- **Purpose**: Get audience projection by ID
- **School context**: Required
- **Error codes**: `PROJECTION_NOT_FOUND`

### GET /packets/:resultReleasePacketId/audience-projections

- **Purpose**: List audience projections for a packet
- **School context**: Required

### POST /audience-projections/:resultAudienceProjectionId/block

- **Purpose**: Block audience projection
- **Roles**: admin
- **Error codes**: `PROJECTION_NOT_FOUND`, `PROJECTION_STATUS_CONFLICT`

### POST /audience-projections/:resultAudienceProjectionId/void

- **Purpose**: Void audience projection
- **Roles**: admin, system_job
- **Error codes**: `PROJECTION_NOT_FOUND`, `PROJECTION_STATUS_CONFLICT`

## Report Snapshot Routes (6 Endpoints)

### POST /audience-projections/:resultAudienceProjectionId/report-snapshots

- **Purpose**: Create a student result report snapshot from an audience projection
- **Body**: `{ snapshotType, safeReportTitle, safeReportSummary, safeStrengthsJson?, safeGrowthAreasJson?, safeNextStepsJson?, safeSupportGuidanceJson?, sourceRefsJson? }`
- **Idempotency**: Required
- **School context**: Required
- **Roles**: teacher, admin
- **Error codes**: `PROJECTION_NOT_FOUND`, `VALIDATION_FAILED`
- **Leakage**: Must contain only safe fields; no scores, answer keys, or unreleased data
- **Deferred**: No portal publishing, no PDF export

### GET /report-snapshots/:studentResultReportSnapshotId

- **Purpose**: Get report snapshot by ID
- **School context**: Required
- **Error codes**: `SNAPSHOT_NOT_FOUND`

### GET /packets/:resultReleasePacketId/report-snapshots

- **Purpose**: List report snapshots for a packet
- **School context**: Required

### POST /report-snapshots/:studentResultReportSnapshotId/approve-internal

- **Purpose**: Approve report snapshot for internal use
- **Roles**: teacher, admin
- **Error codes**: `SNAPSHOT_NOT_FOUND`, `SNAPSHOT_STATUS_CONFLICT`

### POST /report-snapshots/:studentResultReportSnapshotId/block

- **Purpose**: Block report snapshot
- **Roles**: admin
- **Error codes**: `SNAPSHOT_NOT_FOUND`, `SNAPSHOT_STATUS_CONFLICT`

### POST /report-snapshots/:studentResultReportSnapshotId/void

- **Purpose**: Void report snapshot
- **Roles**: admin, system_job
- **Error codes**: `SNAPSHOT_NOT_FOUND`, `SNAPSHOT_STATUS_CONFLICT`

## Parent Safe Summary Routes (6 Endpoints)

### POST /audience-projections/:resultAudienceProjectionId/parent-safe-summaries

- **Purpose**: Generate a parent-safe summary from an audience projection
- **Body**: `{ safeProgressSummary, safeSupportSummary, safeStrengthsJson?, safeGrowthAreasJson?, safeRecommendedSupportJson?, notYetReleasedReason?, allowedFieldNamesJson?, blockedFieldNamesJson? }`
- **Idempotency**: Required
- **School context**: Required
- **Roles**: teacher, admin
- **Error codes**: `PROJECTION_NOT_FOUND`, `VALIDATION_FAILED`
- **Leakage**: Must not contain scores, answer keys, raw mastery deltas, or unreleased grades
- **Deferred**: No parent notification sent, no portal publishing

### GET /parent-safe-summaries/:parentSafeResultSummaryId

- **Purpose**: Get parent safe summary by ID
- **School context**: Required
- **Error codes**: `PARENT_SUMMARY_NOT_FOUND`

### GET /packets/:resultReleasePacketId/parent-safe-summaries

- **Purpose**: List parent safe summaries for a packet
- **School context**: Required

### POST /parent-safe-summaries/:parentSafeResultSummaryId/approve-future-delivery

- **Purpose**: Approve parent safe summary for future delivery (no actual delivery)
- **Roles**: teacher, admin
- **Error codes**: `PARENT_SUMMARY_NOT_FOUND`, `SUMMARY_STATUS_CONFLICT`
- **Deferred**: No delivery occurs

### POST /parent-safe-summaries/:parentSafeResultSummaryId/block

- **Purpose**: Block parent safe summary
- **Roles**: admin
- **Error codes**: `PARENT_SUMMARY_NOT_FOUND`, `SUMMARY_STATUS_CONFLICT`

### POST /parent-safe-summaries/:parentSafeResultSummaryId/void

- **Purpose**: Void parent safe summary
- **Roles**: admin, system_job
- **Error codes**: `PARENT_SUMMARY_NOT_FOUND`, `SUMMARY_STATUS_CONFLICT`

## Student Safe Summary Routes (6 Endpoints)

### POST /audience-projections/:resultAudienceProjectionId/student-safe-summaries

- **Purpose**: Generate a student-safe summary from an audience projection
- **Body**: `{ safeAchievementSummary, safeLearningProgressSummary, safeNextPracticeSummary, safeConfidenceGuidanceJson?, safeRevisionGuidanceJson?, allowedFieldNamesJson?, blockedFieldNamesJson? }`
- **Idempotency**: Required
- **School context**: Required
- **Roles**: teacher, admin
- **Error codes**: `PROJECTION_NOT_FOUND`, `VALIDATION_FAILED`
- **Leakage**: Must not contain scores, answer keys, rubric internals, or unreleased grades
- **Deferred**: No student notification sent, no portal publishing

### GET /student-safe-summaries/:studentSafeResultSummaryId

- **Purpose**: Get student safe summary by ID
- **School context**: Required
- **Error codes**: `STUDENT_SUMMARY_NOT_FOUND`

### GET /packets/:resultReleasePacketId/student-safe-summaries

- **Purpose**: List student safe summaries for a packet
- **School context**: Required

### POST /student-safe-summaries/:studentSafeResultSummaryId/approve-future-delivery

- **Purpose**: Approve student safe summary for future delivery (no actual delivery)
- **Roles**: teacher, admin
- **Error codes**: `STUDENT_SUMMARY_NOT_FOUND`, `SUMMARY_STATUS_CONFLICT`
- **Deferred**: No delivery occurs

### POST /student-safe-summaries/:studentSafeResultSummaryId/block

- **Purpose**: Block student safe summary
- **Roles**: admin
- **Error codes**: `STUDENT_SUMMARY_NOT_FOUND`, `SUMMARY_STATUS_CONFLICT`

### POST /student-safe-summaries/:studentSafeResultSummaryId/void

- **Purpose**: Void student safe summary
- **Roles**: admin, system_job
- **Error codes**: `STUDENT_SUMMARY_NOT_FOUND`, `SUMMARY_STATUS_CONFLICT`

## Delivery Intent Routes (6 Endpoints)

### POST /packets/:resultReleasePacketId/delivery-intents

- **Purpose**: Create a delivery intent (deferred delivery plan)
- **Body**: `{ resultReleaseApprovalId, studentRef, audienceType, deliveryChannel, safeIntentSummary, blockedReasonCodesJson? }`
- **Idempotency**: Required
- **School context**: Required
- **Roles**: teacher, admin
- **Error codes**: `PACKET_NOT_FOUND`, `APPROVAL_NOT_FOUND`, `VALIDATION_FAILED`
- **Deferred**: All channels are `_future`; no actual delivery occurs

### GET /delivery-intents/:resultReleaseDeliveryIntentId

- **Purpose**: Get delivery intent by ID
- **School context**: Required
- **Error codes**: `DELIVERY_INTENT_NOT_FOUND`

### GET /packets/:resultReleasePacketId/delivery-intents

- **Purpose**: List delivery intents for a packet
- **School context**: Required

### POST /delivery-intents/:resultReleaseDeliveryIntentId/eligible

- **Purpose**: Mark delivery intent as eligible for future delivery
- **Roles**: teacher, admin
- **Error codes**: `DELIVERY_INTENT_NOT_FOUND`, `DELIVERY_INTENT_STATUS_CONFLICT`

### POST /delivery-intents/:resultReleaseDeliveryIntentId/block

- **Purpose**: Block delivery intent
- **Roles**: admin
- **Error codes**: `DELIVERY_INTENT_NOT_FOUND`, `DELIVERY_INTENT_STATUS_CONFLICT`

### POST /delivery-intents/:resultReleaseDeliveryIntentId/void

- **Purpose**: Void delivery intent
- **Roles**: admin, system_job
- **Error codes**: `DELIVERY_INTENT_NOT_FOUND`, `DELIVERY_INTENT_STATUS_CONFLICT`

## Projection Safety Routes (4 Endpoints)

### GET /packets/:resultReleasePacketId/projection/teacher

- **Purpose**: Teacher-safe projection of release packet and related records
- **School context**: Required
- **Response**: SafeResponseEnvelope with full operational data
- **Roles**: teacher, lead_teacher, department_head, admin
- **Error codes**: `PACKET_NOT_FOUND`

### GET /packets/:resultReleasePacketId/projection/admin

- **Purpose**: Admin projection with aggregate counts and operational summaries
- **School context**: Required
- **Roles**: admin, system_job
- **Error codes**: `PACKET_NOT_FOUND`

### GET /packets/:resultReleasePacketId/projection/student-safe

- **Purpose**: Student-safe projection (excludes answer keys, rubric internals, raw student answers, hidden reasoning, unreleased grades, parent/report payloads, notification payloads, PDF payloads, raw mastery deltas)
- **School context**: Required
- **Roles**: teacher, lead_teacher, department_head, admin (returns safe projection suitable for student viewing)
- **Error codes**: `PACKET_NOT_FOUND`
- **Leakage**: Forbidden fields redacted; only safe fields returned

### GET /packets/:resultReleasePacketId/projection/parent-boundary

- **Purpose**: Parent-boundary projection (excludes scores, answer keys, raw rubrics, teacher-only notes, delivery payloads)
- **School context**: Required
- **Roles**: teacher, lead_teacher, department_head, admin (returns parent-safe projection)
- **Error codes**: `PACKET_NOT_FOUND`
- **Leakage**: Only parent-safe fields returned; forbidden fields redacted
