# Package 16: Route Contract — Result Follow-Up Intelligence

## Mount

```
Path: /api/question-bank/result-follow-up
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

| Role | Cases | Signals | Action Plans | Teacher Queue | Parent Guidance | Student Reflection | Review Windows | Escalation Plans | Summaries |
|------|-------|---------|-------------|---------------|-----------------|-------------------|----------------|-------------------|-----------|
| teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | BLOCKED | ALLOWED |
| lead_teacher | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| department_head | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| admin | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| system_job | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| student | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| parent | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| guest | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| unknown | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

Escalation plan creation additionally blocks `teacher` role (only `lead_teacher`, `department_head`, `admin`, `system_job` allowed).

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
- liveTaskPayload, calendarEventPayload, externalSyncPayload
- liveProviderPayload, apiKey, providerSecret
- aiNarrative, generatedNarrative, modelOutput, ocrText
- pdfBinary, pdfBuffer, pdfBase64, htmlExport, htmlFile

## Route Endpoints

### Cases

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases | Create follow-up case | CreateFollowUpCaseInput | Returns existing if duplicate key |
| GET | /cases | List cases for school | query: status?, caseType?, priority?, studentRef? | — |
| GET | /cases/:resultFollowUpCaseId | Get case by ID | — | — |
| GET | /students/:studentRef/cases | List cases for student | — | — |
| POST | /cases/:resultFollowUpCaseId/open | Open case | UpdateFollowUpCaseStatusInput | Replays if duplicate key |
| POST | /cases/:resultFollowUpCaseId/triage | Triage case | UpdateFollowUpCaseStatusInput | Replays if duplicate key |
| POST | /cases/:resultFollowUpCaseId/plan | Mark case planned | UpdateFollowUpCaseStatusInput | Replays if duplicate key |
| POST | /cases/:resultFollowUpCaseId/review | Mark case under review | UpdateFollowUpCaseStatusInput | Replays if duplicate key |
| POST | /cases/:resultFollowUpCaseId/close | Close case | UpdateFollowUpCaseStatusInput | Replays if duplicate key |
| POST | /cases/:resultFollowUpCaseId/block | Block case | UpdateFollowUpCaseStatusInput | Replays if duplicate key |
| POST | /cases/:resultFollowUpCaseId/void | Void case | UpdateFollowUpCaseStatusInput | Replays if duplicate key |

### Signals

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/signals | Create signal | CreateFollowUpSignalInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/signals | List signals for case | query: signalType?, severity?, status? | — |
| GET | /signals/:resultFollowUpSignalId | Get signal by ID | — | — |
| GET | /students/:studentRef/signals | List signals for student | query: signalType?, severity? | — |
| POST | /signals/:resultFollowUpSignalId/suppress | Suppress signal | UpdateFollowUpSignalStatusInput | Replays if duplicate key |
| POST | /signals/:resultFollowUpSignalId/void | Void signal | UpdateFollowUpSignalStatusInput | Replays if duplicate key |

### Action Plans

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/action-plans | Create action plan | CreateActionPlanInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/action-plans | List action plans for case | query: status? | — |
| GET | /action-plans/:resultFollowUpActionPlanId | Get action plan by ID | — | — |
| GET | /students/:studentRef/action-plans | List action plans for student | — | — |
| POST | /action-plans/:resultFollowUpActionPlanId/review-ready | Mark review ready | — | Replays if duplicate key |
| POST | /action-plans/:resultFollowUpActionPlanId/approve | Approve for future use | — | Replays if duplicate key |
| POST | /action-plans/:resultFollowUpActionPlanId/suppress | Suppress action plan | UpdateActionPlanStatusInput | Replays if duplicate key |
| POST | /action-plans/:resultFollowUpActionPlanId/block | Block action plan | UpdateActionPlanStatusInput | Replays if duplicate key |
| POST | /action-plans/:resultFollowUpActionPlanId/void | Void action plan | UpdateActionPlanStatusInput | Replays if duplicate key |

### Teacher Queue

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/queue-items | Create queue item | CreateTeacherQueueItemInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/queue-items | List queue items for case | query: status?, priority? | — |
| GET | /queue-items/:teacherFollowUpQueueItemId | Get queue item by ID | — | — |
| GET | /teachers/:teacherRef/queue-items | List queue for teacher | query: status?, priority? | — |
| POST | /queue-items/:teacherFollowUpQueueItemId/queue | Mark queued for review | — | Replays if duplicate key |
| POST | /queue-items/:teacherFollowUpQueueItemId/acknowledge | Acknowledge (mock) | — | Replays if duplicate key |
| POST | /queue-items/:teacherFollowUpQueueItemId/complete | Complete (mock) | — | Replays if duplicate key |
| POST | /queue-items/:teacherFollowUpQueueItemId/suppress | Suppress queue item | UpdateTeacherQueueStatusInput | Replays if duplicate key |
| POST | /queue-items/:teacherFollowUpQueueItemId/block | Block queue item | UpdateTeacherQueueStatusInput | Replays if duplicate key |
| POST | /queue-items/:teacherFollowUpQueueItemId/void | Void queue item | UpdateTeacherQueueStatusInput | Replays if duplicate key |

### Parent Guidance Drafts

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/parent-guidance-drafts | Create parent guidance draft | CreateParentGuidanceDraftInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/parent-guidance-drafts | List drafts for case | query: status? | — |
| GET | /parent-guidance-drafts/:parentGuidanceDraftId | Get draft by ID | — | — |
| GET | /students/:studentRef/parent-guidance-drafts | List drafts for student | — | — |
| POST | /parent-guidance-drafts/:parentGuidanceDraftId/review-ready | Mark review ready | — | Replays if duplicate key |
| POST | /parent-guidance-drafts/:parentGuidanceDraftId/approve | Approve for future use | — | Replays if duplicate key |
| POST | /parent-guidance-drafts/:parentGuidanceDraftId/suppress | Suppress draft | UpdateParentGuidanceDraftStatusInput | Replays if duplicate key |
| POST | /parent-guidance-drafts/:parentGuidanceDraftId/block | Block draft | UpdateParentGuidanceDraftStatusInput | Replays if duplicate key |
| POST | /parent-guidance-drafts/:parentGuidanceDraftId/void | Void draft | UpdateParentGuidanceDraftStatusInput | Replays if duplicate key |

### Student Reflection Drafts

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/student-reflection-drafts | Create student reflection draft | CreateStudentReflectionTaskDraftInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/student-reflection-drafts | List drafts for case | query: status? | — |
| GET | /student-reflection-drafts/:studentReflectionTaskDraftId | Get draft by ID | — | — |
| GET | /students/:studentRef/student-reflection-drafts | List drafts for student | — | — |
| POST | /student-reflection-drafts/:studentReflectionTaskDraftId/review-ready | Mark review ready | — | Replays if duplicate key |
| POST | /student-reflection-drafts/:studentReflectionTaskDraftId/approve | Approve for future use | — | Replays if duplicate key |
| POST | /student-reflection-drafts/:studentReflectionTaskDraftId/suppress | Suppress draft | UpdateStudentReflectionDraftStatusInput | Replays if duplicate key |
| POST | /student-reflection-drafts/:studentReflectionTaskDraftId/block | Block draft | UpdateStudentReflectionDraftStatusInput | Replays if duplicate key |
| POST | /student-reflection-drafts/:studentReflectionTaskDraftId/void | Void draft | UpdateStudentReflectionDraftStatusInput | Replays if duplicate key |

### Review Windows

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/review-windows | Create review window | CreateReviewWindowInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/review-windows | List windows for case | query: status? | — |
| GET | /review-windows/:followUpReviewWindowId | Get window by ID | — | — |
| GET | /students/:studentRef/review-windows | List windows for student | — | — |
| POST | /review-windows/:followUpReviewWindowId/schedule | Schedule (mock) | — | Replays if duplicate key |
| POST | /review-windows/:followUpReviewWindowId/complete | Complete (mock) | — | Replays if duplicate key |
| POST | /review-windows/:followUpReviewWindowId/cancel | Cancel window | UpdateReviewWindowStatusInput | Replays if duplicate key |
| POST | /review-windows/:followUpReviewWindowId/void | Void window | UpdateReviewWindowStatusInput | Replays if duplicate key |

### Escalation Plans

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /cases/:resultFollowUpCaseId/escalation-plans | Create escalation plan | CreateEscalationPlanInput | Returns existing if duplicate key |
| GET | /cases/:resultFollowUpCaseId/escalation-plans | List plans for case | query: status?, level? | — |
| GET | /escalation-plans/:followUpEscalationPlanId | Get plan by ID | — | — |
| GET | /students/:studentRef/escalation-plans | List plans for student | — | — |
| POST | /escalation-plans/:followUpEscalationPlanId/review-ready | Mark review ready | — | Replays if duplicate key |
| POST | /escalation-plans/:followUpEscalationPlanId/approve | Approve for future use | — | Replays if duplicate key |
| POST | /escalation-plans/:followUpEscalationPlanId/suppress | Suppress plan | UpdateEscalationPlanStatusInput | Replays if duplicate key |
| POST | /escalation-plans/:followUpEscalationPlanId/block | Block plan | UpdateEscalationPlanStatusInput | Replays if duplicate key |
| POST | /escalation-plans/:followUpEscalationPlanId/void | Void plan | UpdateEscalationPlanStatusInput | Replays if duplicate key |

### Summaries

| Method | Path | Purpose | Request Body | Idempotency Behavior |
|--------|------|---------|-------------|---------------------|
| POST | /summaries | Create follow-up summary | CreateFollowUpSummaryInput | Returns existing if duplicate key |
| GET | /summaries | List summaries for school | query: scope?, status?, studentRef? | — |
| GET | /summaries/:followUpSummaryId | Get summary by ID | — | — |
| GET | /students/:studentRef/summaries | List summaries for student | — | — |
| POST | /summaries/:followUpSummaryId/refresh | Refresh summary | — | Replays if duplicate key |
| POST | /summaries/:followUpSummaryId/stale | Mark summary stale | — | Replays if duplicate key |
| POST | /summaries/:followUpSummaryId/block | Block summary | UpdateFollowUpSummaryStatusInput | Replays if duplicate key |
| POST | /summaries/:followUpSummaryId/void | Void summary | UpdateFollowUpSummaryStatusInput | Replays if duplicate key |

## Safe Error Codes

| Code | Meaning |
|------|---------|
| SCHOOL_MISMATCH | School context does not match resource school |
| MISSING_SCHOOL_CONTEXT | School context not provided |
| FORBIDDEN_ROLE | Actor role not allowed for operation |
| POLICY_BLOCKED | Policy enforcement blocked operation |
| MISSING_UPSTREAM_REFERENCE | Required Package 9–15 reference missing |
| NOT_FOUND | Requested resource not found |
| INVALID_STATUS_TRANSITION | Status transition not allowed |
| IDEMPOTENCY_CONFLICT | Idempotency key conflict |
| VALIDATION_ERROR | Request body validation failed |
| LIVE_NOTIFICATION_BLOCKED | Live notification blocked by policy |
| LIVE_TASK_BLOCKED | Live task creation blocked by policy |
| SCORE_MUTATION_BLOCKED | Score mutation blocked by policy |
| AI_NARRATIVE_BLOCKED | AI narrative generation blocked by policy |
| OCR_BLOCKED | OCR processing blocked by policy |
| SAFETY_CHECK_FAILED | Safety assertion failed |
| FORBIDDEN_FIELD_DETECTED | Forbidden field detected in request body |
