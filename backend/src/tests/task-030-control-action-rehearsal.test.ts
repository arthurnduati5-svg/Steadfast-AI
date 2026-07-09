import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030ControlActionRehearsal } from '../services/task030ControlActionRehearsalService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Control Action Rehearsal', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allPassed true', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_002' });
    expect(result.allPassed).toBe(true);
  });

  it('should have 5 control actions', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_003' });
    expect(result.actions).toHaveLength(5);
  });

  it('should include pause_rehearsal action', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_004' });
    const names = result.actions.map(a => a.actionName);
    expect(names).toContain('pause_rehearsal');
  });

  it('should include kill_switch_enable action', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_005' });
    const names = result.actions.map(a => a.actionName);
    expect(names).toContain('kill_switch_enable');
  });

  it('should mark all actions as dry-run executed', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_006' });
    result.actions.forEach(a => {
      expect(a.dryRunExecuted).toBe(true);
    });
  });

  it('should prevent live actions for all', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_007' });
    result.actions.forEach(a => {
      expect(a.liveActionPrevented).toBe(true);
    });
  });

  it('should have safeSummary', async () => {
    const result = await runTask030ControlActionRehearsal({ runId: 'run_control_008' });
    expect(typeof result.safeSummary).toBe('string');
  });
});
