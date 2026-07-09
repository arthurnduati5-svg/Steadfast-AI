import { describe, it, expect, beforeEach } from 'vitest';
import { createTask030RehearsalRun, completeTask030RehearsalRun, blockTask030RehearsalRun, getTask030RehearsalRun } from '../services/task030RehearsalRunService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Rehearsal Run State Machine', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should create a run with status created', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    expect(run.status).toBe('created');
    expect(run.runId).toContain('rehearsal_school_001');
  });

  it('should have staging environment and dry_run mode', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    expect(run.environmentType).toBe('staging');
    expect(run.dataMode).toBe('synthetic');
    expect(run.executionMode).toBe('dry_run');
  });

  it('should advance status through complete', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    const advanced = await completeTask030RehearsalRun(run.runId);
    expect(advanced.status).toBe('preflight_running');
  });

  it('should reach accepted_ready after successive completions', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    let current = await completeTask030RehearsalRun(run.runId);
    current = await completeTask030RehearsalRun(current.runId);
    current = await completeTask030RehearsalRun(current.runId);
    current = await completeTask030RehearsalRun(current.runId);
    current = await completeTask030RehearsalRun(current.runId);
    current = await completeTask030RehearsalRun(current.runId);
    current = await completeTask030RehearsalRun(current.runId);
    current = await completeTask030RehearsalRun(current.runId);
    expect(current.status).toBe('accepted_ready');
    expect(current.decision).toBe('ready_for_task031');
  });

  it('should block a run', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    const blocked = await blockTask030RehearsalRun(run.runId, ['something_wrong']);
    expect(blocked.status).toBe('blocked');
    expect(blocked.decision).toBe('blocked');
    expect(blocked.blockingIssues).toContain('something_wrong');
  });

  it('should throw when blocking already accepted run', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    let current = run;
    for (let i = 0; i < 8; i++) {
      current = await completeTask030RehearsalRun(current.runId);
    }
    await expect(blockTask030RehearsalRun(current.runId, ['block'])).rejects.toThrow();
  });

  it('should get run by ID', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    const fetched = await getTask030RehearsalRun(run.runId);
    expect(fetched).not.toBeNull();
    expect(fetched!.runId).toBe(run.runId);
  });

  it('should return null for non-existent run', async () => {
    const fetched = await getTask030RehearsalRun('nonexistent');
    expect(fetched).toBeNull();
  });

  it('should throw when completing non-existent run', async () => {
    await expect(completeTask030RehearsalRun('nonexistent')).rejects.toThrow();
  });

  it('should throw when blocking non-existent run', async () => {
    await expect(blockTask030RehearsalRun('nonexistent', ['err'])).rejects.toThrow();
  });

  it('should have created and updated dates', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    expect(run.createdAt).toBeDefined();
    expect(run.updatedAt).toBeDefined();
    expect(() => new Date(run.createdAt)).not.toThrow();
  });

  it('should persist run in repository', async () => {
    const run = await createTask030RehearsalRun({ schoolId: 'school_001' });
    const stored = await task030ControlledStagingRehearsalRepository.getRehearsalRun(run.runId);
    expect(stored).not.toBeNull();
  });
});
