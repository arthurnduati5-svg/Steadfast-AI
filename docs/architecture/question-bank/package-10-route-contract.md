# Package 10 - Route Contract

## Mount Point

```
/api/question-bank/result-learning-evidence
```

Middleware: `schoolAuthMiddleware`, `requireVerifiedSchoolContext`

## Evidence Bridge Routes

### POST /bridges
- Purpose: Create evidence bridge from finalized result
- Body: `{ resultFinalizationDecisionId, resultReleaseReadinessId, markingRunId, markingResultVersionId, studentRef, paperId, paperVersionId, deliverySessionId, bridgeMode, sourceRefs, safeEvidenceSummary }`
- Response: SafeResponseEnvelope with bridge data
- Idempotency: Required (`idempotency-key` header)
- School context: Required
- Roles: teacher, lead_teacher, department_head, admin, system_job

### GET /bridges/:resultLearningEvidenceBridgeId
- Purpose: Get evidence bridge by ID
- Response: SafeResponseEnvelope with bridge

### GET /bridges
- Purpose: List bridges, optionally filtered by studentRef or resultFinalizationDecisionId
- Query: `?studentRef=X` or `?resultFinalizationDecisionId=X`
- School context: Required

### POST /bridges/:resultLearningEvidenceBridgeId/run-source-checks
- Purpose: Run source integrity checks on bridge
- Roles: teacher, admin

### POST /bridges/:resultLearningEvidenceBridgeId/ready-for-mapping
- Purpose: Mark bridge ready for objective impact mapping
- Roles: teacher, admin

### POST /bridges/:resultLearningEvidenceBridgeId/block
- Purpose: Block bridge

### POST /bridges/:resultLearningEvidenceBridgeId/cancel
- Purpose: Cancel bridge

### POST /bridges/:resultLearningEvidenceBridgeId/complete
- Purpose: Complete bridge

## Objective Impact Routes

### POST /bridges/:resultLearningEvidenceBridgeId/objective-impacts
- Purpose: Map objective impact from result evidence
- Body: `{ resultMasteryMutationPlanId, studentRef, learningObjectiveId, questionVersionId, markingResultVersionId, impactType, evidenceStrength, masteryDelta, confidenceLevel, safeImpactSummary, sourceRefs }`

### GET /objective-impacts/:resultObjectiveMasteryImpactId
- Purpose: Get objective impact by ID

### GET /bridges/:resultLearningEvidenceBridgeId/objective-impacts
- Purpose: List impacts for bridge

### POST /objective-impacts/:resultObjectiveMasteryImpactId/approve
- Purpose: Approve impact

### POST /objective-impacts/:resultObjectiveMasteryImpactId/block
- Purpose: Block impact

### POST /objective-impacts/:resultObjectiveMasteryImpactId/void
- Purpose: Void impact

## Mastery Plan Routes

### POST /bridges/:resultLearningEvidenceBridgeId/mastery-plans
- Purpose: Create mastery mutation plan
- Idempotency: Required

### GET /mastery-plans/:resultMasteryMutationPlanId
- Purpose: Get plan by ID

### GET /bridges/:resultLearningEvidenceBridgeId/mastery-plans
- Purpose: List plans for bridge

### POST /mastery-plans/:resultMasteryMutationPlanId/build
- Purpose: Build plan from objective impacts

### POST /mastery-plans/:resultMasteryMutationPlanId/ready-for-approval
- Purpose: Mark plan ready for approval

### POST /mastery-plans/:resultMasteryMutationPlanId/approve
- Purpose: Approve plan

### POST /mastery-plans/:resultMasteryMutationPlanId/block
- Purpose: Block plan

### POST /mastery-plans/:resultMasteryMutationPlanId/cancel
- Purpose: Cancel plan

### POST /mastery-plans/:resultMasteryMutationPlanId/apply
- Purpose: Apply approved mastery mutation plan

## Mastery Event Routes

### GET /mastery-events/:resultMasteryMutationEventId
- Purpose: Get mutation event by ID

### GET /mastery-plans/:resultMasteryMutationPlanId/mastery-events
- Purpose: List events for plan

### POST /mastery-events/:resultMasteryMutationEventId/void
- Purpose: Void mutation event

## Revision Signal Routes

### POST /mastery-plans/:resultMasteryMutationPlanId/revision-signals
- Purpose: Create revision signal from plan

### GET /revision-signals/:resultRevisionSignalId
- Purpose: Get revision signal by ID

### GET /mastery-plans/:resultMasteryMutationPlanId/revision-signals
- Purpose: List revision signals for plan

### POST /revision-signals/:resultRevisionSignalId/ready
- Purpose: Mark revision signal ready

### POST /revision-signals/:resultRevisionSignalId/dispatch
- Purpose: Dispatch revision signal

### POST /revision-signals/:resultRevisionSignalId/block
- Purpose: Block revision signal

### POST /revision-signals/:resultRevisionSignalId/void
- Purpose: Void revision signal

## Growth Signal Routes

### POST /mastery-plans/:resultMasteryMutationPlanId/growth-signals
- Purpose: Create growth signal from plan

### GET /growth-signals/:resultGrowthSignalId
- Purpose: Get growth signal by ID

### GET /mastery-plans/:resultMasteryMutationPlanId/growth-signals
- Purpose: List growth signals for plan

### POST /growth-signals/:resultGrowthSignalId/ready
- Purpose: Mark growth signal ready

### POST /growth-signals/:resultGrowthSignalId/dispatch
- Purpose: Dispatch growth signal

### POST /growth-signals/:resultGrowthSignalId/block
- Purpose: Block growth signal

### POST /growth-signals/:resultGrowthSignalId/void
- Purpose: Void growth signal

## Projection Routes

### GET /bridges/:resultLearningEvidenceBridgeId/projection/teacher
- Purpose: Teacher-safe projection of bridge and related records

### GET /bridges/:resultLearningEvidenceBridgeId/projection/admin
- Purpose: Admin projection with aggregate counts

### GET /bridges/:resultLearningEvidenceBridgeId/projection/student-safe
- Purpose: Student-safe projection (excludes answer keys, rubrics, raw answers, hidden reasoning, unreleased grades, parent/report payloads, raw mastery deltas)

### GET /bridges/:resultLearningEvidenceBridgeId/projection/parent-boundary
- Purpose: Parent-boundary projection (excludes report cards, parent delivery payloads, scores, answer keys)

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
  policyDecision?: string;
  nextAllowedActions?: string[];
  data?: unknown;
}
```

## Safe Error Codes

- AUTH_REQUIRED
- SCHOOL_CONTEXT_REQUIRED
- VALIDATION_FAILED
- POLICY_BLOCKED
- IDEMPOTENCY_CONFLICT
- NOT_FOUND
- FORBIDDEN_FIELD
- PACKAGE_9_FINALIZATION_NOT_FOUND
- PACKAGE_9_FINALIZATION_NOT_APPROVED
- PACKAGE_9_RELEASE_READINESS_NOT_FOUND
- PACKAGE_5_RESULT_NOT_FOUND
- RESULT_VERSION_NOT_READY
- REGRADE_REQUEST_UNRESOLVED
- OBJECTIVE_MAPPING_NOT_FOUND
- MASTERY_SNAPSHOT_NOT_FOUND
- EXISTING_MASTERY_MUTATION_PATH_NOT_FOUND
- MASTER_PLAN_NOT_APPROVED
- MASTERY_MUTATION_BLOCKED
- REVISION_SIGNAL_DISPATCH_DEFERRED
- GROWTH_SIGNAL_DISPATCH_DEFERRED
- PARENT_RELEASE_DEFERRED
- PARENT_NOTIFICATION_DEFERRED
- REPORT_CARD_DEFERRED
- AI_MARKING_DEFERRED
- OCR_DEFERRED
- UNKNOWN_SAFE_ERROR

## Forbidden Leakage Rules

- No route returns answer keys, rubric internals, raw student answers, hidden reasoning, unreleased grades, parent delivery payloads, report card payloads, or raw mastery deltas in student/parent projections.
- No route sends parent notifications.
- No route publishes parent payloads.
- No route performs OCR.
- No route calls AI providers.
- No route changes marking scores.
- No route overwrites result versions.
