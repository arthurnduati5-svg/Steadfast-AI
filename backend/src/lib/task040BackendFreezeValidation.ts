import {
  Task040Task036Proof,
  Task040AcceptedTaskLedger,
  Task040BackendSurfaceManifest,
  Task040ContractInventoryEntry,
  Task040ServiceInventoryEntry,
  Task040RepositoryInventoryEntry,
  Task040TestInventoryEntry,
  Task040ScriptInventoryEntry,
  Task040ReportInventoryEntry,
  Task040DirtyWorkspaceEntry,
  Task040FutureTaskContaminationEntry,
  Task040OutOfScopeManifest,
  Task040NoDriftCheck,
  Task040RegressionCheck,
  Task040SafetyScanResult,
  Task040ChangeControlPolicy,
  Task040FreezeManifest,
  Task040FreezeDecision,
  Task040FreezeReport,
  TASK040_ACCEPTED_TASK_IDS,
  TASK040_FORBIDDEN_OUTPUT_FIELDS,
  TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK040_FORBIDDEN_MUTATION_PATTERNS,
  TASK040_FORBIDDEN_STAGED_PATH_PATTERNS,
  TASK040_ALLOWED_STAGED_PATH_PATTERNS,
  TASK040_DENIED_ACTOR_ROLES,
  TASK040_ALLOWED_ACTOR_ROLES,
} from '../contracts/task040BackendFreezeContracts';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function safeError(field: string, code: string): ValidationError {
  return { field, code, message: `Validation error: ${field} failed check ${code}` };
}

export function validateTask036Proof(proof: Task040Task036Proof | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!proof) { errors.push(safeError('task036Proof', 'missing')); return { valid: false, errors }; }
  if (proof.taskId !== '036') errors.push(safeError('task036Proof.taskId', 'wrong_task_id'));
  if (!proof.verified) errors.push(safeError('task036Proof.verified', 'not_verified'));
  if (!proof.safeToStartTask040) errors.push(safeError('task036Proof.safeToStartTask040', 'not_safe'));
  if (!proof.remainingBlockersEmpty) errors.push(safeError('task036Proof.remainingBlockersEmpty', 'blockers_remain'));
  if (!proof.commitHash) errors.push(safeError('task036Proof.commitHash', 'missing'));
  if (!proof.handoffPath) errors.push(safeError('task036Proof.handoffPath', 'missing'));
  if (!proof.reportPath) errors.push(safeError('task036Proof.reportPath', 'missing'));
  return { valid: errors.length === 0, errors };
}

export function validateAcceptedTaskLedger(ledger: Task040AcceptedTaskLedger | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!ledger) { errors.push(safeError('acceptedTaskLedger', 'missing')); return { valid: false, errors }; }
  if (ledger.taskId !== '040') errors.push(safeError('acceptedTaskLedger.taskId', 'wrong_task_id'));
  const acceptedIds = TASK040_ACCEPTED_TASK_IDS as readonly string[];
  for (const id of acceptedIds) {
    const entry = ledger.entries.find(e => e.taskId === id);
    if (!entry) errors.push(safeError(`acceptedTaskLedger.entries[${id}]`, 'missing_entry_for_accepted_task'));
  }
  if (ledger.taskCount !== ledger.entries.length) errors.push(safeError('acceptedTaskLedger.taskCount', 'count_mismatch'));
  if (!ledger.generatedAt) errors.push(safeError('acceptedTaskLedger.generatedAt', 'missing'));
  return { valid: errors.length === 0, errors };
}

export function validateBackendSurfaceManifest(manifest: Task040BackendSurfaceManifest | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!manifest) { errors.push(safeError('backendSurfaceManifest', 'missing')); return { valid: false, errors }; }
  if (manifest.taskId !== '040') errors.push(safeError('backendSurfaceManifest.taskId', 'wrong_task_id'));
  if (manifest.routeCount !== manifest.routeEntries.length) errors.push(safeError('backendSurfaceManifest.routeCount', 'count_mismatch'));
  if (!manifest.generatedAt) errors.push(safeError('backendSurfaceManifest.generatedAt', 'missing'));
  return { valid: errors.length === 0, errors };
}

export function validateContractInventory(entries: Task040ContractInventoryEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries || entries.length === 0) { errors.push(safeError('contractInventory', 'empty')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateServiceInventory(entries: Task040ServiceInventoryEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries || entries.length === 0) { errors.push(safeError('serviceInventory', 'empty')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateRepositoryInventory(entries: Task040RepositoryInventoryEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries || entries.length === 0) { errors.push(safeError('repositoryInventory', 'empty')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateTestInventory(entries: Task040TestInventoryEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries || entries.length === 0) { errors.push(safeError('testInventory', 'empty')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateScriptInventory(entries: Task040ScriptInventoryEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries || entries.length === 0) { errors.push(safeError('scriptInventory', 'empty')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateReportInventory(entries: Task040ReportInventoryEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries || entries.length === 0) { errors.push(safeError('reportInventory', 'empty')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateDirtyWorkspaceClassification(entries: Task040DirtyWorkspaceEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries) { errors.push(safeError('dirtyWorkspaceClassification', 'missing')); return { valid: false, errors }; }
  const hasUnknown = entries.filter(e => e.classification === 'unknown');
  if (hasUnknown.length > 0) errors.push(safeError('dirtyWorkspaceClassification', `has_unknown_entries: ${hasUnknown.length}`));
  return { valid: errors.length === 0, errors };
}

export function validateFutureTaskContamination(entries: Task040FutureTaskContaminationEntry[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!entries) { errors.push(safeError('futureTaskContamination', 'missing')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateOutOfScopeManifest(manifest: Task040OutOfScopeManifest | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!manifest) { errors.push(safeError('outOfScopeManifest', 'missing')); return { valid: false, errors }; }
  return { valid: errors.length === 0, errors };
}

export function validateNoDriftCheck(result: Task040NoDriftCheck | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!result) { errors.push(safeError('noDriftCheck', 'missing')); return { valid: false, errors }; }
  if (!result.ok) errors.push(safeError('noDriftCheck.ok', 'drift_detected'));
  if (result.task040ModifiedFrontend) errors.push(safeError('noDriftCheck.task040ModifiedFrontend', 'frontend_drift'));
  if (result.task040ModifiedAiRuntime) errors.push(safeError('noDriftCheck.task040ModifiedAiRuntime', 'ai_runtime_drift'));
  if (result.task040IntroducedLiveIntegrations) errors.push(safeError('noDriftCheck.task040IntroducedLiveIntegrations', 'live_integration_drift'));
  return { valid: errors.length === 0, errors };
}

export function validateRegressionCheck(result: Task040RegressionCheck | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!result) { errors.push(safeError('regressionCheck', 'missing')); return { valid: false, errors }; }
  if (!result.ok) errors.push(safeError('regressionCheck.ok', 'regression_failed'));
  if (!result.task020To036RegressionPassed) errors.push(safeError('regressionCheck.task020To036RegressionPassed', 'regression_failed_020_036'));
  if (!result.fullBackendSuitePassed) errors.push(safeError('regressionCheck.fullBackendSuitePassed', 'full_suite_failed'));
  return { valid: errors.length === 0, errors };
}

export function validateSafetyScanResults(results: Task040SafetyScanResult[] | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!results || results.length === 0) { errors.push(safeError('safetyScanResults', 'missing')); return { valid: false, errors }; }
  for (const r of results) {
    if (!r.passed) errors.push(safeError(`safetyScanResult.${r.scanName}`, 'scan_failed'));
  }
  return { valid: errors.length === 0, errors };
}

export function validateChangeControlPolicy(policy: Task040ChangeControlPolicy | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!policy) { errors.push(safeError('changeControlPolicy', 'missing')); return { valid: false, errors }; }
  if (!policy.backendFrozen) errors.push(safeError('changeControlPolicy.backendFrozen', 'not_frozen'));
  if (!policy.rules || policy.rules.length === 0) errors.push(safeError('changeControlPolicy.rules', 'no_rules'));
  if (!policy.statement) errors.push(safeError('changeControlPolicy.statement', 'missing'));
  return { valid: errors.length === 0, errors };
}

export function validateFreezeManifest(manifest: Task040FreezeManifest | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!manifest) { errors.push(safeError('freezeManifest', 'missing')); return { valid: false, errors }; }
  if (!manifest.task036DependencyVerified) errors.push(safeError('freezeManifest.task036DependencyVerified', 'not_verified'));
  if (!manifest.acceptedTaskLedgerCreated) errors.push(safeError('freezeManifest.acceptedTaskLedgerCreated', 'not_created'));
  if (!manifest.backendSurfaceManifestCreated) errors.push(safeError('freezeManifest.backendSurfaceManifestCreated', 'not_created'));
  if (!manifest.contractInventoryCreated) errors.push(safeError('freezeManifest.contractInventoryCreated', 'not_created'));
  if (!manifest.serviceInventoryCreated) errors.push(safeError('freezeManifest.serviceInventoryCreated', 'not_created'));
  if (!manifest.repositoryInventoryCreated) errors.push(safeError('freezeManifest.repositoryInventoryCreated', 'not_created'));
  if (!manifest.testInventoryCreated) errors.push(safeError('freezeManifest.testInventoryCreated', 'not_created'));
  if (!manifest.scriptInventoryCreated) errors.push(safeError('freezeManifest.scriptInventoryCreated', 'not_created'));
  if (!manifest.reportInventoryCreated) errors.push(safeError('freezeManifest.reportInventoryCreated', 'not_created'));
  if (!manifest.dirtyWorkspaceClassified) errors.push(safeError('freezeManifest.dirtyWorkspaceClassified', 'not_classified'));
  if (!manifest.futureTaskContaminationClassified) errors.push(safeError('freezeManifest.futureTaskContaminationClassified', 'not_classified'));
  if (!manifest.outOfScopeManifestCreated) errors.push(safeError('freezeManifest.outOfScopeManifestCreated', 'not_created'));
  if (!manifest.noDriftCheckPassed) errors.push(safeError('freezeManifest.noDriftCheckPassed', 'not_passed'));
  if (!manifest.regressionCheckPassed) errors.push(safeError('freezeManifest.regressionCheckPassed', 'not_passed'));
  if (!manifest.safetyScansPassed) errors.push(safeError('freezeManifest.safetyScansPassed', 'not_passed'));
  if (!manifest.changeControlPolicyCreated) errors.push(safeError('freezeManifest.changeControlPolicyCreated', 'not_created'));
  return { valid: errors.length === 0, errors };
}

export function validateFreezeDecision(decision: Task040FreezeDecision | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!decision) { errors.push(safeError('freezeDecision', 'missing')); return { valid: false, errors }; }
  if (!decision.backendFreezeCreated) errors.push(safeError('freezeDecision.backendFreezeCreated', 'not_created'));
  if (!decision.backendFrozenThroughTask036) errors.push(safeError('freezeDecision.backendFrozenThroughTask036', 'not_frozen'));
  if (decision.safeToModifyBackendWithoutChangeControl) errors.push(safeError('freezeDecision.safeToModifyBackendWithoutChangeControl', 'should_be_false'));
  if (decision.finalDecision !== 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED') errors.push(safeError('freezeDecision.finalDecision', 'not_accepted'));
  return { valid: errors.length === 0, errors };
}

export function validateFreezeReport(report: Task040FreezeReport | null): ValidationResult {
  const errors: ValidationError[] = [];
  if (!report) { errors.push(safeError('freezeReport', 'missing')); return { valid: false, errors }; }
  if (report.newProductBehaviorCreated) errors.push(safeError('freezeReport.newProductBehaviorCreated', 'should_be_false'));
  if (report.frontendUiCreated) errors.push(safeError('freezeReport.frontendUiCreated', 'should_be_false'));
  if (report.aiRuntimeChanged) errors.push(safeError('freezeReport.aiRuntimeChanged', 'should_be_false'));
  if (report.liveAiCallIntroduced) errors.push(safeError('freezeReport.liveAiCallIntroduced', 'should_be_false'));
  if (report.liveConnectorWriteIntroduced) errors.push(safeError('freezeReport.liveConnectorWriteIntroduced', 'should_be_false'));
  if (report.realNotificationsSent) errors.push(safeError('freezeReport.realNotificationsSent', 'should_be_false'));
  if (report.productionDeploymentPerformed) errors.push(safeError('freezeReport.productionDeploymentPerformed', 'should_be_false'));
  if (report.prismaMigrationRun) errors.push(safeError('freezeReport.prismaMigrationRun', 'should_be_false'));
  if (report.productionDataMutationExecuted) errors.push(safeError('freezeReport.productionDataMutationExecuted', 'should_be_false'));
  if (report.rawPrivateDataStored) errors.push(safeError('freezeReport.rawPrivateDataStored', 'should_be_false'));

  const forbiddenPhrases = ['PENDING_VERIFICATION', 'COMMIT_PENDING', 'mostly passed', 'core passed', 'known limitation', 'accepted with failures'];
  for (const phrase of forbiddenPhrases) {
    if (report.verdict?.includes(phrase)) {
      errors.push(safeError('freezeReport.verdict', `contains_forbidden_phrase: ${phrase}`));
    }
    if (report.finalDecision?.includes(phrase)) {
      errors.push(safeError('freezeReport.finalDecision', `contains_forbidden_phrase: ${phrase}`));
    }
  }

  if (report.acceptedTaskIds.length === 0) errors.push(safeError('freezeReport.acceptedTaskIds', 'empty'));
  return { valid: errors.length === 0, errors };
}

export function validateForbiddenOutputFields(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const forbidden = TASK040_FORBIDDEN_OUTPUT_FIELDS as readonly string[];
  for (const key of forbidden) {
    if (key in data && data[key] !== undefined && data[key] !== null) {
      errors.push(safeError(`forbiddenOutputField.${key}`, 'contains_forbidden_field'));
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateForbiddenSideEffects(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const patterns = TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS as readonly string[];
  for (const pattern of patterns) {
    if (code.includes(pattern)) {
      errors.push(safeError(`forbiddenSideEffect.${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`, 'contains_forbidden_pattern'));
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateForbiddenMutationPatterns(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const patterns = TASK040_FORBIDDEN_MUTATION_PATTERNS as readonly string[];
  for (const pattern of patterns) {
    if (code.includes(pattern)) {
      errors.push(safeError(`forbiddenMutation.${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`, 'contains_forbidden_pattern'));
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateForbiddenStagedPaths(paths: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  const forbidden = TASK040_FORBIDDEN_STAGED_PATH_PATTERNS as readonly string[];
  for (const p of paths) {
    for (const pattern of forbidden) {
      if (p.includes(pattern)) {
        errors.push(safeError(`forbiddenStagedPath.${p.replace(/[^a-zA-Z0-9]/g, '_')}`, 'forbidden_path'));
      }
      try {
        const regex = new RegExp(pattern);
        if (regex.test(p)) {
          errors.push(safeError(`forbiddenStagedPathPattern.${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`, 'forbidden_path_match'));
        }
      } catch { }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateAllowedStagedPaths(paths: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  const allowed = TASK040_ALLOWED_STAGED_PATH_PATTERNS as readonly string[];
  for (const p of paths) {
    let isAllowed = false;
    for (const pattern of allowed) {
      if (pattern.endsWith('*') && p.startsWith(pattern.slice(0, -1))) { isAllowed = true; break; }
      if (p === pattern) { isAllowed = true; break; }
      if (p.startsWith(pattern)) { isAllowed = true; break; }
    }
    if (!isAllowed) {
      errors.push(safeError(`disallowedStagedPath.${p.replace(/[^a-zA-Z0-9]/g, '_')}`, 'not_in_allowed_list'));
    }
  }
  return { valid: errors.length === 0, errors };
}
