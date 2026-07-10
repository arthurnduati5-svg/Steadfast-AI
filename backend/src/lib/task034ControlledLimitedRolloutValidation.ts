import {
  TASK034_ALLOWED_ENVIRONMENT_TYPES,
  TASK034_ALLOWED_ROLLOUT_MODES,
  TASK034_ALLOWED_DATA_MODES,
  TASK034_ALLOWED_SIDE_EFFECT_MODES,
  TASK034_ALLOWED_ACTOR_ROLES,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK034_VALID_STATE_TRANSITIONS,
  TASK034_MAX_ROLLOUT_PERCENT,
  TASK034_MAX_EXPANDED_STUDENT_COUNT,
  TASK034_ROLLOUT_STAGE_IDS,
  resolveTask034ActorRole,
  isTask034AdminOperatorRole,
  isTask034DeniedRole,
  Task034Task033DependencyProof,
  Task034RolloutEnvironmentGateInput,
  Task034RolloutEnvironmentGateResult,
  Task034LimitedRolloutConfigInput,
  Task034LimitedRolloutConfigResult,
  Task034RolloutCapGateInput,
  Task034RolloutCapGateResult,
  Task034ExpandedCohortEligibilityInput,
  Task034ExpandedCohortEligibilityResult,
  Task034StaffReadinessInput,
  Task034StaffReadinessResult,
  Task034LearnerNoticeReadinessInput,
  Task034LearnerNoticeReadinessResult,
  Task034ControlledRolloutSessionInput,
  Task034ControlledRolloutEventInput,
  Task034ExpandedRuntimeGuardResult,
  Task034HealthBudgetEscalationResult,
  Task034IncidentEscalationBridgeResult,
  Task034RollbackProtectionResult,
  Task034PrivacyReviewResult,
  Task034ContentGovernanceReviewResult,
  Task034SocraticIntegrityReviewResult,
  Task034DeenBoundaryReviewResult,
  Task034SchoolIdentityReviewResult,
  Task034CrossSchoolDenialReviewResult,
  Task034SafeRolloutReadModel,
  Task034ControlledLimitedRolloutReport,
} from '../contracts/task034ControlledLimitedRolloutContracts';

export interface Task034ValidationResult {
  ok: boolean;
  reasonCodes: string[];
}

function success(): Task034ValidationResult {
  return { ok: true, reasonCodes: [] };
}

function failure(reasonCodes: string[]): Task034ValidationResult {
  return { ok: false, reasonCodes: [...new Set(reasonCodes)] };
}

function hasField(obj: Record<string, unknown>, field: string): boolean {
  return field in obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '';
}

function hasAllFields(obj: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const f of fields) {
    if (!hasField(obj, f)) missing.push(`missing_${f}`);
  }
  return missing;
}

export function validateTask034DependencyProof(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'reportFound', 'opsReportFound', 'verdict',
    'safeToStartTask034', 'safeToStartTask035', 'safeToStartTask040',
    'task033FocusedTestsPassed', 'task033RouteContractsPassed',
    'task033RoleSecurityTestsPassed', 'task033ContinuityTestsPassed',
    'task033NoStarSafetyTestsPassed', 'task033VerificationScriptPassed',
    'task020To032RegressionPassed', 'phase3RegressionPassed',
    'fullBackendSuitePassed', 'backendTypecheckPassed', 'backendBuildPassed',
    'prismaValidatePassed', 'prismaGeneratePassed',
    'privacyScanPassed', 'noProductionMutationScanPassed',
    'noLiveConnectorAiScanPassed', 'noLiveNotificationScanPassed',
    'noFrontendUiScanPassed', 'noTask034ToTask040ScanPassed',
    'noFalsePassScanPassed', 'noTask034ImplementationInTask033',
    'noFrontendUiInTask033', 'noLiveAiConnectorNotificationInTask033',
    'remainingBlockers', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (input.ok !== true) reasons.push('ok_not_true');
  if (input.safeToStartTask034 !== true) reasons.push('safeToStartTask034_not_true');
  if (input.safeToStartTask035 !== false) reasons.push('safeToStartTask035_not_false');
  if (input.safeToStartTask040 !== false) reasons.push('safeToStartTask040_not_false');
  if (!Array.isArray(input.remainingBlockers)) reasons.push('remainingBlockers_not_array');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034EnvironmentGateInput(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'environmentType', 'rolloutMode', 'dataMode', 'sideEffectMode',
    'task033Accepted', 'task034Started', 'task035Started', 'task040Started',
    'rolloutPercent', 'schoolWideLaunchRequested', 'hundredPercentRolloutRequested',
    'backendFreezeRequested', 'frontendUiRequested',
    'liveAiRequested', 'liveConnectorRequested', 'liveNotificationRequested',
    'productionDeploymentRequested', 'productionMutationRequested',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (input.environmentType !== 'controlled_limited_rollout') reasons.push('environmentType_not_controlled_limited_rollout');
  if (input.rolloutMode !== 'limited_cohort_expansion_only') reasons.push('rolloutMode_not_limited_cohort_expansion_only');
  if (input.dataMode !== 'safe_metadata_and_aggregate_only') reasons.push('dataMode_not_safe_metadata_and_aggregate_only');
  if (input.sideEffectMode !== 'internal_rollout_store_only') reasons.push('sideEffectMode_not_internal_rollout_store_only');
  if (input.task033Accepted !== true) reasons.push('task033Accepted_not_true');
  if (input.task034Started !== false) reasons.push('task034Started_not_false');
  if (input.task035Started !== false) reasons.push('task035Started_not_false');
  if (input.task040Started !== false) reasons.push('task040Started_not_false');
  if (typeof input.rolloutPercent !== 'number' || input.rolloutPercent <= 0 || input.rolloutPercent > 25) reasons.push('rolloutPercent_out_of_range');
  if (input.schoolWideLaunchRequested !== false) reasons.push('schoolWideLaunchRequested_not_false');
  if (input.hundredPercentRolloutRequested !== false) reasons.push('hundredPercentRolloutRequested_not_false');
  if (input.frontendUiRequested !== false) reasons.push('frontendUiRequested_not_false');
  if (input.liveAiRequested !== false) reasons.push('liveAiRequested_not_false');
  if (input.liveConnectorRequested !== false) reasons.push('liveConnectorRequested_not_false');
  if (input.liveNotificationRequested !== false) reasons.push('liveNotificationRequested_not_false');
  if (input.productionDeploymentRequested !== false) reasons.push('productionDeploymentRequested_not_false');
  if (input.productionMutationRequested !== false) reasons.push('productionMutationRequested_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034LimitedRolloutConfig(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'rolloutPercent', 'expandedCohortId', 'schoolId', 'tenantId',
    'activationId', 'task033ObservationSessionId',
    'rollbackPlanId', 'pausePlanId', 'killSwitchId',
    'staffReadinessRequired', 'learnerNoticeRequired',
    'healthBudgetRequired', 'privacyReviewRequired',
    'contentGovernanceReviewRequired', 'socraticIntegrityReviewRequired',
    'deenBoundaryReviewRequired',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (typeof input.rolloutPercent !== 'number' || input.rolloutPercent <= 0 || input.rolloutPercent > 25) reasons.push('rolloutPercent_out_of_range');
  if (input.rolloutPercent === 100) reasons.push('rolloutPercent_is_100');
  if (input.staffReadinessRequired !== true) reasons.push('staffReadinessRequired_not_true');
  if (input.learnerNoticeRequired !== true) reasons.push('learnerNoticeRequired_not_true');
  if (input.healthBudgetRequired !== true) reasons.push('healthBudgetRequired_not_true');
  if (input.privacyReviewRequired !== true) reasons.push('privacyReviewRequired_not_true');
  if (input.contentGovernanceReviewRequired !== true) reasons.push('contentGovernanceReviewRequired_not_true');
  if (input.socraticIntegrityReviewRequired !== true) reasons.push('socraticIntegrityReviewRequired_not_true');
  if (input.deenBoundaryReviewRequired !== true) reasons.push('deenBoundaryReviewRequired_not_true');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034RolloutCapGate(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'rolloutPercent', 'expandedStudentCount', 'maxRolloutPercent',
    'maxExpandedStudentCount', 'schoolWideRequested', 'hundredPercentRequested',
    'openCohortRequested', 'unknownCohortRequested', 'crossSchoolCohortRequested',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (typeof input.rolloutPercent !== 'number' || input.rolloutPercent > input.maxRolloutPercent) reasons.push('rolloutPercent_exceeds_max');
  if (typeof input.expandedStudentCount !== 'number' || input.expandedStudentCount > input.maxExpandedStudentCount) reasons.push('studentCount_exceeds_max');
  if (input.schoolWideRequested !== false) reasons.push('schoolWideRequested_not_false');
  if (input.hundredPercentRequested !== false) reasons.push('hundredPercentRequested_not_false');
  if (input.openCohortRequested !== false) reasons.push('openCohortRequested_not_false');
  if (input.unknownCohortRequested !== false) reasons.push('unknownCohortRequested_not_false');
  if (input.crossSchoolCohortRequested !== false) reasons.push('crossSchoolCohortRequested_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034ExpandedCohortEligibility(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'schoolId', 'tenantId', 'cohortId', 'classIds', 'studentCount',
    'hashedStudentIds', 'approvedSchoolConfig',
    'staffCoverage', 'rollbackCoverage', 'healthBudgetCoverage', 'contentGovernanceCoverage',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.classIds)) reasons.push('classIds_not_array');
  if (!Array.isArray(input.hashedStudentIds)) reasons.push('hashedStudentIds_not_array');
  if (typeof input.studentCount !== 'number' || input.studentCount <= 0) reasons.push('studentCount_invalid');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034StaffReadiness(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'schoolAdminAcknowledged', 'internalOperatorAcknowledged',
    'teacherSupportAcknowledged', 'privacyBoundaryAcknowledged',
    'safeguardingEscalationAcknowledged', 'deenBoundaryAcknowledged',
    'contentGovernanceAcknowledged', 'rollbackPauseKillSwitchAcknowledged',
    'learnerSupportPlanAcknowledged', 'readinessScore',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (typeof input.readinessScore !== 'number') reasons.push('readinessScore_not_number');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034LearnerNoticeReadiness(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'noticeIsCalm', 'noticeIsAgeAppropriate', 'noticeIsNonAlarming',
    'noticeMentionsThinkingFirst', 'noticeMentionsTeacherSupport',
    'noInternalRolloutDetails', 'noRiskScores', 'noPrivateComparisons',
    'noPietyScore', 'noClassmateComparison', 'noRawIncidentDetail', 'noAnswerArtifact',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034RolloutSessionInput(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['sessionId', 'activationId', 'schoolId', 'tenantId', 'cohortId', 'actorRole']));
  const resolvedRole = resolveTask034ActorRole(String(input.actorRole || ''));
  if (!TASK034_ALLOWED_ACTOR_ROLES.includes(resolvedRole)) reasons.push('actorRole_not_allowed');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034RolloutEventInput(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'eventId', 'sessionId', 'activationId', 'schoolId', 'actorRole',
    'safeActorHash', 'safeStudentHash', 'cohortId', 'classId', 'subjectId',
    'eventType', 'safeReasonCodes', 'safeSummary', 'gateName',
    'gatePassed', 'latencyMs', 'errorCategory', 'createdAt',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  const resolvedRole = resolveTask034ActorRole(String(input.actorRole || ''));
  if (!TASK034_ALLOWED_ACTOR_ROLES.includes(resolvedRole)) reasons.push('actorRole_not_allowed');
  if (!Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  if (typeof input.latencyMs !== 'number') reasons.push('latencyMs_not_number');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034EventSafety(input: Task034ControlledRolloutEventInput): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  if (!input.safeActorHash || input.safeActorHash.startsWith('raw_')) reasons.push('unsafe_actor_hash');
  if (!input.safeStudentHash || input.safeStudentHash.startsWith('raw_')) reasons.push('unsafe_student_hash');
  if (!input.safeSummary || /raw/i.test(input.safeSummary)) reasons.push('unsafe_summary_contains_raw');
  if (input.safeReasonCodes && !Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034ExpandedRuntimeGuard(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'verifiedSchoolContextRequired', 'task033AcceptedProofRequired',
    'approvedSchoolConfigRequired', 'approvedContentContextRequired',
    'learnerMemoryBlockedBeforeSchoolContext', 'aiBlockedBeforeAllGates',
    'liveAiBlocked', 'liveConnectorBlocked', 'liveNotificationsBlocked',
    'crossSchoolAccessBlocked', 'crossLearnerVisibilityBlocked',
    'parentRawDetailBlocked', 'teacherOnlyLeakageBlocked',
    'unsafeDeenAuthorityBlocked', 'answerBotBehaviorBlocked', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034HealthBudgetEscalation(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'rolloutLatencyP95Ms', 'safeReadLatencyP95Ms', 'eventIntakeLatencyP95Ms',
    'errorRate', 'criticalErrorCount', 'timeoutCount',
    'privacyBoundaryFailureCount', 'schoolContextBypassCount',
    'crossSchoolAttemptCount', 'runtimeGuardDenialCount',
    'rollbackReadinessFailureCount', 'healthBudgetPassed',
    'escalationRequired', 'pauseRecommended', 'rollbackRecommended',
    'killSwitchRecommended', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (typeof input.rolloutLatencyP95Ms !== 'number') reasons.push('rolloutLatencyP95Ms_not_number');
  if (typeof input.errorRate !== 'number') reasons.push('errorRate_not_number');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034IncidentEscalationBridge(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'safeSeverity', 'safeCategory', 'safeReasonCodes', 'safeSummary',
    'pauseRecommended', 'rollbackRecommended', 'killSwitchRecommended',
    'operatorReviewRequired', 'realAlertSent', 'realEmailSent',
    'realSmsSent', 'realWhatsappSent', 'externalTicketCreated',
    'webhookCalled', 'rawIncidentDetailsExposed', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  if (input.realAlertSent !== false) reasons.push('realAlertSent_not_false');
  if (input.realEmailSent !== false) reasons.push('realEmailSent_not_false');
  if (input.realSmsSent !== false) reasons.push('realSmsSent_not_false');
  if (input.realWhatsappSent !== false) reasons.push('realWhatsappSent_not_false');
  if (input.externalTicketCreated !== false) reasons.push('externalTicketCreated_not_false');
  if (input.webhookCalled !== false) reasons.push('webhookCalled_not_false');
  if (input.rawIncidentDetailsExposed !== false) reasons.push('rawIncidentDetailsExposed_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034RollbackProtection(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'rollbackAvailable', 'pauseAvailable', 'killSwitchAvailable',
    'rollbackOwnerAssigned', 'rollbackPlanValid', 'pausePlanValid', 'killSwitchPlanValid',
    'safeAuditPreservedOnRollback', 'limitedRolloutCanStopWithoutSchoolWideSideEffect', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034PrivacyReview(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'noRawLearnerData', 'noRawChat', 'noRawAnswer', 'noRawStudentWork',
    'noParentContactData', 'noTeacherPrivateNotes', 'noSafeguardingRawNotes',
    'noPrivateDeenText', 'noAnswerKey', 'noMarkingScheme',
    'noProviderPrompt', 'noProviderResponse', 'noHiddenReasoning', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034ContentGovernanceReview(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'approvedCurriculumSourceRequired', 'noInventedTeachingClaim',
    'noAnswerKeyLeakage', 'noMarkingSchemeLeakage', 'noTeacherOnlyLeakage', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034SocraticIntegrityReview(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'socraticGuidancePreserved', 'noFinalAnswerBotBehavior',
    'cheatingPreventionPreserved', 'hintLadderPreserved',
    'studentReasoningFirstPreserved', 'teacherEscalationAvailable', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034DeenBoundaryReview(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'notAFatwaEngine', 'approvedDeenSourcesRequired',
    'teacherScholarReferralPreserved', 'noPietyScoring',
    'noRawSafeguardingExposure', 'noUnsafeAuthorityClaim', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034SchoolIdentityReview(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'verifiedSchoolIdentityRequired', 'unknownSchoolDenied',
    'crossSchoolAccessDenied', 'actorRoleRequired',
    'noSessionBeforeSchoolContext', 'noMemoryAccessBeforeSchoolContext',
    'noEvidenceBeforeSchoolContext', 'noAiCallBeforeSchoolContext', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034CrossSchoolDenialReview(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'crossSchoolAttemptsBlocked', 'schoolAContextNotVisibleToSchoolB',
    'noInterSchoolLearnerVisibility', 'noInterSchoolTeacherDataLeakage',
    'safeAuditOfCrossSchoolAttempts', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034SafeRolloutReadModel(input: any): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'rolloutSessionId', 'task033ObservationSessionId', 'activationId',
    'schoolId', 'tenantId', 'cohortId', 'rolloutPercent', 'studentCount',
    'status', 'stage',
    'healthStatus', 'privacyStatus', 'governanceStatus', 'socraticStatus',
    'deenStatus', 'schoolIdentityStatus', 'incidentStatus',
    'rollbackProtectionStatus', 'staffReadinessStatus', 'learnerNoticeReadinessStatus',
    'safeToStartTask035', 'safeToStartTask040', 'safeReasonCodes', 'generatedAt',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!('safeAggregate' in input)) reasons.push('missing_safeAggregate');
  if (input.safeAggregate !== null && (typeof input.safeAggregate !== 'object' || Array.isArray(input.safeAggregate))) reasons.push('safeAggregate_invalid');
  if (!Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  if (input.safeToStartTask035 !== false) reasons.push('safeToStartTask035_not_false');
  if (input.safeToStartTask040 !== false) reasons.push('safeToStartTask040_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034ReportTruth(input: Task034ControlledLimitedRolloutReport): Task034ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'taskId', 'scope', 'task033DependencyCommit', 'task033DependencyVerified',
    'task034Started', 'task035Started', 'task040Started',
    'frontendUiCreated', 'schoolWideLaunchCreated', 'backendFreezeCreated',
    'hundredPercentRolloutCreated', 'productionDeploymentIntroduced',
    'realNotificationsSent', 'liveAiCallIntroduced', 'liveSchoolConnectorWriteIntroduced',
    'productionDataMutationExecuted', 'rawPrivateDataStored',
    'controlledLimitedRolloutCreated',
    'contractsCreatedOrUpdated', 'validationCreatedOrUpdated', 'repositoryCreatedOrUpdated',
    'servicesCreatedOrUpdated', 'routesCreatedOrUpdated', 'routesMountedOrDirectlyTested',
    'verifiedSchoolContextRequired', 'task033AcceptanceRequired',
    'rolloutEnvironmentGatePassed', 'limitedRolloutConfigPassed', 'rolloutCapGatePassed',
    'expandedCohortEligibilityPassed', 'staffReadinessPassed', 'learnerNoticeReadinessPassed',
    'controlledRolloutStateMachinePassed', 'controlledRolloutEventIntakePassed',
    'expandedRuntimeGuardPassed', 'healthBudgetEscalationPassed', 'incidentEscalationBridgePassed',
    'rollbackProtectionPassed', 'privacyReviewPassed', 'contentGovernanceReviewPassed',
    'socraticIntegrityReviewPassed', 'deenBoundaryReviewPassed',
    'schoolIdentityReviewPassed', 'crossSchoolDenialReviewPassed',
    'safeRolloutReadModelPassed', 'evidenceLedgerPassed', 'diagnosticsPassed',
    'postLimitedRolloutDecisionPassed', 'reportPassed',
    'task034FocusedTestsRun', 'task034FocusedTestsPassed', 'task034FocusedTestFiles',
    'task034FocusedTestsPassedCount', 'task034FocusedTestsFailedCount',
    'task020To033RegressionRun', 'task020To033RegressionPassed',
    'phase3RegressionRun', 'phase3RegressionPassed',
    'fullBackendSuiteRun', 'fullBackendSuitePassed', 'fullBackendSuiteFailedFiles',
    'fullBackendSuiteFailedTests', 'prismaValidateRun', 'prismaValidatePassed',
    'prismaGenerateRun', 'prismaGeneratePassed', 'backendBuildRun', 'backendBuildPassed',
    'backendTypecheckRun', 'backendTypecheckPassed',
    'task034VerificationScriptRun', 'task034VerificationScriptPassed',
    'privacyScanRun', 'privacyScanPassed',
    'noProductionMutationScanRun', 'noProductionMutationScanPassed',
    'noLiveConnectorAiScanRun', 'noLiveConnectorAiScanPassed',
    'noLiveNotificationScanRun', 'noLiveNotificationScanPassed',
    'noFrontendUiScanRun', 'noFrontendUiScanPassed',
    'noTask035ToTask040ScanRun', 'noTask035ToTask040ScanPassed',
    'noFalsePassScanRun', 'noFalsePassScanPassed',
    'safeToStartTask035', 'safeToStartTask040',
    'verdict', 'commandsRun', 'filesCreated', 'filesModified', 'filesStaged',
    'filesIntentionallyNotStaged', 'remainingBlockers', 'generatedAt',
  ];
  reasons.push(...hasAllFields(input as unknown as Record<string, unknown>, requiredFields));
  if (!Array.isArray(input.commandsRun)) reasons.push('commandsRun_not_array');
  if (!Array.isArray(input.filesCreated)) reasons.push('filesCreated_not_array');
  if (!Array.isArray(input.filesModified)) reasons.push('filesModified_not_array');
  if (!Array.isArray(input.filesStaged)) reasons.push('filesStaged_not_array');
  if (!Array.isArray(input.filesIntentionallyNotStaged)) reasons.push('filesIntentionallyNotStaged_not_array');
  if (!Array.isArray(input.remainingBlockers)) reasons.push('remainingBlockers_not_array');
  if (input.task034Started !== false) reasons.push('task034Started_not_false');
  if (input.task035Started !== false) reasons.push('task035Started_not_false');
  if (input.task040Started !== false) reasons.push('task040Started_not_false');
  if (input.frontendUiCreated !== false) reasons.push('frontendUiCreated_not_false');
  if (input.schoolWideLaunchCreated !== false) reasons.push('schoolWideLaunchCreated_not_false');
  if (input.backendFreezeCreated !== false) reasons.push('backendFreezeCreated_not_false');
  if (input.hundredPercentRolloutCreated !== false) reasons.push('hundredPercentRolloutCreated_not_false');
  if (input.productionDeploymentIntroduced !== false) reasons.push('productionDeploymentIntroduced_not_false');
  if (input.realNotificationsSent !== false) reasons.push('realNotificationsSent_not_false');
  if (input.liveAiCallIntroduced !== false) reasons.push('liveAiCallIntroduced_not_false');
  if (input.liveSchoolConnectorWriteIntroduced !== false) reasons.push('liveSchoolConnectorWriteIntroduced_not_false');
  if (input.productionDataMutationExecuted !== false) reasons.push('productionDataMutationExecuted_not_false');
  if (input.rawPrivateDataStored !== false) reasons.push('rawPrivateDataStored_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034ForbiddenOutputFields(obj: Record<string, unknown>): Task034ValidationResult {
  const reasons: string[] = [];
  if (!obj || typeof obj !== 'object') return failure(['input_is_null']);
  for (const field of TASK034_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj) {
      const val = obj[field];
      if (val !== undefined && val !== null && val !== false && val !== '' && val !== 0) {
        reasons.push(`forbidden_field_non_empty_${field}`);
      }
    }
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask034ForbiddenSideEffects(obj: Record<string, unknown>): Task034ValidationResult {
  const reasons: string[] = [];
  if (!obj || typeof obj !== 'object') return failure(['input_is_null']);
  const serialized = JSON.stringify(obj);
  for (const pattern of TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS) {
    if (serialized.includes(pattern)) {
      reasons.push(`forbidden_side_effect_pattern_${pattern.replace(/[^a-zA-Z0-9_]/g, '_')}`);
    }
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function rejectTask034ForbiddenFields(obj: any): { hasForbiddenFields: boolean; matchedFields: string[] } {
  if (!obj || typeof obj !== 'object') return { hasForbiddenFields: false, matchedFields: [] };
  const matched: string[] = [];
  for (const field of TASK034_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj) matched.push(field);
  }
  return { hasForbiddenFields: matched.length > 0, matchedFields: matched };
}

export function redactTask034SensitiveValue(value: string): string {
  if (!value) return value;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+\d{1,3}\d{6,14}/g;
  return value
    .replace(emailRegex, 'REDACTED')
    .replace(phoneRegex, 'REDACTED')
    .replace(/Bearer\s+\S+/gi, 'Bearer REDACTED')
    .replace(/sk-proj-\S+/g, 'sk-proj-REDACTED')
    .replace(/sk-ant-\S+/g, 'sk-ant-REDACTED');
}

export function createSafeTask034ValidationError(title: string, reasonCodes: string[]): { error: string; reasonCodes: string[]; safe: true; timestamp: string } {
  return {
    error: `[TASK034_VALIDATION_ERROR] ${title}`,
    reasonCodes: [...new Set(reasonCodes)],
    safe: true as const,
    timestamp: new Date().toISOString(),
  };
}
