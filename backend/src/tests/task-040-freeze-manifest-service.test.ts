import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  TASK040_FINAL_BACKEND_FREEZE_VERSION,
  createTask040SafeTimestamp,
} from '../contracts/task040BackendFreezeContracts';
import { getFreezeManifest, buildFreezeManifest } from '../services/task040FreezeManifestService';
import { createDeterministicProofReader, createSyntheticLoaderProof } from '../services/task040Task036ProofLoaderService';

function seedAllDependencies(): void {
  const synth = createSyntheticLoaderProof();
  const now = createTask040SafeTimestamp();
  task040Repository.saveTask036Proof(synth.proof);
  task040Repository.saveAcceptedTaskLedger({ taskId: '040', entries: [], taskCount: 17, complete: true, generatedAt: now });
  task040Repository.saveBackendSurfaceManifest({ taskId: '040', routeEntries: [], routeCount: 6, generatedAt: now });
  task040Repository.saveContractInventory([{ path: 'contracts/test.ts', taskOwner: '040', category: 'contract', isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }]);
  task040Repository.saveServiceInventory([{ path: 'services/test.ts', taskOwner: '040', category: 'service', isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }]);
  task040Repository.saveRepositoryInventory([{ path: 'repositories/test.ts', taskOwner: '040', category: 'repository', isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }]);
  task040Repository.saveTestInventory([{ path: 'tests/test.ts', taskOwner: '040', category: 'test', isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }]);
  task040Repository.saveScriptInventory([{ path: 'scripts/test.ps1', taskOwner: '040', category: 'script', isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }]);
  task040Repository.saveReportInventory([{ path: 'reports/test.md', taskOwner: '040', category: 'doc', isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }]);
  task040Repository.saveDirtyWorkspaceClassification([{ path: 'backend/src/tests/task-040-test.ts', classification: 'task040_freeze_artifact', isStaged: false, isTrackedModified: false, isUntracked: false }]);
  task040Repository.saveFutureTaskContaminationManifest([]);
  task040Repository.saveOutOfScopeManifest({ frontendFiles: [], aiFiles: [], futureTaskFiles: [], generatedOutputFiles: [], logFiles: [], cacheTempFiles: [], notes: '' });
  task040Repository.saveNoDriftCheck({ ok: true, task036ReportStillAccepted: true, task036SafeToStartTask040StillTrue: true, task040ModifiedTask036Runtime: false, task040ModifiedFrontend: false, task040ModifiedAiRuntime: false, task040ModifiedDeploymentLogic: false, task040IntroducedLiveIntegrations: false, details: [] });
  task040Repository.saveRegressionCheck({ ok: true, task020To036RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, details: [] });
  task040Repository.saveSafetyScanResult({ scanName: 'no-false-pass', passed: true, matchesFound: 0, allowedMatches: 0, forbiddenMatches: 0, details: [] });
  task040Repository.saveChangeControlPolicy({ policyName: 'Task 040 Backend Change Control Policy', createdAt: now, backendFrozen: true, rules: [], statement: 'Backend is frozen.' });
}

describe('Task 040 - Freeze Manifest Service', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('returns null when no manifest has been built', () => {
    expect(getFreezeManifest()).toBeNull();
  });

  it('builds freeze manifest with expected structure through real service', () => {
    seedAllDependencies();
    const synth = createSyntheticLoaderProof();
    const reader = createDeterministicProofReader(synth.proof);

    const manifest = buildFreezeManifest(reader);
    expect(manifest.taskId).toBe('040');
    expect(manifest.taskName).toBe('Final Backend Logic Freeze');
    expect(manifest.freezeVersion).toBe(TASK040_FINAL_BACKEND_FREEZE_VERSION);
    expect(manifest.scope).toBe('backend_freeze_only');
    expect(manifest.task036DependencyVerified).toBe(true);
    expect(manifest.acceptedTaskLedgerCreated).toBe(true);
    expect(manifest.backendSurfaceManifestCreated).toBe(true);
    expect(manifest.contractInventoryCreated).toBe(true);
    expect(manifest.serviceInventoryCreated).toBe(true);
    expect(manifest.repositoryInventoryCreated).toBe(true);
    expect(manifest.testInventoryCreated).toBe(true);
    expect(manifest.scriptInventoryCreated).toBe(true);
    expect(manifest.reportInventoryCreated).toBe(true);
    expect(manifest.dirtyWorkspaceClassified).toBe(true);
    expect(manifest.futureTaskContaminationClassified).toBe(true);
    expect(manifest.outOfScopeManifestCreated).toBe(true);
    expect(manifest.noDriftCheckPassed).toBe(true);
    expect(manifest.regressionCheckPassed).toBe(true);
    expect(manifest.safetyScansPassed).toBe(true);
    expect(manifest.changeControlPolicyCreated).toBe(true);
  });

  it('manifest built through buildFreezeManifest is retrievable through getFreezeManifest', () => {
    seedAllDependencies();
    const synth = createSyntheticLoaderProof();
    const reader = createDeterministicProofReader(synth.proof);

    buildFreezeManifest(reader);
    const retrieved = getFreezeManifest();
    expect(retrieved).not.toBeNull();
    expect(retrieved!.taskId).toBe('040');
    expect(retrieved!.freezeVersion).toBe(TASK040_FINAL_BACKEND_FREEZE_VERSION);
    expect(retrieved!.scope).toBe('backend_freeze_only');
  });

  it('invalid evidence produces a safe non-accepted manifest', () => {
    seedAllDependencies();
    const synth = createSyntheticLoaderProof({ verified: false, safeToStartTask040: false });
    const reader = createDeterministicProofReader(synth.proof);

    const manifest = buildFreezeManifest(reader);
    expect(manifest.task036DependencyVerified).toBe(false);
  });

  it('repeated retrieval is deterministic', () => {
    seedAllDependencies();
    const synth = createSyntheticLoaderProof();
    const reader = createDeterministicProofReader(synth.proof);

    const first = buildFreezeManifest(reader);
    const second = getFreezeManifest();
    expect(second).not.toBeNull();
    expect(second!.freezeVersion).toBe(first.freezeVersion);
    expect(second!.scope).toBe(first.scope);
  });

  it('missing report evidence is represented safely', () => {
    const now = createTask040SafeTimestamp();
    task040Repository.saveAcceptedTaskLedger({ taskId: '040', entries: [], taskCount: 0, complete: false, generatedAt: now });
    task040Repository.saveBackendSurfaceManifest({ taskId: '040', routeEntries: [], routeCount: 0, generatedAt: now });
    task040Repository.saveContractInventory([]);
    task040Repository.saveServiceInventory([]);
    task040Repository.saveRepositoryInventory([]);
    task040Repository.saveTestInventory([]);
    task040Repository.saveScriptInventory([]);
    task040Repository.saveReportInventory([]);
    task040Repository.saveDirtyWorkspaceClassification([]);
    task040Repository.saveFutureTaskContaminationManifest([]);
    task040Repository.saveOutOfScopeManifest({ frontendFiles: [], aiFiles: [], futureTaskFiles: [], generatedOutputFiles: [], logFiles: [], cacheTempFiles: [], notes: '' });
    task040Repository.saveNoDriftCheck({ ok: true, task036ReportStillAccepted: true, task036SafeToStartTask040StillTrue: true, task040ModifiedTask036Runtime: false, task040ModifiedFrontend: false, task040ModifiedAiRuntime: false, task040ModifiedDeploymentLogic: false, task040IntroducedLiveIntegrations: false, details: [] });
    task040Repository.saveRegressionCheck({ ok: true, task020To036RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, details: [] });
    task040Repository.saveSafetyScanResult({ scanName: 'no-false-pass', passed: true, matchesFound: 0, allowedMatches: 0, forbiddenMatches: 0, details: [] });
    task040Repository.saveChangeControlPolicy({ policyName: 'Task 040 Backend Change Control Policy', createdAt: now, backendFrozen: true, rules: [], statement: 'Backend is frozen.' });

    const synth = createSyntheticLoaderProof();
    const reader = createDeterministicProofReader(synth.proof);

    const manifest = buildFreezeManifest(reader);
    expect(manifest.acceptedTaskLedgerCreated).toBe(false);
    expect(manifest.acceptedTaskLedgerTaskCount).toBe(0);
  });
});
