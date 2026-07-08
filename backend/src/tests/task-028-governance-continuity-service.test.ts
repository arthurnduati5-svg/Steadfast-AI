import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkGovernanceContinuity,
  _resetDependencyCache,
  _setTestMode,
} from '../services/task027GovernanceContinuityService';

describe('Task 028 Governance Continuity Service', () => {
  beforeEach(() => {
    _resetDependencyCache();
    process.env.NODE_ENV = 'test';
  });

  it('should pass governance continuity for valid school', async () => {
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toEqual([]);
    expect(result.safeMessage).toContain('verified');
  });

  it('should fail when test mode has all continuity failed', async () => {
    _setTestMode(false);
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
    expect(result.blockingIssues[0]).toContain('Governance continuity failed');
  });

  it('should report blocking issues for Task 020 failure', async () => {
    _setTestMode(false);
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    const task020Issue = result.blockingIssues.find(i => i.includes('020'));
    expect(task020Issue).toBeTruthy();
    expect(task020Issue).toContain('security/privacy governance');
  });

  it('should report blocking issues for Task 021 failure', async () => {
    _setTestMode(false);
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    const task021Issue = result.blockingIssues.find(i => i.includes('021'));
    expect(task021Issue).toBeTruthy();
    expect(task021Issue).toContain('school identity');
  });

  it('should report blocking issues for Task 022 failure', async () => {
    _setTestMode(false);
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    const task022Issue = result.blockingIssues.find(i => i.includes('022'));
    expect(task022Issue).toBeTruthy();
    expect(task022Issue).toContain('content/source governance');
  });

  it('should report blocking issues for all tasks 020-026 when all fail', async () => {
    _setTestMode(false);
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues.length).toBe(7);
  });

  it('should reset correctly between tests', async () => {
    _setTestMode(false);
    const failed = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(failed.ok).toBe(false);

    _resetDependencyCache();
    const passed = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(passed.ok).toBe(true);
  });

  it('should include schoolId in safeMessage', async () => {
    const result = await checkGovernanceContinuity({ schoolId: 'specific-school-123' });
    expect(result.safeMessage).toContain('specific-school-123');
  });

  it('should include failure details in safeMessage when failing', async () => {
    _setTestMode(false);
    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.safeMessage).toContain('Governance continuity failed');
    expect(result.safeMessage).toContain('school-1');
  });
});
