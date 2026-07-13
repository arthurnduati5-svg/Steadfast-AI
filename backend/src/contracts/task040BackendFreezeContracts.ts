export const TASK040_ACCEPTED_TASK_IDS = [
  '020', '021', '022', '023', '024', '025', '026', '027', '028', '029',
  '030', '031', '032', '033', '034', '035', '036',
] as const;

export const TASK040_REQUIRED_DEPENDENCY_TASK_IDS = ['036'] as const;

export const TASK040_REQUIRED_TASK036_COMMIT_PREFIXES = ['45f361c'] as const;

export const TASK040_REQUIRED_REPORTS = [
  'reports/task-040-final-backend-logic-freeze-v1.json',
  'reports/task-040-final-backend-logic-freeze-v1.md',
  'docs/ops/task-040/task-040-final-backend-logic-freeze-report.json',
  'docs/ops/task-040/TASK_040_FINAL_BACKEND_LOGIC_FREEZE_REPORT.md',
  'docs/ops/task-040/TASK_040_HANDOFF.md',
] as const;

export const TASK040_REQUIRED_SCRIPTS = [
  'scripts/verify-task040.ps1',
  'scripts/gen-task040-report.cjs',
  'scripts/task040-json-validate.cjs',
  'scripts/task040-privacy-scan.cjs',
  'scripts/run-task040-backend-freeze.cjs',
] as const;

export const TASK040_REQUIRED_BACKEND_FREEZE_DOCS = [
  'docs/architecture/TASK_040_FINAL_BACKEND_LOGIC_FREEZE.md',
  'docs/architecture/TASK_040_TASK036_DEPENDENCY_GATE.md',
  'docs/architecture/TASK_040_ACCEPTED_TASK_LEDGER.md',
  'docs/architecture/TASK_040_BACKEND_SURFACE_MANIFEST.md',
  'docs/architecture/TASK_040_DIRTY_WORKSPACE_CLASSIFICATION.md',
  'docs/architecture/TASK_040_CHANGE_CONTROL_POLICY.md',
  'docs/architecture/TASK_040_NO_DRIFT_AND_REGRESSION_GATE.md',
  'docs/architecture/TASK_040_PRIVACY_SECURITY_CONTENT_DEEN_FREEZE_BOUNDARIES.md',
  'docs/architecture/TASK_040_VERIFICATION_AND_ACCEPTANCE.md',
] as const;

export const TASK040_ALLOWED_FREEZE_SCOPES = [
  'freeze_contract',
  'freeze_validation',
  'freeze_repository',
  'freeze_service',
  'freeze_route',
  'freeze_test',
  'freeze_doc',
  'freeze_report',
  'freeze_script',
  'freeze_config',
] as const;

export const TASK040_FORBIDDEN_SCOPES = [
  'new_product_feature',
  'frontend_ui',
  'ai_runtime_change',
  'live_ai_activation',
  'live_connector_write',
  'live_notification_send',
  'production_deployment',
  'prisma_migration',
  'production_data_mutation',
  'future_task_implementation',
] as const;

export const TASK040_ALLOWED_ACTOR_ROLES = [
  'admin',
  'internal_operator',
  'technical_operator',
  'privacy_owner',
  'safeguarding_owner',
  'content_governance_owner',
  'deen_review_owner',
] as const;

export const TASK040_DENIED_ACTOR_ROLES = [
  'student',
  'learner',
  'parent',
  'peer',
  'teacher',
] as const;

export const TASK040_FORBIDDEN_OUTPUT_FIELDS = [
  'rawLearnerData',
  'rawChat',
  'rawAnswer',
  'parentContact',
  'teacherPrivateNote',
  'providerPayload',
  'hiddenReasoning',
  'privateDeenText',
  'answerKey',
  'markingScheme',
  'rawSafeguardingNote',
  'studentPhone',
  'studentEmail',
  'parentPhone',
  'parentEmail',
  'authorization',
  'cookie',
  'token',
  'secret',
  'password',
  'apiKey',
] as const;

export const TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS = [
  'fetch(',
  'axios',
  'http.request',
  'https.request',
  'openai',
  'anthropic',
  'gemini',
  'provider.generate',
  'generateContent',
  'chat.completions',
  'webhook',
  'liveConnector',
  'sisClient',
  'googleClassroom',
  'microsoftGraph',
  'curriculumVendorClient',
  'sendEmail',
  'sendSms',
  'sendWhatsapp',
  'sendWhatsApp',
  'nodemailer',
  'twilio',
  'smtp',
  'mailgun',
  'sendgrid',
  'pg_dump',
  'pg_restore',
  'mysqldump',
  'mongodump',
  'mongorestore',
  'prisma migrate deploy',
  'prisma db push',
  'prisma migrate reset',
  'DROP TABLE',
  'TRUNCATE TABLE',
  'DELETE FROM',
  'kubectl apply',
  'railway up',
  'vercel deploy',
  'fly deploy',
  'aws ',
  'gcloud ',
  'az ',
] as const;

export const TASK040_FORBIDDEN_MUTATION_PATTERNS = [
  'prisma migrate deploy',
  'prisma db push',
  'prisma migrate reset',
  'DROP TABLE',
  'TRUNCATE TABLE',
  'DELETE FROM',
  'kubectl apply',
  'railway up',
  'vercel deploy',
  'fly deploy',
  'aws ',
  'gcloud ',
  'az ',
] as const;

export const TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS = [
  'task041',
  'task-041',
  'TASK_041',
  'task042',
  'task-042',
  'TASK_042',
  'future task implementation',
  'next phase implementation',
] as const;

export const TASK040_ALLOWED_STAGED_PATH_PATTERNS = [
  'backend/src/contracts/task040BackendFreezeContracts.ts',
  'backend/src/lib/task040BackendFreezeValidation.ts',
  'backend/src/repositories/task040BackendFreezeRepository.ts',
  'backend/src/services/task040',
  'backend/src/routes/task040BackendFreezeRoutes.ts',
  'backend/src/tests/task-040-',
  'backend/src/tests/task040-',
  'backend/src/tests/fixtures/task040-',
  'docs/architecture/TASK_040',
  'docs/ops/task-040/',
  'reports/task-040-final-backend-logic-freeze-v1.',
  'reports/task-040-backend-suite-output',
  'scripts/verify-task040.ps1',
  'scripts/gen-task040-report.cjs',
  'scripts/task040-json-validate.cjs',
  'scripts/task040-privacy-scan.cjs',
  'scripts/run-task040-backend-freeze.cjs',
  'backend/src/index.ts',
  'vitest.config.mjs',
  'backend/vitest.config.ts',
  'package.json',
  'package-lock.json',
  'backend/package.json',
  'backend/package-lock.json',
] as const;

export const TASK040_FORBIDDEN_STAGED_PATH_PATTERNS = [
  'AI/',
  'backend/dist/',
  'frontend/',
  'mocks/',
  'docs/frontend/',
  'docs/ui-polish/',
  'logs/',
  '\.next',
  '\.env',
  '\.log$',
  '\.png$',
  '\.tmp$',
  '^tmp_',
] as const;

export const TASK040_FINAL_BACKEND_FREEZE_VERSION = '1.0.0';

export type Task040FreezeScope = typeof TASK040_ALLOWED_FREEZE_SCOPES[number];

export type Task040FreezeStatus = 'pending' | 'passed' | 'failed' | 'blocked';

export type Task040FreezeActorRole = typeof TASK040_ALLOWED_ACTOR_ROLES[number] | typeof TASK040_DENIED_ACTOR_ROLES[number] | 'unknown';

export interface Task040DependencyProof {
  ok: boolean;
  taskId: string;
  commitExists: boolean;
  commitHash: string;
  commitMessage: string;
  handoffExists: boolean;
  reportExists: boolean;
  jsonReportExists: boolean;
  verdictIsAcceptedReadyYes: boolean;
  safeToStartTask040: boolean;
  finalDecision: string;
  remainingBlockersEmpty: boolean;
  focusedTestsPassed: boolean;
  focusedTestFileCount: number;
  focusedAssertionCount: number;
  fullBackendSuitePassed: boolean;
  typeScriptPassed: boolean;
  backendBuildPassed: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  safetyScansPassed: boolean;
  noFrontendUiCommitted: boolean;
  noAiFilesCommitted: boolean;
  noTask040ImplementationCommitted: boolean;
  noBackendDistCommitted: boolean;
  noLogsCommitted: boolean;
  noGeneratedCacheTempCommitted: boolean;
  verificationScriptPassed: boolean | string;
  notes: string;
}

export interface Task040Task036Proof {
  verified: boolean;
  taskId: '036';
  commitHash: string;
  handoffPath: string;
  reportPath: string;
  jsonReportPath: string;
  acceptanceVerdict: string;
  safeToStartTask040: boolean;
  finalDecision: string;
  remainingBlockersEmpty: boolean;
  dependencyProof: Task040DependencyProof;
  checkedAt: string;
  notes: string;
}

export interface Task040AcceptedTaskLedgerEntry {
  taskId: string;
  taskName: string;
  status: string;
  acceptedCommit: string;
  safeToStartNextTask: boolean;
  safeToStartTask040ValueAtThatStage: boolean;
  reportPath: string;
  jsonReportPath: string;
  handoffPath: string;
  focusedTestsPassed: boolean;
  regressionPassed: boolean;
  fullBackendSuitePassed: boolean;
  typeScriptPassed: boolean;
  backendBuildPassed: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  safetyScansPassed: boolean;
  frontendUiCreated: boolean;
  liveAiIntroduced: boolean;
  liveConnectorWriteIntroduced: boolean;
  realNotificationsSent: boolean;
  productionDeploymentPerformed: boolean;
  productionMutationPerformed: boolean;
  remainingBlockers: string[];
  notes: string;
}

export interface Task040AcceptedTaskLedger {
  taskId: '040';
  entries: Task040AcceptedTaskLedgerEntry[];
  taskCount: number;
  complete: boolean;
  generatedAt: string;
}

export interface Task040BackendSurfaceRouteEntry {
  routePrefix: string;
  routeFile: string;
  mountedInIndex: boolean;
  middlewareUsed: string[];
  requiresVerifiedSchoolContext: boolean;
  requiresRoleScope: boolean;
  safeReadOnly: boolean;
  taskOwner: string;
  acceptedTaskId: string;
  status: string;
  notes: string;
}

export interface Task040BackendSurfaceManifest {
  taskId: '040';
  routeEntries: Task040BackendSurfaceRouteEntry[];
  routeCount: number;
  generatedAt: string;
}

export interface Task040ContractInventoryEntry {
  path: string;
  taskOwner: string;
  category: 'contract';
  isAcceptedBackendFreezeSurface: boolean;
  isGeneratedOutput: boolean;
  isLogOutput: boolean;
  isFrontend: boolean;
  isAI: boolean;
  isFutureTask: boolean;
  classification: string;
  notes: string;
}

export interface Task040ServiceInventoryEntry {
  path: string;
  taskOwner: string;
  category: 'service';
  isAcceptedBackendFreezeSurface: boolean;
  isGeneratedOutput: boolean;
  isLogOutput: boolean;
  isFrontend: boolean;
  isAI: boolean;
  isFutureTask: boolean;
  classification: string;
  notes: string;
}

export interface Task040RepositoryInventoryEntry {
  path: string;
  taskOwner: string;
  category: 'repository';
  isAcceptedBackendFreezeSurface: boolean;
  isGeneratedOutput: boolean;
  isLogOutput: boolean;
  isFrontend: boolean;
  isAI: boolean;
  isFutureTask: boolean;
  classification: string;
  notes: string;
}

export interface Task040TestInventoryEntry {
  path: string;
  taskOwner: string;
  category: 'test';
  isAcceptedBackendFreezeSurface: boolean;
  isGeneratedOutput: boolean;
  isLogOutput: boolean;
  isFrontend: boolean;
  isAI: boolean;
  isFutureTask: boolean;
  classification: string;
  notes: string;
}

export interface Task040ScriptInventoryEntry {
  path: string;
  taskOwner: string;
  category: 'script';
  isAcceptedBackendFreezeSurface: boolean;
  isGeneratedOutput: boolean;
  isLogOutput: boolean;
  isFrontend: boolean;
  isAI: boolean;
  isFutureTask: boolean;
  classification: string;
  notes: string;
}

export interface Task040ReportInventoryEntry {
  path: string;
  taskOwner: string;
  category: 'report' | 'doc';
  isAcceptedBackendFreezeSurface: boolean;
  isGeneratedOutput: boolean;
  isLogOutput: boolean;
  isFrontend: boolean;
  isAI: boolean;
  isFutureTask: boolean;
  classification: string;
  notes: string;
}

export interface Task040DirtyWorkspaceEntry {
  path: string;
  classification: Task040DirtyWorkspaceClassification;
  isStaged: boolean;
  isTrackedModified: boolean;
  isUntracked: boolean;
}

export type Task040DirtyWorkspaceClassification =
  | 'task040_freeze_artifact'
  | 'accepted_backend_artifact'
  | 'frontend_out_of_scope'
  | 'ai_out_of_scope'
  | 'future_task_contamination'
  | 'generated_output'
  | 'log_output'
  | 'cache_temp_output'
  | 'unrelated_untracked'
  | 'unknown';

export interface Task040FutureTaskContaminationEntry {
  path: string;
  pattern: string;
  classification: string;
}

export interface Task040OutOfScopeManifest {
  frontendFiles: string[];
  aiFiles: string[];
  futureTaskFiles: Task040FutureTaskContaminationEntry[];
  generatedOutputFiles: string[];
  logFiles: string[];
  cacheTempFiles: string[];
  notes: string;
}

export interface Task040NoDriftCheck {
  ok: boolean;
  task036ReportStillAccepted: boolean;
  task036SafeToStartTask040StillTrue: boolean;
  task040ModifiedTask036Runtime: boolean;
  task040ModifiedFrontend: boolean;
  task040ModifiedAiRuntime: boolean;
  task040ModifiedDeploymentLogic: boolean;
  task040IntroducedLiveIntegrations: boolean;
  details: string[];
}

export interface Task040RegressionCheck {
  ok: boolean;
  task020To036RegressionPassed: boolean;
  phase3RegressionPassed: boolean;
  fullBackendSuitePassed: boolean;
  typeScriptPassed: boolean;
  backendBuildPassed: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  details: string[];
}

export interface Task040SafetyScanResult {
  scanName: string;
  passed: boolean;
  matchesFound: number;
  allowedMatches: number;
  forbiddenMatches: number;
  details: string[];
}

export interface Task040ChangeControlRule {
  ruleName: string;
  description: string;
  required: boolean;
}

export interface Task040ChangeControlPolicy {
  policyName: 'Task 040 Backend Change Control Policy';
  createdAt: string;
  backendFrozen: boolean;
  rules: Task040ChangeControlRule[];
  statement: string;
}

export interface Task040FreezeManifest {
  taskId: '040';
  taskName: 'Final Backend Logic Freeze';
  freezeVersion: string;
  createdAt: string;
  scope: string;
  task036DependencyVerified: boolean;
  acceptedTaskLedgerCreated: boolean;
  acceptedTaskLedgerTaskCount: number;
  backendSurfaceManifestCreated: boolean;
  contractInventoryCreated: boolean;
  serviceInventoryCreated: boolean;
  repositoryInventoryCreated: boolean;
  testInventoryCreated: boolean;
  scriptInventoryCreated: boolean;
  reportInventoryCreated: boolean;
  dirtyWorkspaceClassified: boolean;
  futureTaskContaminationClassified: boolean;
  outOfScopeManifestCreated: boolean;
  noDriftCheckPassed: boolean;
  regressionCheckPassed: boolean;
  safetyScansPassed: boolean;
  changeControlPolicyCreated: boolean;
}

export interface Task040FreezeDecision {
  backendFreezeCreated: boolean;
  backendFrozenThroughTask036: boolean;
  safeToStartFrontendIntegrationOrNextPhase: boolean;
  safeToModifyBackendWithoutChangeControl: boolean;
  finalDecision: Task040FinalDecision;
  remainingBlockers: string[];
  proof: string[];
}

export type Task040FinalDecision =
  | 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED'
  | 'TASK_040_BLOCKED';

export interface Task040FreezeReport {
  taskId: '040';
  taskName: 'Final Backend Logic Freeze';
  scope: string;
  task036DependencyVerified: boolean;
  task040Started: string;
  backendFreezeCreated: boolean;
  backendFrozenThroughTask036: boolean;
  safeToStartFrontendIntegrationOrNextPhase: boolean;
  safeToModifyBackendWithoutChangeControl: boolean;
  newProductBehaviorCreated: boolean;
  frontendUiCreated: boolean;
  aiRuntimeChanged: boolean;
  liveAiCallIntroduced: boolean;
  liveConnectorWriteIntroduced: boolean;
  realNotificationsSent: boolean;
  productionDeploymentPerformed: boolean;
  prismaMigrationRun: boolean;
  productionDataMutationExecuted: boolean;
  rawPrivateDataStored: boolean;
  acceptedTaskLedgerCreated: boolean;
  acceptedTaskLedgerTaskCount: number;
  acceptedTaskIds: string[];
  backendSurfaceManifestCreated: boolean;
  backendSurfaceRouteCount: number;
  contractInventoryCreated: boolean;
  serviceInventoryCreated: boolean;
  repositoryInventoryCreated: boolean;
  testInventoryCreated: boolean;
  scriptInventoryCreated: boolean;
  reportInventoryCreated: boolean;
  dirtyWorkspaceClassified: boolean;
  dirtyWorkspaceEntryCount: number;
  futureTaskContaminationClassified: boolean;
  futureTaskContaminationCount: number;
  outOfScopeManifestCreated: boolean;
  noDriftCheckRun: boolean;
  noDriftCheckPassed: boolean;
  task020To036RegressionRun: boolean;
  task020To036RegressionPassed: boolean;
  phase3RegressionRun: boolean;
  phase3RegressionPassed: boolean;
  fullBackendSuiteRun: boolean;
  fullBackendSuitePassed: boolean;
  fullBackendSuiteFailedFiles: string[];
  fullBackendSuiteFailedTests: string[];
  backendTypecheckRun: boolean;
  backendTypecheckPassed: boolean;
  backendBuildRun: boolean;
  backendBuildPassed: boolean;
  prismaValidateRun: boolean;
  prismaValidatePassed: boolean;
  prismaGenerateRun: boolean;
  prismaGeneratePassed: boolean;
  task040FocusedTestsRun: boolean;
  task040FocusedTestsPassed: boolean;
  task040FocusedTestFiles: number;
  task040FocusedAssertions: number;
  task040VerificationScriptRun: boolean;
  task040VerificationScriptPassed: boolean;
  privacyScanRun: boolean;
  privacyScanPassed: boolean;
  noProductionMutationScanRun: boolean;
  noProductionMutationScanPassed: boolean;
  noLiveAiConnectorScanRun: boolean;
  noLiveAiConnectorScanPassed: boolean;
  noLiveNotificationScanRun: boolean;
  noLiveNotificationScanPassed: boolean;
  noFrontendUiScanRun: boolean;
  noFrontendUiScanPassed: boolean;
  noFutureTaskScanRun: boolean;
  noFutureTaskScanPassed: boolean;
  noFalsePassScanRun: boolean;
  noFalsePassScanPassed: boolean;
  changeControlPolicyCreated: boolean;
  freezeManifestCreated: boolean;
  freezeDecisionPassed: boolean;
  finalDecision: string;
  verdict: string;
  commandsRun: string[];
  filesCreated: string[];
  filesModified: string[];
  filesStaged: string[];
  filesIntentionallyNotStaged: string[];
  remainingBlockers: string[];
  generatedAt: string;
}

export interface Task040AcceptanceReport {
  taskId: '040';
  taskName: 'Final Backend Logic Freeze';
  backendFreezeCreated: boolean;
  backendFrozenThroughTask036: boolean;
  safeToStartFrontendIntegrationOrNextPhase: boolean;
  safeToModifyBackendWithoutChangeControl: boolean;
  finalDecision: string;
  verdict: string;
  remainingBlockers: string[];
  generatedAt: string;
}

export function resolveTask040ActorRole(raw: string): Task040FreezeActorRole {
  const normalized = raw.trim().toLowerCase();
  const allowed = TASK040_ALLOWED_ACTOR_ROLES as readonly string[];
  if (allowed.includes(normalized)) return normalized as Task040FreezeActorRole;
  const denied = TASK040_DENIED_ACTOR_ROLES as readonly string[];
  if (denied.includes(normalized)) return normalized as Task040FreezeActorRole;
  return 'unknown';
}

export function isTask040AllowedActorRole(role: Task040FreezeActorRole): boolean {
  const allowed = TASK040_ALLOWED_ACTOR_ROLES as readonly string[];
  return allowed.includes(role);
}

export function isTask040DeniedActorRole(role: Task040FreezeActorRole): boolean {
  const denied = TASK040_DENIED_ACTOR_ROLES as readonly string[];
  return denied.includes(role);
}

export function createTask040SafeId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function createTask040SafeTimestamp(): string {
  return new Date().toISOString();
}

export function isTask040AcceptedTaskId(taskId: string): boolean {
  const ids = TASK040_ACCEPTED_TASK_IDS as readonly string[];
  return ids.includes(taskId as any);
}

export function calculateTask040FreezeDecision(
  manifest: Task040FreezeManifest,
  task036Proof: Task040Task036Proof,
  noDriftResult: Task040NoDriftCheck,
  regressionResult: Task040RegressionCheck,
  safetyResults: Task040SafetyScanResult[],
  focusedTestsPassed: boolean,
  focusedTestFileCount: number,
  focusedAssertionCount: number,
  verificationScriptPassed: boolean
): Task040FreezeDecision {
  const blockers: string[] = [];

  if (!task036Proof.verified) blockers.push('Task 036 dependency proof not verified');
  if (!task036Proof.safeToStartTask040) blockers.push('Task 036 safeToStartTask040 is false');
  if (!task036Proof.remainingBlockersEmpty) blockers.push('Task 036 has remaining blockers');

  if (!manifest.task036DependencyVerified) blockers.push('freeze manifest: task036DependencyVerified is false');
  if (!manifest.acceptedTaskLedgerCreated) blockers.push('freeze manifest: acceptedTaskLedgerCreated is false');
  if (!manifest.backendSurfaceManifestCreated) blockers.push('freeze manifest: backendSurfaceManifestCreated is false');
  if (!manifest.contractInventoryCreated) blockers.push('freeze manifest: contractInventoryCreated is false');
  if (!manifest.serviceInventoryCreated) blockers.push('freeze manifest: serviceInventoryCreated is false');
  if (!manifest.repositoryInventoryCreated) blockers.push('freeze manifest: repositoryInventoryCreated is false');
  if (!manifest.testInventoryCreated) blockers.push('freeze manifest: testInventoryCreated is false');
  if (!manifest.scriptInventoryCreated) blockers.push('freeze manifest: scriptInventoryCreated is false');
  if (!manifest.reportInventoryCreated) blockers.push('freeze manifest: reportInventoryCreated is false');
  if (!manifest.dirtyWorkspaceClassified) blockers.push('freeze manifest: dirtyWorkspaceClassified is false');
  if (!manifest.futureTaskContaminationClassified) blockers.push('freeze manifest: futureTaskContaminationClassified is false');
  if (!manifest.outOfScopeManifestCreated) blockers.push('freeze manifest: outOfScopeManifestCreated is false');
  if (!manifest.noDriftCheckPassed) blockers.push('freeze manifest: noDriftCheckPassed is false');
  if (!manifest.regressionCheckPassed) blockers.push('freeze manifest: regressionCheckPassed is false');
  if (!manifest.safetyScansPassed) blockers.push('freeze manifest: safetyScansPassed is false');
  if (!manifest.changeControlPolicyCreated) blockers.push('freeze manifest: changeControlPolicyCreated is false');

  if (!noDriftResult.ok) blockers.push('No-drift check failed');
  if (!regressionResult.ok) blockers.push('Regression check failed');

  const safetyAllPassed = safetyResults.every(r => r.passed);
  if (!safetyAllPassed) {
    const failedScans = safetyResults.filter(r => !r.passed).map(r => r.scanName);
    blockers.push(`Safety scans failed: ${failedScans.join(', ')}`);
  }

  if (!focusedTestsPassed) blockers.push('Task 040 focused tests failed');
  if (focusedTestFileCount < 45) blockers.push(`Task 040 focused test file count (${focusedTestFileCount}) below 45`);
  if (focusedAssertionCount < 400) blockers.push(`Task 040 assertion count (${focusedAssertionCount}) below 400`);
  if (!verificationScriptPassed) blockers.push('Task 040 verification script failed');

  const allPassed = blockers.length === 0;

  return {
    backendFreezeCreated: allPassed,
    backendFrozenThroughTask036: task036Proof.verified && task036Proof.safeToStartTask040,
    safeToStartFrontendIntegrationOrNextPhase: allPassed,
    safeToModifyBackendWithoutChangeControl: false,
    finalDecision: allPassed ? 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED' : 'TASK_040_BLOCKED',
    remainingBlockers: blockers,
    proof: [
      `task036Verified: ${task036Proof.verified}`,
      `noDriftOk: ${noDriftResult.ok}`,
      `regressionOk: ${regressionResult.ok}`,
      `safetyAllPassed: ${safetyAllPassed}`,
      `focusedTestsPassed: ${focusedTestsPassed}`,
      `focusedTestFileCount: ${focusedTestFileCount}`,
      `focusedAssertionCount: ${focusedAssertionCount}`,
      `verificationScriptPassed: ${verificationScriptPassed}`,
      `blockerCount: ${blockers.length}`,
    ],
  };
}

export function calculateTask040SafeToStartNextPhase(decision: Task040FreezeDecision): boolean {
  return decision.backendFreezeCreated &&
    decision.backendFrozenThroughTask036 &&
    decision.safeToStartFrontendIntegrationOrNextPhase &&
    decision.remainingBlockers.length === 0 &&
    decision.finalDecision === 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED';
}

export function isTask040ForbiddenStagedPath(filePath: string): boolean {
  const forbidden = TASK040_FORBIDDEN_STAGED_PATH_PATTERNS as readonly string[];
  for (const pattern of forbidden) {
    if (filePath.includes(pattern)) return true;
    try {
      const regex = new RegExp(pattern);
      if (regex.test(filePath)) return true;
    } catch { }
  }
  return false;
}

export function isTask040AllowedStagedPath(filePath: string): boolean {
  const allowed = TASK040_ALLOWED_STAGED_PATH_PATTERNS as readonly string[];
  for (const pattern of allowed) {
    if (filePath.startsWith(pattern) || filePath.includes(pattern.slice(0, -2))) {
      const remaining = pattern.endsWith('*') ? filePath.startsWith(pattern.slice(0, -1)) : filePath === pattern;
      if (remaining || (pattern.endsWith('*') && filePath.startsWith(pattern.slice(0, -1)))) return true;
    }
  }
  return false;
}

export function redactTask040UnsafePath(filePath: string): string {
  const forbidden = TASK040_FORBIDDEN_STAGED_PATH_PATTERNS as readonly string[];
  for (const pattern of forbidden) {
    if (filePath.includes(pattern)) return '[REDACTED: forbidden path]';
    try {
      const regex = new RegExp(pattern);
      if (regex.test(filePath)) return '[REDACTED: forbidden path]';
    } catch { }
  }
  return filePath;
}

export const task040SafeJsonKeys = new Set([
  'status', 'role', 'schoolId', 'tenantId', 'sessionId', 'createdAt', 'updatedAt',
  'ok', 'passed', 'verified', 'taskId', 'taskName', 'freezeVersion', 'scope',
  'error', 'message', 'warning', 'note', 'notes', 'details', 'proof',
  'backendFreezeCreated', 'backendFrozenThroughTask036',
  'safeToStartFrontendIntegrationOrNextPhase', 'safeToModifyBackendWithoutChangeControl',
  'finalDecision', 'remainingBlockers', 'verdict',
  'focusedTestFileCount', 'focusedAssertionCount', 'task040FocusedTestsPassed',
  'entryCount', 'routeCount', 'taskCount', 'matchCount',
  'dependencyVerified', 'noDriftPassed', 'regressionPassed', 'safetyAllPassed',
  'changeControlPolicyCreated', 'freezeManifestCreated', 'freezeDecisionPassed',
  'regressionCheck', 'noDriftCheck', 'safetyScans', 'scanName', 'matchesFound',
  'allowedMatches', 'forbiddenMatches',
]);
