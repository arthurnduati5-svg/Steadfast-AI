import { describe, it, expect, beforeEach } from 'vitest';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import { buildTask034SafeRolloutReadModel } from '../services/task034SafeRolloutReadModelService';

const SESSION_ID = 'test-sess-readmodel';

describe('Task034 Safe Rollout Read Model', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
    await task034Repository.saveRolloutSession({
      sessionId: SESSION_ID,
      activationId: 'act-001',
      schoolId: 'school-1',
      tenantId: 'tenant-1',
      cohortId: 'cohort-1',
      actorRole: 'school_admin',
      status: 'limited_rollout_active_internal',
      rolloutStage: 'limited_rollout_active_internal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blockingIssues: [],
    });
  });

  it('Builds from session data', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(model).not.toBeNull();
    expect(model!.rolloutSessionId).toBe(SESSION_ID);
  });

  it('Contains only safe fields', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(model!.schoolId).toBe('school-1');
    expect(model!.activationId).toBe('act-001');
    expect(model!.status).toBe('limited_rollout_active_internal');
    expect(model!.stage).toBe('limited_rollout_active_internal');
  });

  it('Does not expose raw events', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect((model as any).rawEvents).toBeUndefined();
    expect((model as any).eventStore).toBeUndefined();
    expect((model as any).privateFields).toBeUndefined();
  });

  it('safeToStartTask035 and safeToStartTask040 present as booleans', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(typeof model!.safeToStartTask035).toBe('boolean');
    expect(typeof model!.safeToStartTask040).toBe('boolean');
  });

  it('Generated timestamp is set', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(model!.generatedAt).toBeTruthy();
    expect(typeof model!.generatedAt).toBe('string');
  });

  it('Status matches session status', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(model!.status).toBe('limited_rollout_active_internal');
  });

  it('Returns null for non-existent session', async () => {
    const model = await buildTask034SafeRolloutReadModel('non-existent');
    expect(model).toBeNull();
  });

  it('Contains safe aggregate with basic fields', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(model!.safeAggregate).not.toBeNull();
    expect(model!.safeAggregate!.sessionId).toBe(SESSION_ID);
    expect(typeof model!.safeAggregate!.totalEvents).toBe('number');
  });

  it('Gate status fields are present', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(model!.healthStatus).toBe('not_checked');
    expect(model!.privacyStatus).toBe('not_checked');
    expect(model!.governanceStatus).toBe('not_checked');
    expect(model!.socraticStatus).toBe('not_checked');
    expect(model!.deenStatus).toBe('not_checked');
  });

  it('Safe reason codes is an array', async () => {
    const model = await buildTask034SafeRolloutReadModel(SESSION_ID);
    expect(Array.isArray(model!.safeReasonCodes)).toBe(true);
  });

  it('Stores model in repository', async () => {
    await buildTask034SafeRolloutReadModel(SESSION_ID);
    const stored = await task034Repository.getSafeRolloutReadModel(SESSION_ID);
    expect(stored).not.toBeNull();
    expect(stored!.rolloutSessionId).toBe(SESSION_ID);
  });
});
