import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  Task040FreezeManifest,
  TASK040_FINAL_BACKEND_FREEZE_VERSION,
  createTask040SafeTimestamp,
} from '../contracts/task040BackendFreezeContracts';
import { getFreezeManifest } from '../services/task040FreezeManifestService';

describe('Task 040 - Freeze Manifest Service', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('returns null when no manifest has been built', () => {
    expect(getFreezeManifest()).toBeNull();
  });

  it('saves and retrieves freeze manifest', () => {
    const manifest: Task040FreezeManifest = {
      taskId: '040',
      taskName: 'Final Backend Logic Freeze',
      freezeVersion: TASK040_FINAL_BACKEND_FREEZE_VERSION,
      createdAt: createTask040SafeTimestamp(),
      scope: 'backend_freeze_only',
      task036DependencyVerified: true,
      acceptedTaskLedgerCreated: true,
      acceptedTaskLedgerTaskCount: 0,
      backendSurfaceManifestCreated: true,
      contractInventoryCreated: true,
      serviceInventoryCreated: true,
      repositoryInventoryCreated: true,
      testInventoryCreated: true,
      scriptInventoryCreated: true,
      reportInventoryCreated: true,
      dirtyWorkspaceClassified: true,
      futureTaskContaminationClassified: true,
      outOfScopeManifestCreated: true,
      noDriftCheckPassed: true,
      regressionCheckPassed: true,
      safetyScansPassed: true,
      changeControlPolicyCreated: true,
    };
    task040Repository.saveFreezeManifest(manifest);

    const retrieved = getFreezeManifest();
    expect(retrieved).not.toBeNull();
    expect(retrieved!.taskId).toBe('040');
    expect(retrieved!.freezeVersion).toBe(TASK040_FINAL_BACKEND_FREEZE_VERSION);
    expect(retrieved!.scope).toBe('backend_freeze_only');
  });
});
