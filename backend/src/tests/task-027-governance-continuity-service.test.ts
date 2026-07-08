import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkGovernanceContinuity,
  _setTestMode,
  _resetDependencyCache,
} from '../services/task027GovernanceContinuityService';

describe('task027GovernanceContinuityService', () => {
  beforeEach(() => {
    _resetDependencyCache();
  });

  it('returns ok when all continuity checks pass', async () => {
    _setTestMode(true);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.safeMessage).toContain('verified');
    expect(result.safeMessage).toContain('school-1');
  });

  it('returns blocked when all continuity checks fail', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
    expect(result.safeMessage).toContain('failed');
  });

  it('reports task020 governance continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 020 security/privacy governance'
    );
  });

  it('reports task021 continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 021 verified school identity and role scope'
    );
  });

  it('reports task022 continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 022 content/source governance'
    );
  });

  it('reports task023 continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 023 deployment readiness'
    );
  });

  it('reports task024 continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 024 operations readiness'
    );
  });

  it('reports task025 continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 025 pilot readiness'
    );
  });

  it('reports task026 continuity failure', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-1' });
    expect(result.blockingIssues).toContain(
      'Governance continuity failed: Task 026 pilot execution'
    );
  });

  it('safeMessage includes schoolId when failed', async () => {
    _setTestMode(false);

    const result = await checkGovernanceContinuity({ schoolId: 'school-42' });
    expect(result.safeMessage).toContain('school-42');
  });
});
