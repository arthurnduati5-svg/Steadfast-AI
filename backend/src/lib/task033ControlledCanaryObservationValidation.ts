import {
  TASK033_ALLOWED_ENVIRONMENT_TYPES,
  TASK033_ALLOWED_OBSERVATION_MODES,
  TASK033_ALLOWED_DATA_MODES,
  TASK033_ALLOWED_SIDE_EFFECT_MODES,
  TASK033_ALLOWED_ACTOR_ROLES,
  TASK033_DENIED_ACTOR_ROLES,
  TASK033_FORBIDDEN_OUTPUT_FIELDS,
  TASK033_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK033_VALID_STATE_TRANSITIONS,
  TASK033_OBSERVATION_STAGE_IDS,
  resolveTask033ActorRole,
  isTask033AdminOperatorRole,
  isTask033DeniedRole,
  Task033ObservationEventInput,
  Task033ObservationSafeAggregate,
  Task033ControlledCanaryObservationReport,
} from '../contracts/task033ControlledCanaryObservationContracts';

export interface Task033ValidationResult {
  ok: boolean;
  reasonCodes: string[];
}

function success(): Task033ValidationResult {
  return { ok: true, reasonCodes: [] };
}

function failure(reasonCodes: string[]): Task033ValidationResult {
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

export function validateTask033DependencyProof(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'commitFound', 'commitHash', 'task032ReportFound', 'task032OpsReportFound',
    'verdict', 'safeToStartTask033', 'safeToStartTask034', 'safeToStartTask035', 'safeToStartTask040',
    'task032FocusedTestsPassed', 'task020To032RegressionPassed', 'phase3RegressionPassed',
    'fullBackendSuitePassed', 'backendBuildPassed', 'backendTypecheckPassed',
    'prismaValidatePassed', 'prismaGeneratePassed', 'task032VerificationScriptPassed',
    'privacyScanPassed', 'noProductionMutationScanPassed', 'noLiveConnectorAiScanPassed',
    'noLiveNotificationScanPassed', 'noFrontendUiScanPassed', 'noTask033ToTask040ScanPassed',
    'noFalsePassScanPassed', 'correctiveCommitNoForbidden', 'remainingBlockers', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (input.ok !== true) reasons.push('ok_not_true');
  if (input.commitFound !== true) reasons.push('commitFound_not_true');
  if (input.task032ReportFound !== true) reasons.push('task032ReportFound_not_true');
  if (input.verdict !== 'ACCEPTED_READY_YES') reasons.push('verdict_not_ACCEPTED_READY_YES');
  if (input.safeToStartTask033 !== true) reasons.push('safeToStartTask033_not_true');
  if (input.safeToStartTask034 !== false) reasons.push('safeToStartTask034_not_false');
  if (input.safeToStartTask035 !== false) reasons.push('safeToStartTask035_not_false');
  if (input.safeToStartTask040 !== false) reasons.push('safeToStartTask040_not_false');
  if (!Array.isArray(input.remainingBlockers)) reasons.push('remainingBlockers_not_array');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033EnvironmentGateInput(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'environmentType', 'observationMode', 'dataMode', 'sideEffectMode',
    'task032Accepted', 'task033Started', 'task034Started', 'task035Started', 'task040Started',
    'rolloutRequested', 'schoolWideLaunchRequested', 'backendFreezeRequested',
    'trafficRoutingRequested', 'cohortExpansionRequested',
    'liveAiRequested', 'liveConnectorRequested', 'liveNotificationRequested',
    'productionDeploymentRequested', 'productionMutationRequested', 'frontendUiRequested',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (input.environmentType !== 'controlled_canary_observation') reasons.push('environmentType_not_controlled_canary_observation');
  if (input.observationMode !== 'internal_observation_only') reasons.push('observationMode_not_internal_observation_only');
  if (input.dataMode !== 'safe_aggregate_only') reasons.push('dataMode_not_safe_aggregate_only');
  if (input.sideEffectMode !== 'internal_observation_store_only') reasons.push('sideEffectMode_not_internal_observation_store_only');
  if (input.task032Accepted !== true) reasons.push('task032Accepted_not_true');
  if (input.task033Started !== false) reasons.push('task033Started_not_false');
  if (input.task034Started !== false) reasons.push('task034Started_not_false');
  if (input.task035Started !== false) reasons.push('task035Started_not_false');
  if (input.task040Started !== false) reasons.push('task040Started_not_false');
  if (input.rolloutRequested !== false) reasons.push('rolloutRequested_not_false');
  if (input.schoolWideLaunchRequested !== false) reasons.push('schoolWideLaunchRequested_not_false');
  if (input.backendFreezeRequested !== false) reasons.push('backendFreezeRequested_not_false');
  if (input.trafficRoutingRequested !== false) reasons.push('trafficRoutingRequested_not_false');
  if (input.cohortExpansionRequested !== false) reasons.push('cohortExpansionRequested_not_false');
  if (input.liveAiRequested !== false) reasons.push('liveAiRequested_not_false');
  if (input.liveConnectorRequested !== false) reasons.push('liveConnectorRequested_not_false');
  if (input.liveNotificationRequested !== false) reasons.push('liveNotificationRequested_not_false');
  if (input.productionDeploymentRequested !== false) reasons.push('productionDeploymentRequested_not_false');
  if (input.productionMutationRequested !== false) reasons.push('productionMutationRequested_not_false');
  if (input.frontendUiRequested !== false) reasons.push('frontendUiRequested_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033ObservationSessionInput(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['sessionId', 'activationId', 'schoolId', 'cohortId', 'actorRole']));
  const resolvedRole = resolveTask033ActorRole(String(input.actorRole || ''));
  if (!TASK033_ALLOWED_ACTOR_ROLES.includes(resolvedRole)) reasons.push('actorRole_not_allowed');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033ObservationEventInput(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'eventId', 'sessionId', 'activationId', 'schoolId', 'actorRole',
    'safeActorHash', 'safeStudentHash', 'cohortId', 'classId', 'subjectId',
    'eventType', 'safeReasonCodes', 'safeSummary', 'gateName',
    'gatePassed', 'latencyMs', 'errorCategory', 'createdAt',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  const resolvedRole = resolveTask033ActorRole(String(input.actorRole || ''));
  if (!TASK033_ALLOWED_ACTOR_ROLES.includes(resolvedRole)) reasons.push('actorRole_not_allowed');
  if (!Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  if (typeof input.latencyMs !== 'number') reasons.push('latencyMs_not_number');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033EventSafety(input: Task033ObservationEventInput): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  if (!input.safeActorHash || input.safeActorHash.startsWith('raw_')) reasons.push('unsafe_actor_hash');
  if (!input.safeStudentHash || input.safeStudentHash.startsWith('raw_')) reasons.push('unsafe_student_hash');
  if (!input.safeSummary || /raw/i.test(input.safeSummary)) reasons.push('unsafe_summary_contains_raw');
  if (input.safeReasonCodes && !Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  if (input.forbiddenFields && typeof input.forbiddenFields === 'object') {
    for (const field of TASK033_FORBIDDEN_OUTPUT_FIELDS) {
      if (field in input.forbiddenFields) reasons.push(`event_has_forbidden_field_${field}`);
    }
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033AggregateSafety(aggregate: Task033ObservationSafeAggregate): Task033ValidationResult {
  const reasons: string[] = [];
  if (!aggregate || typeof aggregate !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'sessionId', 'totalObservedEvents', 'allowedEventCount', 'deniedEventCount',
    'safeDenialCount', 'privacyBoundaryPassCount', 'privacyBoundaryFailureCount',
    'schoolIdentityPassCount', 'schoolIdentityFailureCount',
    'contentGovernancePassCount', 'contentGovernanceFailureCount',
    'socraticPassCount', 'socraticFailureCount',
    'deenBoundaryPassCount', 'deenBoundaryFailureCount',
    'runtimeGuardPassCount', 'runtimeGuardFailureCount',
    'incidentSignalCount', 'criticalIncidentSignalCount',
    'rollbackReadinessPassCount', 'rollbackReadinessFailureCount',
    'driftSignalCount', 'healthBudgetPassCount', 'healthBudgetFailureCount',
    'generatedAt',
  ];
  reasons.push(...hasAllFields(aggregate as unknown as Record<string, unknown>, requiredFields));
  const ag = aggregate as unknown as Record<string, unknown>;
  for (const numericField of ['totalObservedEvents', 'allowedEventCount', 'deniedEventCount', 'safeDenialCount',
    'privacyBoundaryPassCount', 'privacyBoundaryFailureCount',
    'schoolIdentityPassCount', 'schoolIdentityFailureCount',
    'contentGovernancePassCount', 'contentGovernanceFailureCount',
    'socraticPassCount', 'socraticFailureCount',
    'deenBoundaryPassCount', 'deenBoundaryFailureCount',
    'runtimeGuardPassCount', 'runtimeGuardFailureCount',
    'incidentSignalCount', 'criticalIncidentSignalCount',
    'rollbackReadinessPassCount', 'rollbackReadinessFailureCount',
    'driftSignalCount', 'healthBudgetPassCount', 'healthBudgetFailureCount']) {
    if (typeof ag[numericField] !== 'number') reasons.push(`${numericField}_not_number`);
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033HealthObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'observationLatencyP95Ms', 'eventIntakeLatencyP95Ms', 'safeReadLatencyP95Ms',
    'aggregationLatencyP95Ms', 'errorRate', 'criticalErrorCount', 'timeoutCount',
    'observationStoreErrorCount', 'privacyBoundaryFailureCount', 'schoolContextBypassCount',
    'crossSchoolAttemptCount', 'runtimeGuardDenialCount', 'healthBudgetPassed', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (typeof input.observationLatencyP95Ms !== 'number') reasons.push('observationLatencyP95Ms_not_number');
  if (typeof input.errorRate !== 'number') reasons.push('errorRate_not_number');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033RuntimeGuardObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'sessionBeforeSchoolContextBlocked', 'memoryAccessBeforeSchoolContextBlocked',
    'aiCallBeforeSchoolContextBlocked', 'tutorContextBeforeApprovedCurriculumBlocked',
    'crossSchoolAccessBlocked', 'learnerToLearnerVisibilityBlocked',
    'parentRawDetailExposureBlocked', 'teacherOnlyLeakageBlocked',
    'unsafeDeenAuthorityBlocked', 'answerBotBehaviorBlocked', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033PrivacyObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'rawLearnerProfilesBlocked', 'realEmailsBlocked', 'realPhoneNumbersBlocked',
    'parentContactDataBlocked', 'rawChatBlocked', 'rawStudentAnswersBlocked',
    'rawStudentWorkBlocked', 'safeguardingRawNotesBlocked', 'privateDeenTextBlocked',
    'answerKeysBlocked', 'markingSchemesBlocked', 'teacherPrivateNotesBlocked',
    'providerPromptsResponsesBlocked', 'hiddenReasoningBlocked', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033ContentGovernanceObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'approvedSourceContextRequired', 'unapprovedSourceUsageDenied',
    'teacherOnlySourceNotExposedToLearnerRoute', 'answerKeyContentNotExposed',
    'contentGapSafeReferral', 'noInventedTeachingClaim', 'curriculumScopePreserved',
    'sourceGovernancePolicyPreserved', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033SocraticIntegrityObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'hintsFirstBehaviorPreserved', 'noFinalAnswerLeakage', 'noAnswerBotShortcut',
    'studentAttemptRequiredForPractice', 'reflectionPathPreserved', 'cheatingPreventionPreserved',
    'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033DeenBoundaryObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'notFatwaEngine', 'approvedDeenSourceRequired', 'teacherScholarReferralPreserved',
    'sectarianSafetyPreserved', 'privateDeenTextNotExposed', 'noPietyScoring',
    'noUnsafeAuthorityClaim', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033SchoolIdentityObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'verifiedSchoolIdentityRequired', 'unknownSchoolDenied', 'crossSchoolAccessDenied',
    'actorRoleRequired', 'actorRoleScoped', 'learnerSeesOwnSafeStatusOnly',
    'teacherSeesSafeClassSummaryWhereAllowed', 'adminSeesSafeAggregateOnly', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033CrossSchoolDenialObservation(input: any): Task033ValidationResult {
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

export function validateTask033IncidentSignalObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'incidentSignalCount', 'criticalSignalCount', 'safeReasonCodes', 'safeSeverity',
    'safeCategory', 'safeSummary', 'rollbackRecommended', 'pauseRecommended',
    'killSwitchRecommended', 'realAlertSent', 'realEmailSent', 'realSmsSent',
    'realWhatsappSent', 'externalTicketCreated', 'webhookCalled',
    'rawIncidentDetailsExposed', 'safeguardingRawExposed', 'blockingIssues',
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
  if (input.safeguardingRawExposed !== false) reasons.push('safeguardingRawExposed_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033RollbackReadinessObservation(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'rollbackAvailable', 'pauseAvailable', 'killSwitchAvailable',
    'rollbackPlanStillValid', 'rollbackOwnerAssigned', 'runtimeBlockableByRollback',
    'safeAuditSummaryPreservedOnRollback', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033DriftDetection(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'driftDetected', 'driftCodes', 'rolloutRequestObserved', 'cohortExpansionRequestObserved',
    'trafficRoutingRequestObserved', 'schoolWideLaunchRequestObserved', 'backendFreezeRequestObserved',
    'liveAiRequestObserved', 'liveConnectorRequestObserved', 'liveNotificationRequestObserved',
    'productionDeploymentRequestObserved', 'rawPrivateDataFieldObserved', 'answerArtifactFieldObserved',
    'recommendation', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!Array.isArray(input.driftCodes)) reasons.push('driftCodes_not_array');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033SafeReadModel(input: any): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'sessionId', 'activationId', 'schoolId', 'status', 'observationStage',
    'observedEventCount',
    'healthStatus', 'privacyStatus', 'governanceStatus', 'socraticStatus',
    'deenStatus', 'schoolIdentityStatus', 'incidentStatus', 'rollbackReadinessStatus',
    'driftStatus', 'safeToStartTask034', 'safeToStartTask035', 'safeToStartTask040',
    'safeReasonCodes', 'generatedAt',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (!('safeAggregate' in input)) reasons.push('missing_safeAggregate');
  if (input.safeAggregate !== null && (typeof input.safeAggregate !== 'object' || Array.isArray(input.safeAggregate))) reasons.push('safeAggregate_invalid');
  if (!Array.isArray(input.safeReasonCodes)) reasons.push('safeReasonCodes_not_array');
  if (input.safeToStartTask034 !== false) reasons.push('safeToStartTask034_not_false');
  if (input.safeToStartTask035 !== false) reasons.push('safeToStartTask035_not_false');
  if (input.safeToStartTask040 !== false) reasons.push('safeToStartTask040_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033ReportTruth(input: Task033ControlledCanaryObservationReport): Task033ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'taskId', 'scope', 'task032DependencyCommit', 'task032DependencyVerified',
    'task033Started', 'task034Started', 'task035Started', 'task040Started',
    'frontendUiCreated', 'rolloutCreated', 'schoolWideLaunchCreated', 'backendFreezeCreated',
    'productionDeploymentIntroduced', 'realNotificationsSent', 'liveAiCallIntroduced',
    'liveSchoolConnectorWriteIntroduced', 'productionDataMutationExecuted',
    'rawPrivateDataStored', 'controlledCanaryObservationCreated',
    'controlledCanaryRolloutCreated', 'schoolWideLaunchReadinessCreated',
    'contractsCreatedOrUpdated', 'validationCreatedOrUpdated', 'repositoryCreatedOrUpdated',
    'servicesCreatedOrUpdated', 'routesCreatedOrUpdated', 'routesMountedOrDirectlyTested',
    'verifiedSchoolContextRequired', 'task032AcceptanceRequired',
    'observationEnvironmentGatePassed', 'observationSessionStateMachinePassed',
    'observationEventIntakePassed', 'safeAggregationPassed', 'healthObservationPassed',
    'runtimeGuardObservationPassed', 'privacyObservationPassed',
    'contentGovernanceObservationPassed', 'socraticIntegrityObservationPassed',
    'deenBoundaryObservationPassed', 'schoolIdentityObservationPassed',
    'crossSchoolDenialObservationPassed', 'incidentSignalObservationPassed',
    'rollbackReadinessObservationPassed', 'driftDetectionPassed', 'safeReadModelPassed',
    'evidenceLedgerPassed', 'diagnosticsPassed', 'reportPassed',
    'task033FocusedTestsRun', 'task033FocusedTestsPassed', 'task033FocusedTestFiles',
    'task033FocusedTestsPassedCount', 'task033FocusedTestsFailedCount',
    'task020To032RegressionRun', 'task020To032RegressionPassed',
    'phase3RegressionRun', 'phase3RegressionPassed',
    'fullBackendSuiteRun', 'fullBackendSuitePassed', 'fullBackendSuiteFailedFiles',
    'fullBackendSuiteFailedTests', 'prismaValidateRun', 'prismaValidatePassed',
    'prismaGenerateRun', 'prismaGeneratePassed', 'backendBuildRun', 'backendBuildPassed',
    'backendTypecheckRun', 'backendTypecheckPassed',
    'task033VerificationScriptRun', 'task033VerificationScriptPassed',
    'privacyScanRun', 'privacyScanPassed',
    'noProductionMutationScanRun', 'noProductionMutationScanPassed',
    'noLiveConnectorAiScanRun', 'noLiveConnectorAiScanPassed',
    'noLiveNotificationScanRun', 'noLiveNotificationScanPassed',
    'noFrontendUiScanRun', 'noFrontendUiScanPassed',
    'noTask034ToTask040ScanRun', 'noTask034ToTask040ScanPassed',
    'noFalsePassScanRun', 'noFalsePassScanPassed',
    'safeToStartTask034', 'safeToStartTask035', 'safeToStartTask040',
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
  if (input.task033Started !== false) reasons.push('task033Started_not_false');
  if (input.task034Started !== false) reasons.push('task034Started_not_false');
  if (input.task035Started !== false) reasons.push('task035Started_not_false');
  if (input.task040Started !== false) reasons.push('task040Started_not_false');
  if (input.frontendUiCreated !== false) reasons.push('frontendUiCreated_not_false');
  if (input.rolloutCreated !== false) reasons.push('rolloutCreated_not_false');
  if (input.schoolWideLaunchCreated !== false) reasons.push('schoolWideLaunchCreated_not_false');
  if (input.backendFreezeCreated !== false) reasons.push('backendFreezeCreated_not_false');
  if (input.productionDeploymentIntroduced !== false) reasons.push('productionDeploymentIntroduced_not_false');
  if (input.realNotificationsSent !== false) reasons.push('realNotificationsSent_not_false');
  if (input.liveAiCallIntroduced !== false) reasons.push('liveAiCallIntroduced_not_false');
  if (input.liveSchoolConnectorWriteIntroduced !== false) reasons.push('liveSchoolConnectorWriteIntroduced_not_false');
  if (input.productionDataMutationExecuted !== false) reasons.push('productionDataMutationExecuted_not_false');
  if (input.rawPrivateDataStored !== false) reasons.push('rawPrivateDataStored_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033ForbiddenOutputFields(obj: Record<string, unknown>): Task033ValidationResult {
  const reasons: string[] = [];
  if (!obj || typeof obj !== 'object') return failure(['input_is_null']);
  for (const field of TASK033_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj) {
      const val = obj[field];
      if (val !== undefined && val !== null && val !== false && val !== '' && val !== 0) {
        reasons.push(`forbidden_field_non_empty_${field}`);
      }
    }
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask033ForbiddenSideEffects(obj: Record<string, unknown>): Task033ValidationResult {
  const reasons: string[] = [];
  if (!obj || typeof obj !== 'object') return failure(['input_is_null']);
  const serialized = JSON.stringify(obj);
  for (const pattern of TASK033_FORBIDDEN_SIDE_EFFECT_PATTERNS) {
    if (serialized.includes(pattern)) {
      reasons.push(`forbidden_side_effect_pattern_${pattern.replace(/[^a-zA-Z0-9_]/g, '_')}`);
    }
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function rejectTask033ForbiddenFields(obj: any): { hasForbiddenFields: boolean; matchedFields: string[] } {
  if (!obj || typeof obj !== 'object') return { hasForbiddenFields: false, matchedFields: [] };
  const matched: string[] = [];
  for (const field of TASK033_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj) matched.push(field);
  }
  return { hasForbiddenFields: matched.length > 0, matchedFields: matched };
}

export function redactTask033SensitiveValue(value: string): string {
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

export function createSafeTask033ValidationError(title: string, reasonCodes: string[]): { error: string; reasonCodes: string[]; safe: true; timestamp: string } {
  return {
    error: `[TASK033_VALIDATION_ERROR] ${title}`,
    reasonCodes: [...new Set(reasonCodes)],
    safe: true as const,
    timestamp: new Date().toISOString(),
  };
}
