import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030UnknownRoleDenial } from '../services/task030UnknownRoleDenialService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Unknown Role Denial', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allDenied true', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_002' });
    expect(result.allDenied).toBe(true);
  });

  it('should have denied routes', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_003' });
    expect(result.deniedRoutes.length).toBeGreaterThan(0);
  });

  it('should deny admin console routes', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_004' });
    expect(result.deniedRoutes).toContain('api/task030/console');
    expect(result.deniedRoutes).toContain('api/task030/console/dashboard');
  });

  it('should deny rehearsal control routes', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_005' });
    expect(result.deniedRoutes).toContain('api/task030/rehearsal/pause');
    expect(result.deniedRoutes).toContain('api/task030/rehearsal/rollback');
  });

  it('should deny report routes', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_006' });
    expect(result.deniedRoutes).toContain('api/task030/report');
    expect(result.deniedRoutes).toContain('api/task030/report/generate');
  });

  it('should have blockingIssues array', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_007' });
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });

  it('should have safeSummary', async () => {
    const result = await runTask030UnknownRoleDenial({ runId: 'run_unknown_008' });
    expect(typeof result.safeSummary).toBe('string');
    expect(result.safeSummary.length).toBeGreaterThan(0);
  });
});
