import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030OperationsConsoleRehearsal } from '../services/task030OperationsConsoleRehearsalService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Operations Console Rehearsal', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allPassed true', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_002' });
    expect(result.allPassed).toBe(true);
  });

  it('should have 14 console components', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_003' });
    expect(result.consoleComponents).toHaveLength(14);
  });

  it('should include dashboard component', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_004' });
    const names = result.consoleComponents.map(c => c.componentName);
    expect(names).toContain('dashboard');
  });

  it('should include run_status component', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_005' });
    const names = result.consoleComponents.map(c => c.componentName);
    expect(names).toContain('run_status');
  });

  it('should include diagnostics component', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_006' });
    const names = result.consoleComponents.map(c => c.componentName);
    expect(names).toContain('diagnostics');
  });

  it('should mark all components as accessible', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_007' });
    result.consoleComponents.forEach(c => {
      expect(c.accessible).toBe(true);
    });
  });

  it('should have safe summary mentioning DRY RUN', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_008' });
    result.consoleComponents.forEach(c => {
      expect(c.safeSummary).toContain('[DRY RUN]');
    });
  });

  it('should have blockingIssues array', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_009' });
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });

  it('should have safeSummary', async () => {
    const result = await runTask030OperationsConsoleRehearsal({ runId: 'run_console_010' });
    expect(typeof result.safeSummary).toBe('string');
  });
});
