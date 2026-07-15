# Package 17: Route Contract — Result Recovery Planner

## Mount

```
Path: /api/question-bank/result-recovery
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

## School Context Behavior

All routes require a verified school context via `schoolAuthMiddleware`. The school ID is extracted from the verified context and used for all scoped queries. If school context is missing, `403 MISSING_SCHOOL_CONTEXT` is returned. If the school context does not match the resource's school, `403 SCHOOL_MISMATCH` is returned.

## Role Behavior

| Role | Plans | Objectives | Steps | Practice Drafts | Resource Recs | Teacher Packets | Student Support | Parent Support | Checkpoints | Summaries |
|------|-------|-----------|-------|----------------|---------------|-----------------|-----------------|----------------|-------------|-----------|
| teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| lead_teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| department_head | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| admin | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| system_job | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| student | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| parent | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| guest | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| unknown | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

## Forbidden Leakage Rules (All Routes)

No route may leak:
- answerKeySafeRef, answerKeyText, correctAnswerSummary
- rubricInternal, rubricText, rawRubric
- markingNotesTeacherOnly, teacherOnlyNotes
- hiddenReasoning, chainOfThought
- rawStudentAnswer
- unreleasedScore, unreleasedGrade
- scoreBeforeFinalization, finalGradeBeforeRelease
- diagnosis, medicalAssessment, psychologicalAssessment, legalAssessment
- riskLabelUnsafe, safeguardingDetailsUnsafe
- parentNotificationPayload, studentNotificationPayload, teacherNotificationPayload
- emailPayload, smsPayload, pushPayload, whatsAppPayload
- liveTaskPayload, liveAssignmentPayload, homeworkAssignmentPayload
- practiceAssignmentPayload, revisionTaskPayload
- calendarEventPayload, externalSyncPayload
- liveProviderPayload, apiKey, providerSecret
- aiNarrative, generatedNarrative, modelOutput
- generatedQuestionText, generatedAnswerKey
- ocrText
- pdfBinary, pdfBuffer, pdfBase64, htmlExport, htmlFile

## Route Endpoints

### Plans

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /plans | Create recovery plan | CreateRecoveryPlanInput | Returns existing if duplicate key |
| GET | /plans | List plans for school | query: status?, priority? | — |
| GET | /plans/:resultRecoveryPlanId | Get plan by ID | — | — |
| GET | /students/:studentRef/plans | List plans for student | — | — |
| POST | /plans/:resultRecoveryPlanId/review-ready | Mark plan review ready | UpdateRecoveryPlanStatusInput | Replays if duplicate key |
| POST | /plans/:resultRecoveryPlanId/approve | Approve for future use | UpdateRecoveryPlanStatusInput | Replays if duplicate key |
| POST | /plans/:resultRecoveryPlanId/suppress | Suppress plan | UpdateRecoveryPlanStatusInput | Replays if duplicate key |
| POST | /plans/:resultRecoveryPlanId/block | Block plan | UpdateRecoveryPlanStatusInput | Replays if duplicate key |
| POST | /plans/:resultRecoveryPlanId/void | Void plan | UpdateRecoveryPlanStatusInput | Replays if duplicate key |

### Objectives

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /plans/:resultRecoveryPlanId/objectives | Create recovery objective | CreateRecoveryObjectiveInput | Returns existing if duplicate key |
| GET | /plans/:resultRecoveryPlanId/objectives | List objectives for plan | query: status?, type? | — |
| GET | /objectives/:resultRecoveryObjectiveId | Get objective by ID | — | — |
| GET | /students/:studentRef/objectives | List objectives for student | query: status?, type? | — |
| POST | /objectives/:resultRecoveryObjectiveId/ready | Mark objective ready | UpdateRecoveryObjectiveStatusInput | Replays if duplicate key |
| POST | /objectives/:resultRecoveryObjectiveId/complete-mock | Complete mock | UpdateRecoveryObjectiveStatusInput | Replays if duplicate key |
| POST | /objectives/:resultRecoveryObjectiveId/suppress | Suppress objective | UpdateRecoveryObjectiveStatusInput | Replays if duplicate key |
| POST | /objectives/:resultRecoveryObjectiveId/void | Void objective | UpdateRecoveryObjectiveStatusInput | Replays if duplicate key |

### Steps

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /objectives/:resultRecoveryObjectiveId/steps | Create recovery step | CreateRecoveryStepInput | Returns existing if duplicate key |
| GET | /objectives/:resultRecoveryObjectiveId/steps | List steps for objective | query: status?, type? | — |
| GET | /steps/:resultRecoveryStepId | Get step by ID | — | — |
| GET | /plans/:resultRecoveryPlanId/steps | List steps for plan | — | — |
| GET | /students/:studentRef/steps | List steps for student | — | — |
| POST | /steps/:resultRecoveryStepId/review-ready | Mark step review ready | UpdateRecoveryStepStatusInput | Replays if duplicate key |
| POST | /steps/:resultRecoveryStepId/approve | Approve for future use | UpdateRecoveryStepStatusInput | Replays if duplicate key |
| POST | /steps/:resultRecoveryStepId/complete-mock | Complete mock | UpdateRecoveryStepStatusInput | Replays if duplicate key |
| POST | /steps/:resultRecoveryStepId/suppress | Suppress step | UpdateRecoveryStepStatusInput | Replays if duplicate key |
| POST | /steps/:resultRecoveryStepId/void | Void step | UpdateRecoveryStepStatusInput | Replays if duplicate key |

### Practice Drafts

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /steps/:resultRecoveryStepId/practice-drafts | Create practice draft | CreatePracticeDraftInput | Returns existing if duplicate key |
| GET | /steps/:resultRecoveryStepId/practice-drafts | List drafts for step | query: status? | — |
| GET | /practice-drafts/:resultRecoveryPracticeDraftId | Get draft by ID | — | — |
| GET | /objectives/:resultRecoveryObjectiveId/practice-drafts | List drafts for objective | — | — |
| GET | /plans/:resultRecoveryPlanId/practice-drafts | List drafts for plan | — | — |
| GET | /students/:studentRef/practice-drafts | List drafts for student | — | — |
| POST | /practice-drafts/:resultRecoveryPracticeDraftId/review-ready | Mark review ready | UpdateRecoveryPracticeDraftStatusInput | Replays if duplicate key |
| POST | /practice-drafts/:resultRecoveryPracticeDraftId/approve | Approve for future use | UpdateRecoveryPracticeDraftStatusInput | Replays if duplicate key |
| POST | /practice-drafts/:resultRecoveryPracticeDraftId/suppress | Suppress draft | UpdateRecoveryPracticeDraftStatusInput | Replays if duplicate key |
| POST | /practice-drafts/:resultRecoveryPracticeDraftId/block | Block draft | UpdateRecoveryPracticeDraftStatusInput | Replays if duplicate key |
| POST | /practice-drafts/:resultRecoveryPracticeDraftId/void | Void draft | UpdateRecoveryPracticeDraftStatusInput | Replays if duplicate key |

### Resource Recommendations

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /objectives/:resultRecoveryObjectiveId/resource-recommendations | Create resource recommendation | CreateResourceRecommendationInput | Returns existing if duplicate key |
| GET | /objectives/:resultRecoveryObjectiveId/resource-recommendations | List recommendations for objective | query: status?, resourceType? | — |
| GET | /resource-recommendations/:resultRecoveryResourceRecommendationId | Get recommendation by ID | — | — |
| GET | /plans/:resultRecoveryPlanId/resource-recommendations | List recommendations for plan | — | — |
| GET | /students/:studentRef/resource-recommendations | List recommendations for student | — | — |
| POST | /resource-recommendations/:resultRecoveryResourceRecommendationId/review-ready | Mark review ready | UpdateRecoveryResourceRecommendationStatusInput | Replays if duplicate key |
| POST | /resource-recommendations/:resultRecoveryResourceRecommendationId/approve | Approve for future use | UpdateRecoveryResourceRecommendationStatusInput | Replays if duplicate key |
| POST | /resource-recommendations/:resultRecoveryResourceRecommendationId/suppress | Suppress recommendation | UpdateRecoveryResourceRecommendationStatusInput | Replays if duplicate key |
| POST | /resource-recommendations/:resultRecoveryResourceRecommendationId/block | Block recommendation | UpdateRecoveryResourceRecommendationStatusInput | Replays if duplicate key |
| POST | /resource-recommendations/:resultRecoveryResourceRecommendationId/void | Void recommendation | UpdateRecoveryResourceRecommendationStatusInput | Replays if duplicate key |

### Teacher Review Packets

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /plans/:resultRecoveryPlanId/teacher-review-packets | Create teacher review packet | CreateTeacherReviewPacketInput | Returns existing if duplicate key |
| GET | /plans/:resultRecoveryPlanId/teacher-review-packets | List packets for plan | query: status? | — |
| GET | /teacher-review-packets/:resultRecoveryTeacherReviewPacketId | Get packet by ID | — | — |
| GET | /teachers/:teacherRef/teacher-review-packets | List packets for teacher | query: status? | — |
| POST | /teacher-review-packets/:resultRecoveryTeacherReviewPacketId/ready | Mark packet ready | — | Replays if duplicate key |
| POST | /teacher-review-packets/:resultRecoveryTeacherReviewPacketId/acknowledge-mock | Acknowledge (mock) | — | Replays if duplicate key |
| POST | /teacher-review-packets/:resultRecoveryTeacherReviewPacketId/approve | Approve for future use | — | Replays if duplicate key |
| POST | /teacher-review-packets/:resultRecoveryTeacherReviewPacketId/suppress | Suppress packet | UpdateRecoveryTeacherReviewPacketStatusInput | Replays if duplicate key |
| POST | /teacher-review-packets/:resultRecoveryTeacherReviewPacketId/void | Void packet | UpdateRecoveryTeacherReviewPacketStatusInput | Replays if duplicate key |

### Student Support Drafts

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /plans/:resultRecoveryPlanId/student-support-drafts | Create student support draft | CreateStudentSupportDraftInput | Returns existing if duplicate key |
| GET | /plans/:resultRecoveryPlanId/student-support-drafts | List drafts for plan | query: status? | — |
| GET | /student-support-drafts/:resultRecoveryStudentSupportDraftId | Get draft by ID | — | — |
| GET | /students/:studentRef/student-support-drafts | List drafts for student | — | — |
| POST | /student-support-drafts/:resultRecoveryStudentSupportDraftId/review-ready | Mark review ready | UpdateRecoveryStudentSupportDraftStatusInput | Replays if duplicate key |
| POST | /student-support-drafts/:resultRecoveryStudentSupportDraftId/approve | Approve for future use | UpdateRecoveryStudentSupportDraftStatusInput | Replays if duplicate key |
| POST | /student-support-drafts/:resultRecoveryStudentSupportDraftId/suppress | Suppress draft | UpdateRecoveryStudentSupportDraftStatusInput | Replays if duplicate key |
| POST | /student-support-drafts/:resultRecoveryStudentSupportDraftId/block | Block draft | UpdateRecoveryStudentSupportDraftStatusInput | Replays if duplicate key |
| POST | /student-support-drafts/:resultRecoveryStudentSupportDraftId/void | Void draft | UpdateRecoveryStudentSupportDraftStatusInput | Replays if duplicate key |

### Parent Support Note Drafts

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /plans/:resultRecoveryPlanId/parent-support-note-drafts | Create parent support note draft | CreateParentSupportNoteDraftInput | Returns existing if duplicate key |
| GET | /plans/:resultRecoveryPlanId/parent-support-note-drafts | List drafts for plan | query: status?, audienceType? | — |
| GET | /parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId | Get draft by ID | — | — |
| GET | /students/:studentRef/parent-support-note-drafts | List drafts for student | — | — |
| POST | /parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/review-ready | Mark review ready | UpdateRecoveryParentSupportNoteDraftStatusInput | Replays if duplicate key |
| POST | /parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/approve | Approve for future use | UpdateRecoveryParentSupportNoteDraftStatusInput | Replays if duplicate key |
| POST | /parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/suppress | Suppress draft | UpdateRecoveryParentSupportNoteDraftStatusInput | Replays if duplicate key |
| POST | /parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/block | Block draft | UpdateRecoveryParentSupportNoteDraftStatusInput | Replays if duplicate key |
| POST | /parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/void | Void draft | UpdateRecoveryParentSupportNoteDraftStatusInput | Replays if duplicate key |

### Checkpoints

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /plans/:resultRecoveryPlanId/checkpoints | Create checkpoint | CreateRecoveryCheckpointInput | Returns existing if duplicate key |
| GET | /plans/:resultRecoveryPlanId/checkpoints | List checkpoints for plan | query: status?, type? | — |
| GET | /checkpoints/:resultRecoveryCheckpointId | Get checkpoint by ID | — | — |
| GET | /students/:studentRef/checkpoints | List checkpoints for student | — | — |
| POST | /checkpoints/:resultRecoveryCheckpointId/schedule-mock | Schedule (mock) | — | Replays if duplicate key |
| POST | /checkpoints/:resultRecoveryCheckpointId/complete-mock | Complete (mock) | — | Replays if duplicate key |
| POST | /checkpoints/:resultRecoveryCheckpointId/cancel | Cancel checkpoint | UpdateRecoveryCheckpointStatusInput | Replays if duplicate key |
| POST | /checkpoints/:resultRecoveryCheckpointId/void | Void checkpoint | UpdateRecoveryCheckpointStatusInput | Replays if duplicate key |

### Summaries

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /summaries | Create recovery summary | CreateRecoverySummaryInput | Returns existing if duplicate key |
| GET | /summaries | List summaries for school | query: scope?, status?, studentRef? | — |
| GET | /summaries/:resultRecoverySummaryId | Get summary by ID | — | — |
| GET | /students/:studentRef/summaries | List summaries for student | — | — |
| POST | /summaries/:resultRecoverySummaryId/refresh | Refresh summary | — | Replays if duplicate key |
| POST | /summaries/:resultRecoverySummaryId/stale | Mark summary stale | — | Replays if duplicate key |
| POST | /summaries/:resultRecoverySummaryId/block | Block summary | UpdateRecoverySummaryStatusInput | Replays if duplicate key |
| POST | /summaries/:resultRecoverySummaryId/void | Void summary | UpdateRecoverySummaryStatusInput | Replays if duplicate key |

## Safe Error Codes

| Code | Meaning |
|------|---------|
| SCHOOL_MISMATCH | School context does not match resource school |
| MISSING_SCHOOL_CONTEXT | School context not provided |
| FORBIDDEN_ROLE | Actor role not allowed for operation |
| POLICY_BLOCKED | Policy enforcement blocked operation |
| MISSING_UPSTREAM_REFERENCE | Required Package 10–16 reference missing |
| NOT_FOUND | Requested resource not found |
| INVALID_STATUS_TRANSITION | Status transition not allowed |
| IDEMPOTENCY_CONFLICT | Idempotency key conflict |
| VALIDATION_ERROR | Request body validation failed |
| LIVE_ASSIGNMENT_BLOCKED | Live assignment blocked by policy |
| LIVE_NOTIFICATION_BLOCKED | Live notification blocked by policy |
| SCORE_MUTATION_BLOCKED | Score mutation blocked by policy |
| MASTERY_MUTATION_BLOCKED | Mastery mutation blocked by policy |
| GENERATED_QUESTION_BLOCKED | Generated question blocked by policy |
| AI_NARRATIVE_BLOCKED | AI narrative generation blocked by policy |
| OCR_BLOCKED | OCR processing blocked by policy |
| SAFETY_CHECK_FAILED | Safety assertion failed |
| FORBIDDEN_FIELD_DETECTED | Forbidden field detected in request body |
