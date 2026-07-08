export type OperationalEnvironment = 'development' | 'test' | 'production' | 'staging';

export type OperationalComponentStatus = 'healthy' | 'degraded' | 'unhealthy' | 'blocked' | 'unknown' | 'not_applicable';

export type OperationalSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type OperationalHealthCheckResult = {
  component: string;
  status: OperationalComponentStatus;
  checkedAt: string;
  durationMs?: number;
  safeMessage: string;
  reasonCode?: string;
};

export type OperationalMetricsSnapshot = {
  timestamp: string;
  requestId: string;
  requestCount: number;
  errorCount: number;
  rateLimitCount: number;
  readinessStatusCounts: Record<string, number>;
  incidentCountBySeverity: Record<string, number>;
  incidentCountByCategory: Record<string, number>;
  contentGapCount: number;
  approvedSourceUnavailableCount: number;
  schoolContextDeniedCount: number;
  aiGatewayBlockedCount: number;
  databaseReadinessFailures: number;
  backupReadinessStatus: string;
  restoreDrillStatus: string;
};

export type TelemetryEventCategory =
  | 'request'
  | 'response'
  | 'error'
  | 'audit'
  | 'incident'
  | 'readiness'
  | 'health'
  | 'backup'
  | 'restore'
  | 'data_integrity'
  | 'admin'
  | 'unknown';

export type TelemetryPrivacyLevel = 'safe_metadata' | 'minimal_necessary' | 'unsafe_rejected';

export type TelemetryEvent = {
  id: string;
  timestamp: string;
  component: string;
  category: TelemetryEventCategory;
  severity: OperationalSeverity;
  status: OperationalComponentStatus;
  safeReasonCode?: string;
  safeSummary?: string;
  schoolScopeCount?: number;
  correlationId?: string;
  durationMs?: number;
  count?: number;
  booleanFlags?: Record<string, boolean>;
};

export type IncidentSignal = {
  source: string;
  component: string;
  signalType: string;
  detectedAt: string;
  safeSummary: string;
  metadata?: Record<string, unknown>;
};

export type IncidentCategory =
  | 'availability'
  | 'database'
  | 'migration'
  | 'school_integration'
  | 'content_governance'
  | 'ai_gateway'
  | 'privacy'
  | 'safeguarding'
  | 'deen_governance'
  | 'rate_limit'
  | 'security'
  | 'backup'
  | 'restore'
  | 'data_integrity'
  | 'configuration'
  | 'observability'
  | 'unknown';

export type IncidentSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'detected' | 'classifying' | 'responding' | 'contained' | 'resolved' | 'monitoring' | 'closed';

export type IncidentRecord = {
  id: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  safeTitle: string;
  safeSummary: string;
  reasonCodes: string[];
  affectedComponents: string[];
  recommendedOwnerRole: string;
  studentSafetyRelevant: boolean;
  privacyRelevant: boolean;
  deenGovernanceRelevant: boolean;
  detectedAt: string;
  classifiedAt?: string;
  respondedAt?: string;
  resolvedAt?: string;
  correlationId?: string;
};

export type IncidentResponseStep = {
  order: number;
  action: string;
  stepType: 'containment' | 'verification' | 'communication' | 'rollback' | 'data_protection' | 'student_safety' | 'deen_referral' | 'recovery' | 'post_incident';
  safeDescription: string;
};

export type IncidentResponsePlan = {
  incidentId: string;
  safeTitle: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  containmentSteps: IncidentResponseStep[];
  verificationSteps: IncidentResponseStep[];
  communicationGuidance: string;
  rollbackConsideration: string;
  dataProtectionSteps: IncidentResponseStep[];
  studentSafetyEscalation: string;
  deenReferralReminder: string;
  recoverySteps: IncidentResponseStep[];
  postIncidentReviewChecklist: string[];
  generatedAt: string;
};

export type BackupReadinessResult = {
  ready: boolean;
  configPresent: boolean;
  databaseProvider: string;
  backupCommandDocumented: boolean;
  backupDestinationConfigured: boolean;
  backupScheduleDocumented: boolean;
  retentionPolicyDocumented: boolean;
  encryptionAtRestExpected: boolean;
  restoreDrillPlanExists: boolean;
  manualApprovalRequired: boolean;
  safeSummary: string;
  safeDetails: string[];
};

export type BackupManifestSummary = {
  backupId: string;
  createdAt: string;
  sizeEstimateBytes?: number;
  recordCount?: number;
  checksumVerified: boolean;
  tables: string[];
};

export type RestoreDrillResult = {
  success: boolean;
  drillType: string;
  dataSource: string;
  recordsRestored: number;
  integrityChecksPassed: boolean;
  integrityCheckDetails: string[];
  destructiveCommandExecuted: boolean;
  realProductionDataOverwritten: boolean;
  manualApprovalBeforeRestore: boolean;
  safeSummary: string;
};

export type DataIntegrityCheckResult = {
  tableOrModel: string;
  accessible: boolean;
  orphanCount: number;
  missingRequiredRelationCount: number;
  invalidStatusCount: number;
  duplicateActiveMappingCount: number;
  recordCount: number;
  latestSafeTimestamp?: string;
  issues: string[];
};

export type OperationsRouteAccessPolicy = {
  route: string;
  method: string;
  allowedRoles: string[];
  requiresAuth: boolean;
  requiresSchoolContext: boolean;
  safeDenialMessage: string;
};

export type OperationsAuditRecord = {
  incidentId: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  safeSummary: string;
  reasonCodes: string[];
  actorRole?: string;
  timestamp: string;
  correlationId?: string;
  component: string;
  actionTaken: string;
};

export type OperationalHardeningChecklistItem = {
  check: string;
  passed: boolean;
  safeDetail: string;
};

export type OperationalHardeningChecklistResult = {
  timestamp: string;
  overallPass: boolean;
  checks: OperationalHardeningChecklistItem[];
  failedChecks: string[];
};

export type Task024OperationsReport = {
  taskId: string;
  scope: string;
  verdict: string;
  summary: string;
  operationsContractsCreated: boolean;
  safeTelemetryServiceCreated: boolean;
  redactionLeakDetectionCreated: boolean;
  operationalHealthAggregatorCreated: boolean;
  metricsSnapshotServiceCreated: boolean;
  incidentDetectionCreated: boolean;
  incidentClassificationCreated: boolean;
  incidentResponseWorkflowCreated: boolean;
  incidentAuditCreated: boolean;
  backupReadinessCreated: boolean;
  restoreDrillCreated: boolean;
  dataIntegrityVerificationCreated: boolean;
  operationalHardeningChecklistCreated: boolean;
  operationsRoutesCreatedOrHardened: boolean;
  operationsRoutesAdminScoped: boolean;
  learnerDeniedOperationsRoutes: boolean;
  unauthenticatedDeniedOperationsRoutes: boolean;
  adminInternalAccessAllowed: boolean;
  telemetryPrivacySafe: boolean;
  redactionVerified: boolean;
  secretLeakDetectionVerified: boolean;
  privateDataLeakDetectionVerified: boolean;
  incidentDetectionVerified: boolean;
  incidentClassificationVerified: boolean;
  incidentResponsePlanVerified: boolean;
  incidentAuditMetadataOnly: boolean;
  backupReadinessVerified: boolean;
  restoreDrillVerified: boolean;
  restoreDrillNonDestructive: boolean;
  dataIntegrityChecksVerified: boolean;
  task021OperationalMonitoringVerified: boolean;
  task022OperationalMonitoringVerified: boolean;
  task023OperationalMonitoringVerified: boolean;
  rawChatExcluded: boolean;
  privateMemoryExcluded: boolean;
  safeguardingRawExcluded: boolean;
  deenSensitiveRawExcluded: boolean;
  providerResponseExcluded: boolean;
  aiPromptExcluded: boolean;
  answerKeyProtected: boolean;
  teacherOnlyContentProtected: boolean;
  tokensSecretsExcluded: boolean;
  databaseUrlMasked: boolean;
  noDirectAiProviderCallIntroduced: boolean;
  noLiveAiCallInTests: boolean;
  noDestructiveDbCommandIntroduced: boolean;
  noDestructiveBackupRestoreCommandIntroduced: boolean;
  prismaSchemaChanged: boolean;
  prismaMigrationCreated: boolean;
  prismaMigrationDecision: string;
  task024FocusedTestsRun: boolean;
  task024FocusedTestsPassed: boolean;
  operationsSmokeTestsRun: boolean;
  operationsSmokeTestsPassed: boolean;
  affectedBackendTestsRun: boolean;
  affectedBackendTestsPassed: boolean;
  backendTypecheckRun: boolean;
  backendTypecheckPassed: boolean;
  backendBuildRun: boolean;
  backendBuildPassed: boolean;
  prismaValidateRun: boolean;
  prismaValidatePassed: boolean;
  prismaGenerateRun: boolean;
  prismaGeneratePassed: boolean;
  jsonReportValidationRun: boolean;
  jsonReportValidationPassed: boolean;
  frontendTouched: boolean;
  frontendVerificationRequired: boolean;
  aiFilesTouched: boolean;
  affectedAiTestsRun: boolean;
  affectedAiTestsPassed: boolean;
  docsCreated: string[];
  reportsCreated: string[];
  filesCreated: string[];
  filesChanged: string[];
  commandsRun: string[];
  commandsSkipped: string[];
  testsPassedCount: number;
  testsFailedCount: number;
  task024Failures: string[];
  outsideTask024ScopeFailures: string[];
  externalBlockers: string[];
  remainingRequiredEndToEndGates: string[];
  safeToStartTask025: boolean;
  recommendedNextTask: string;
};

export const OPERATIONAL_STATUS_VALUES: OperationalComponentStatus[] = [
  'healthy', 'degraded', 'unhealthy', 'blocked', 'unknown', 'not_applicable',
];

export const INCIDENT_SEVERITY_VALUES: IncidentSeverity[] = [
  'info', 'low', 'medium', 'high', 'critical',
];

export const INCIDENT_CATEGORY_VALUES: IncidentCategory[] = [
  'availability', 'database', 'migration', 'school_integration',
  'content_governance', 'ai_gateway', 'privacy', 'safeguarding',
  'deen_governance', 'rate_limit', 'security', 'backup', 'restore',
  'data_integrity', 'configuration', 'observability', 'unknown',
];
