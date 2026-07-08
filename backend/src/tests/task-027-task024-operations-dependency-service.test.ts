import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkTask024Dependency,
  _setTestMode,
  _resetDependencyCache,
} from '../services/task027Task024OperationsDependencyService';

describe('task027Task024OperationsDependencyService', () => {
  beforeEach(() => {
    _resetDependencyCache();
  });

  it('returns ok when all dependencies pass', async () => {
    _setTestMode({
      accepted: true,
      monitoringReadinessExists: true,
      incidentPathExists: true,
      pausePathExists: true,
      rollbackPathExists: true,
      backupRestoreDryRunProofExists: true,
      operationalPrivacyScanProofExists: true,
    });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.safeMessage).toContain('verified');
  });

  it('reports blocking issue when task024 not accepted', async () => {
    _setTestMode({ accepted: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Task 024 not accepted (expected commit 6a9fd62)');
  });

  it('reports blocking issue when monitoring readiness missing', async () => {
    _setTestMode({ monitoringReadinessExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Monitoring readiness does not exist');
  });

  it('reports blocking issue when incident path missing', async () => {
    _setTestMode({ incidentPathExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Incident path does not exist');
  });

  it('reports blocking issue when pause path missing', async () => {
    _setTestMode({ pausePathExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Pause path does not exist');
  });

  it('reports blocking issue when rollback path missing', async () => {
    _setTestMode({ rollbackPathExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Rollback path does not exist');
  });

  it('reports blocking issue when backup restore dry-run proof missing', async () => {
    _setTestMode({ backupRestoreDryRunProofExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Backup/restore dry-run proof does not exist');
  });

  it('reports blocking issue when operational privacy scan proof missing', async () => {
    _setTestMode({ operationalPrivacyScanProofExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Operational privacy scan proof does not exist');
  });

  it('safeMessage contains blocking issues when failed', async () => {
    _setTestMode({ accepted: false, monitoringReadinessExists: false });

    const result = await checkTask024Dependency({ schoolId: 'school-1' });
    expect(result.ok).toBe(false);
    expect(result.safeMessage).toContain('Task 024 operations dependency failed');
    expect(result.safeMessage).toContain('6a9fd62');
  });
});
