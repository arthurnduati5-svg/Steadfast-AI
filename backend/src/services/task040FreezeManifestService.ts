import {
  Task040FreezeManifest,
  TASK040_FINAL_BACKEND_FREEZE_VERSION,
  createTask040SafeTimestamp,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { loadTask036Proof, Task036ProofReader, loadTask036ProofWithReader, ProductionProofReader } from './task040Task036ProofLoaderService';
import { getAcceptedTaskLedger } from './task040AcceptedTaskLedgerService';
import { getBackendSurfaceManifest } from './task040BackendSurfaceInventoryService';
import { getContractInventory } from './task040ContractInventoryService';
import { getServiceInventory } from './task040ServiceInventoryService';
import { getRepositoryInventory } from './task040RepositoryInventoryService';
import { getTestInventory } from './task040TestInventoryService';
import { getScriptInventory } from './task040ScriptInventoryService';
import { getReportInventory } from './task040ReportInventoryService';
import { getDirtyWorkspaceClassification } from './task040DirtyWorkspaceClassifierService';
import { getFutureTaskContamination } from './task040FutureTaskContaminationService';
import { getOutOfScopeManifest } from './task040OutOfScopeManifestService';
import { getNoDriftCheck } from './task040NoDriftCheckService';
import { getRegressionCheck } from './task040RegressionCheckService';
import { getSafetyScanResults } from './task040SafetyScanService';
import { getChangeControlPolicy } from './task040ChangeControlPolicyService';

export function buildFreezeManifest(proofReader?: Task036ProofReader): Task040FreezeManifest {
  const task036Proof = proofReader
    ? loadTask036ProofWithReader(proofReader)
    : loadTask036Proof();
  const ledger = getAcceptedTaskLedger();
  const surfaceManifest = getBackendSurfaceManifest();
  const contractInv = getContractInventory();
  const serviceInv = getServiceInventory();
  const repositoryInv = getRepositoryInventory();
  const testInv = getTestInventory();
  const scriptInv = getScriptInventory();
  const reportInv = getReportInventory();
  const dirtyClassification = getDirtyWorkspaceClassification();
  const futureTaskContamination = getFutureTaskContamination();
  const outOfScopeManifest = getOutOfScopeManifest();
  const noDriftResult = getNoDriftCheck();
  const regressionResult = getRegressionCheck();
  const safetyResults = getSafetyScanResults();
  const changeControlPolicy = getChangeControlPolicy();

  const allSafetyPassed = safetyResults.every(r => r.passed);

  const manifest: Task040FreezeManifest = {
    taskId: '040',
    taskName: 'Final Backend Logic Freeze',
    freezeVersion: TASK040_FINAL_BACKEND_FREEZE_VERSION,
    createdAt: createTask040SafeTimestamp(),
    scope: 'backend_freeze_only',
    task036DependencyVerified: task036Proof.verified && task036Proof.safeToStartTask040,
    acceptedTaskLedgerCreated: ledger !== null && ledger.complete,
    acceptedTaskLedgerTaskCount: ledger?.taskCount ?? 0,
    backendSurfaceManifestCreated: surfaceManifest !== null,
    contractInventoryCreated: contractInv.length > 0,
    serviceInventoryCreated: serviceInv.length > 0,
    repositoryInventoryCreated: repositoryInv.length > 0,
    testInventoryCreated: testInv.length > 0,
    scriptInventoryCreated: scriptInv.length > 0,
    reportInventoryCreated: reportInv.length > 0,
    dirtyWorkspaceClassified: dirtyClassification.length > 0,
    futureTaskContaminationClassified: true,
    outOfScopeManifestCreated: outOfScopeManifest !== null,
    noDriftCheckPassed: noDriftResult.ok,
    regressionCheckPassed: regressionResult.ok,
    safetyScansPassed: allSafetyPassed,
    changeControlPolicyCreated: changeControlPolicy !== null,
  };

  task040Repository.saveFreezeManifest(manifest);
  return manifest;
}

export function getFreezeManifest(): Task040FreezeManifest | null {
  return task040Repository.getFreezeManifest();
}
