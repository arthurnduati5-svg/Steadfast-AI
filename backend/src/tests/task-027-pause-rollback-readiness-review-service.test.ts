import { describe, it, expect, beforeEach } from 'vitest';
import { checkPauseRollbackReadiness } from '../services/task027PauseRollbackReadinessReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027PauseRollbackReadinessReviewService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('passes when all conditions are met', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: true,
      rollbackCanBlockExpansion: true,
      killSwitchExists: true,
      auditPreserved: true,
      noDestructiveDeletion: true,
      manualReviewPathExists: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when pause cannot block new learner access', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: false,
      rollbackCanBlockExpansion: true,
      killSwitchExists: true,
      auditPreserved: true,
      noDestructiveDeletion: true,
      manualReviewPathExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues).toContain('Pause mechanism cannot block new learner access during expansion.');
  });

  it('blocks when rollback cannot block expansion', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: true,
      rollbackCanBlockExpansion: false,
      killSwitchExists: true,
      auditPreserved: true,
      noDestructiveDeletion: true,
      manualReviewPathExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Rollback cannot halt expansion flow when triggered.');
  });

  it('blocks when kill switch is missing', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: true,
      rollbackCanBlockExpansion: true,
      killSwitchExists: false,
      auditPreserved: true,
      noDestructiveDeletion: true,
      manualReviewPathExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Kill switch does not exist for this expansion scope.');
  });

  it('blocks when audit trail is not preserved', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: true,
      rollbackCanBlockExpansion: true,
      killSwitchExists: true,
      auditPreserved: false,
      noDestructiveDeletion: true,
      manualReviewPathExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Audit trail not preserved during pause or rollback.');
  });

  it('blocks when destructive deletion risk is detected', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: true,
      rollbackCanBlockExpansion: true,
      killSwitchExists: true,
      auditPreserved: true,
      noDestructiveDeletion: false,
      manualReviewPathExists: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Destructive deletion risk detected in rollback path.');
  });

  it('blocks when multiple failures occur', async () => {
    const result = await checkPauseRollbackReadiness({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      pauseCanBlockNewLearnerAccess: false,
      rollbackCanBlockExpansion: false,
      killSwitchExists: false,
      auditPreserved: false,
      noDestructiveDeletion: false,
      manualReviewPathExists: false,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues.length).toBe(6);
  });
});
