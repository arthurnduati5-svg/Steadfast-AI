import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function computeDiagnostics(): Record<string, unknown> {
  return {
    service: 'task040',
    status: task040Repository.getFreezeDecision()?.backendFreezeCreated ? 'freeze_active' : 'not_frozen',
    freezeManifestExists: task040Repository.getFreezeManifest() !== null,
    freezeDecisionExists: task040Repository.getFreezeDecision() !== null,
    freezeReportExists: task040Repository.getLatestFreezeReport() !== null,
    task036ProofExists: task040Repository.getTask036Proof() !== null,
    acceptedTaskLedgerExists: task040Repository.getAcceptedTaskLedger() !== null,
    backendSurfaceManifestExists: task040Repository.getBackendSurfaceManifest() !== null,
    contractInventoryCount: task040Repository.getContractInventory().length,
    serviceInventoryCount: task040Repository.getServiceInventory().length,
    repositoryInventoryCount: task040Repository.getRepositoryInventory().length,
    testInventoryCount: task040Repository.getTestInventory().length,
    scriptInventoryCount: task040Repository.getScriptInventory().length,
    reportInventoryCount: task040Repository.getReportInventory().length,
    dirtyWorkspaceEntryCount: task040Repository.getDirtyWorkspaceClassification().length,
    futureTaskContaminationCount: task040Repository.getFutureTaskContaminationManifest().length,
    safetyScanCount: task040Repository.getSafetyScanResults().length,
    freezeReportCount: task040Repository.getAllFreezeReports().length,
    finalDecision: task040Repository.getFreezeDecision()?.finalDecision ?? 'not_computed',
    remainingBlockers: task040Repository.getFreezeDecision()?.remainingBlockers ?? [],
  };
}
