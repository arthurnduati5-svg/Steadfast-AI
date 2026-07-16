# Question Bank Ownership and Duplication Map

## Canonical Owners

| Capability | Canonical Domain | Canonical Model Prefix | Canonical Service | Canonical Route |
|-----------|-----------------|----------------------|-------------------|----------------|
| Enforcement | assessment/contracts, policies | — | AssessmentCommandEnforcementService | questionBank.ts (shared) |
| Question lifecycle | question-bank | Question*Record | GovernedQuestionCommandService | questionBank.ts |
| Ingestion | question-bank | QuestionIngestion*Record | QuestionIngestionService | questionBank.ts |
| Blueprint | exam-blueprint | ExamBlueprint*Record | ExamBlueprintCommandService | examBlueprint.ts |
| Marking | marking | Marking*Record | MarkingRunService | marking.ts |
| Exam paper | exam-paper | ExamPaper*Record | ExamPaperAssemblyService | examPaper.ts |
| Exam delivery | exam-delivery | ExamDelivery*Record | ExamAttemptService | examDelivery.ts |
| Marking invocation | marking-invocation | MarkingInvocation*Record | MarkingInvocationRequestService | markingInvocation.ts |
| Result governance | result-governance | ResultGovernance*Record | ResultFinalizationDecisionService | resultGovernance.ts |
| Mastery bridge | result-learning-evidence | ResultLearningEvidence*Record | ResultMasteryMutationPlanService | resultLearningEvidence.ts |
| Result release | result-release | ResultRelease*Record | ResultReleasePacketService | resultRelease.ts |
| Result delivery | result-delivery | ResultDelivery*Record | ResultDeliveryJobService | resultDelivery.ts |
| Report card | result-report-card | ResultReportCard*Record | ResultReportCardAssemblyService | resultReportCard.ts |
| Report card export | result-report-card-export | ResultReportCardExport*Record | ResultReportCardExportJobService | resultReportCardExport.ts |
| Report card access | result-report-card-access | ResultReportCardAccess*Record | ResultReportCardAccessGrantService | resultReportCardAccess.ts |
| Follow-up | result-follow-up | ResultFollowUp*Record | ResultFollowUpCaseService | resultFollowUp.ts |
| Recovery planning | result-recovery | ResultRecovery*Record | ResultRecoveryPlanService | resultRecovery.ts |
| Recovery progress | recovery-progress | RecoveryProgress*Record | RecoveryProgressObservationService | recoveryProgress.ts |
| Recovery outcome | recovery-outcome | RecoveryOutcome*Record | RecoveryExitCriteriaEvaluationService | recoveryOutcome.ts |
| Recovery action | recovery-outcome-action | RecoveryOutcomeAction*Record | RecoveryOutcomeActionBundleService | recoveryOutcomeAction.ts |
| Recovery simulation | recovery-outcome-execution-simulation | RecoveryOutcomeExecutionSimulation*Record | SimulationRunService | recoveryOutcomeExecutionSimulation.ts |
| Recovery closure | recovery-lifecycle-closure | RecoveryLifecycleClosure*Record | ClosureReadinessService | recoveryLifecycleClosure.ts |
| Auth preview | recovery-execution-authorization-preview | RecoveryExecutionAuthorization*Record | AuthorizationRequestService | recoveryExecutionAuthorizationPreview.ts |
| Readiness board | recovery-execution-readiness-board | RecoveryExecutionReadinessBoard*Record | BoardCardService | recoveryExecutionReadinessBoard.ts (stub) |
| Triage | recovery-case-triage | RecoveryCaseTriage*Record | RecoveryCaseQueueService | recoveryCaseTriage.ts |
| Adjudication | recovery-case-adjudication | RecoveryCaseAdjudication*Record | ReviewSessionService | recoveryCaseAdjudication.ts (stub) |

## Duplicate Candidates

| Pattern | Occurrences | Verdict |
|---------|------------|---------|
| SafetyService | 26 packages (one per package) | VALID_REUSE — each has domain-specific field checks, but shared utility should be extracted |
| AuditBridge | 26 packages | DUPLICATE_IMPLEMENTATION — 90% identical, only event types differ |
| IdempotencyService | 26 packages | DUPLICATE_IMPLEMENTATION — 90% identical, only prefix differs |
| Decision/Action draft patterns | Pkg 19 outcome + Pkg 20 outcome-action | INTENTIONAL_ADAPTER — decision then action is valid layering |

## Conflicts

None found. Domain boundaries are clean — no two packages claim ownership of the same model, route base, or capability.

## Read Models

- Summary services (e.g., RecoveryCaseTriageSummaryService, AdjudicationSummaryService) are derived read-model layers
- Safe-status draft services (student-safe, parent-safe) are projection-only

## Consolidation Candidates

| Candidate | Evidence | Recommendation |
|-----------|---------|---------------|
| SafetyService across all packages | 26 identical wrappers | Extract shared AssessmentSafetyService with policy injection |
| AuditBridge across all packages | 26 identical wrappers | Extract shared AssessmentAuditBridge with event type enum injection |
| IdempotencyService across all packages | 26 identical wrappers | Already shared (AssessmentIdempotencyService in Pkg 1), but packages re-wrap it |
