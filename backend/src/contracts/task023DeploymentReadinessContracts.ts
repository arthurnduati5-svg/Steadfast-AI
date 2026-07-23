export type DeploymentEnvironment = 'development' | 'test' | 'staging' | 'production' | 'production_candidate' | 'unknown';

export type DeploymentReadinessStatus = 'ready' | 'not_ready' | 'degraded' | 'blocked' | 'skipped' | 'not_applicable';

export type ReadinessSeverity = 'info' | 'warning' | 'error' | 'critical';

export type Task023EnvironmentGateStatus = 'pass' | 'warning' | 'fail' | 'blocked' | 'not_applicable' | 'unknown';

export type Task023SecretSafetyStatus = 'present_safe' | 'missing' | 'placeholder' | 'unsafe_value' | 'leaked' | 'not_required' | 'blocked' | 'unknown';

export type Task023PrismaSafetyStatus = 'schema_valid' | 'schema_invalid' | 'generate_passed' | 'generate_failed' | 'migration_dry_run_safe' | 'migration_risk_detected' | 'migration_not_checked' | 'blocked' | 'unknown';

export type Task023MigrationRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type Task023DeploymentReadinessDecision = 'ready' | 'ready_with_warnings' | 'not_ready' | 'blocked' | 'unknown';

export type Task023ReleaseSmokeStatus = 'not_started' | 'passed' | 'failed' | 'partial' | 'blocked' | 'not_applicable' | 'unknown';

export type Task023RollbackReadinessStatus = 'ready' | 'missing_plan' | 'missing_owner' | 'missing_commands' | 'missing_data_safety_notes' | 'blocked' | 'unknown';

export type Task023DependencyReadinessStatus = 'ready' | 'missing_report' | 'missing_implementation' | 'regression_failed' | 'not_checked' | 'blocked' | 'unknown';

export type Task023RouteProtectionStatus = 'protected' | 'public_allowed' | 'public_unexpected' | 'missing_school_auth' | 'missing_verified_school_context' | 'missing_role_scope' | 'blocked' | 'unknown';

export type Task023DiagnosticSeverity = 'info' | 'warning' | 'error' | 'critical' | 'blocked';

export type Task023AuditEventType = 'deployment_readiness_evaluated' | 'environment_gate_evaluated' | 'secret_safety_evaluated' | 'production_config_evaluated' | 'prisma_schema_validated' | 'prisma_generate_validated' | 'migration_safety_evaluated' | 'startup_gate_evaluated' | 'dependency_readiness_evaluated' | 'release_smoke_dry_run_evaluated' | 'rollback_readiness_evaluated' | 'route_protection_evaluated' | 'deployment_security_privacy_evaluated' | 'diagnostic_viewed' | 'readiness_block_returned';

export const TASK023_ENVIRONMENT_TYPES: readonly DeploymentEnvironment[] = ['development', 'test', 'staging', 'production', 'production_candidate', 'unknown'] as const;

export const TASK023_REQUIRED_ENV_KEYS: readonly string[] = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'] as const;

export const TASK023_OPTIONAL_ENV_KEYS: readonly string[] = ['REDIS_URL', 'LOG_LEVEL', 'RATE_LIMIT_ENABLED', 'AI_PROVIDER_MODE', 'SCHOOL_AUTH_MODE'] as const;

export const TASK023_SECRET_KEY_PATTERNS: readonly string[] = ['SECRET', 'PASSWORD', 'PRIVATE_KEY', 'API_KEY', 'TOKEN', 'CREDENTIAL'] as const;

export const TASK023_FORBIDDEN_SECRET_VALUES: readonly string[] = ['changeme', 'change-me', 'change_me', 'placeholder', 'example', 'dummy', 'test-secret', 'your-key-here', 'your-api-key', 'sk-your', 'replaceme'] as const;

export const TASK023_FORBIDDEN_REPORT_FIELDS: readonly string[] = [
  'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET',
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY',
  'PINECONE_API_KEY', 'STRIPE_SECRET_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY',
  'SMTP_PASSWORD', 'PRIVATE_KEY', 'ACCESS_TOKEN', 'REFRESH_TOKEN', 'ID_TOKEN',
  'AUTHORIZATION', 'COOKIE', 'rawEnv', 'rawSecret', 'rawConnectionString',
  'rawProviderPayload', 'providerPrompt', 'providerResponse', 'chainOfThought',
  'hiddenReasoning', 'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'rawStudentData', 'rawParentData', 'rawTeacherData', 'safeguardingRaw', 'privateDeenText',
] as const;

export interface ReadinessCheckResult {
  name: string;
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  required: boolean;
  message: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface EnvironmentVariableRequirement {
  variable: string;
  required: boolean;
  present: boolean;
  valid: boolean;
  severity: ReadinessSeverity;
  reasonCode: string;
}

export interface SecretValidationResult {
  variable: string;
  present: boolean;
  valid: boolean;
  severity: ReadinessSeverity;
  reasonCode: string;
  masked: boolean;
}

export interface DatabaseReadinessResult {
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  message: string;
  latencyMs?: number;
  connectionVerified: boolean;
  requiredModelsAvailable: string[];
  requiredModelsMissing: string[];
}

export interface PrismaReadinessResult {
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  schemaExists: boolean;
  clientAvailable: boolean;
  requiredModelsAvailable: string[];
  requiredModelsMissing: string[];
  message: string;
}

export interface MigrationSafetyResult {
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  migrationsExist: boolean;
  migrationCount: number;
  dangerousPatternsFound: string[];
  safePatternsFound: string[];
  blocked: boolean;
  message: string;
}

export interface RouteRegistrationReadinessResult {
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  routeCount: number;
  registeredRoutes: string[];
  missingCriticalRoutes: string[];
  message: string;
}

export interface ServiceReadinessResult {
  name: string;
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  required: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface ReleaseSmokeTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  severity: ReadinessSeverity;
  message: string;
  durationMs?: number;
  evidence?: {
    type: string;
    detail: string;
  };
}

export interface RollbackReadinessResult {
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  rollbackChecklist: string[];
  databaseRollbackCaveats: string[];
  migrationRollbackCaveats: string[];
  configRollbackCaveats: string[];
  knownNonRollbackableOperations: string[];
  manualApprovalRequired: string[];
  message: string;
}

export interface ProductionStartupGateResult {
  status: DeploymentReadinessStatus;
  severity: ReadinessSeverity;
  environmentGate: ReadinessCheckResult;
  secretValidation: ReadinessCheckResult;
  databaseReadiness: ReadinessCheckResult;
  prismaReadiness: ReadinessCheckResult;
  migrationSafety: ReadinessCheckResult;
  schoolIntegrationReadiness: ReadinessCheckResult;
  contentGovernanceReadiness: ReadinessCheckResult;
  aiGatewayReadiness: ReadinessCheckResult;
  privacyGovernanceReadiness: ReadinessCheckResult;
  rateLimitReadiness: ReadinessCheckResult;
  diagnosticsReadiness: ReadinessCheckResult;
  blocked: boolean;
  message: string;
}

export interface DeploymentReadinessReport {
  taskId: string;
  timestamp: string;
  environment: DeploymentEnvironment;
  overallStatus: DeploymentReadinessStatus;
  criticalFailures: string[];
  warnings: string[];
  safeNextActions: string[];
  componentStatuses: ReadinessCheckResult[];
  environmentSummary: EnvironmentVariableRequirement[];
  correlationId?: string;
}

export interface Task023DeploymentReadinessContext {
  actorId: string;
  actorRole: string;
  schoolId?: string;
  environmentType: DeploymentEnvironment;
  requestId?: string;
}

export interface Task023EnvironmentVariableRequirement {
  variable: string;
  required: boolean;
  present: boolean;
  valid: boolean;
  severity: ReadinessSeverity;
  reasonCode: string;
}

export interface Task023EnvironmentGateResult {
  status: Task023EnvironmentGateStatus;
  requirements: Task023EnvironmentVariableRequirement[];
  missingRequired: string[];
  placeholderDetected: string[];
  safeKeyNames: string[];
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023SecretSafetyResult {
  status: Task023SecretSafetyStatus;
  secretsChecked: string[];
  missingSecrets: string[];
  placeholderSecrets: string[];
  unsafeSecrets: string[];
  leakedDetected: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023ProductionConfigResult {
  corsSafe: boolean;
  schoolAuthEnabled: boolean;
  task020GovernanceEnabled: boolean;
  task021SchoolIntegrationEnabled: boolean;
  task022ContentGovernanceEnabled: boolean;
  liveAiProviderBlocked: boolean;
  liveSchoolConnectorBlocked: boolean;
  privacyLoggingSafe: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023PrismaSafetyResult {
  schemaStatus: Task023PrismaSafetyStatus;
  generateStatus: Task023PrismaSafetyStatus;
  schemaPath: string;
  schemaExists: boolean;
  validateCommandRun: boolean;
  validatePassed: boolean;
  generateCommandRun: boolean;
  generatePassed: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023MigrationSafetyResult {
  riskLevel: Task023MigrationRiskLevel;
  migrationsExist: boolean;
  migrationCount: number;
  destructiveCommandsFound: string[];
  dryRunCommandBlocked: boolean;
  blocked: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023StartupGateResult {
  criticalMiddlewarePresent: boolean;
  task020GateAvailable: boolean;
  task021GateAvailable: boolean;
  task022GateAvailable: boolean;
  runtimeControlsAvailable: boolean;
  noPublicUnexpectedRoutes: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023DependencyReadinessResult {
  task020Ready: boolean;
  task021Ready: boolean;
  task022Ready: boolean;
  task017Ready: boolean;
  task018Ready: boolean;
  task019Ready: boolean;
  phase3Ready: boolean;
  missingReports: string[];
  regressionsFailed: string[];
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023ReleaseSmokeResult {
  status: Task023ReleaseSmokeStatus;
  healthCheckPassed: boolean;
  authGatePassed: boolean;
  task020GovernancePassed: boolean;
  task021SchoolContextPassed: boolean;
  task022ContentGovernancePassed: boolean;
  noLiveAiPassed: boolean;
  noLiveConnectorPassed: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023RollbackReadinessResult {
  status: Task023RollbackReadinessStatus;
  planExists: boolean;
  ownerDefined: boolean;
  commandsDocumented: boolean;
  dataSafetyNotesDocumented: boolean;
  triggerConditions: string[];
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023RouteProtectionResult {
  statuses: Task023RouteProtectionStatus[];
  schoolAuthPresent: boolean;
  verifiedSchoolContextPresent: boolean;
  roleScopesPresent: boolean;
  publicRoutesCount: number;
  protectedRoutesCount: number;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023DeploymentSecurityPrivacyResult {
  noSecretsInReports: boolean;
  noRawPrivateDataInDiagnostics: boolean;
  noProviderPayloadInReadiness: boolean;
  noAnswerArtifactsInReadiness: boolean;
  noSafeguardingRawInReadiness: boolean;
  noPrivateDeenTextInReadiness: boolean;
  auditMetadataOnly: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task023ProductionReadinessDiagnostic {
  component: string;
  status: string;
  severity: Task023DiagnosticSeverity;
  reasonCode: string;
  lastChecked: string;
  metadata: Record<string, string | number | boolean>;
}

export interface Task023ProductionReadinessAuditEvent {
  eventId: string;
  schoolId?: string;
  actorId: string;
  actorRole: string;
  environmentType: DeploymentEnvironment;
  component: string;
  eventType: Task023AuditEventType;
  safeReasonCodes: string[];
  safeMetadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface Task023ProductionReadinessDecision {
  verdict: Task023DeploymentReadinessDecision;
  reasonCodes: string[];
  environmentType: DeploymentEnvironment;
  evaluatedAt: string;
  passed: boolean;
}

export interface Task023DeploymentReadinessQuery {
  actorId: string;
  actorRole: string;
  schoolId?: string;
  environmentType?: DeploymentEnvironment;
  includeDiagnostics?: boolean;
  includeAudit?: boolean;
}
