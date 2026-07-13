import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

describe('Task 040 - Freeze Decision Service', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('getFreezeDecision returns null initially', () => {
    expect(task040Repository.getFreezeDecision()).toBeNull();
  });

  it('save and retrieve freeze decision', () => {
    const decision = {
      backendFreezeCreated: true,
      backendFrozenThroughTask036: true,
      safeToStartFrontendIntegrationOrNextPhase: true,
      safeToModifyBackendWithoutChangeControl: false,
      finalDecision: 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED' as const,
      remainingBlockers: [],
      proof: ['all gates passed'],
    };
    task040Repository.saveFreezeDecision(decision);
    expect(task040Repository.getFreezeDecision()).toEqual(decision);
  });
});
