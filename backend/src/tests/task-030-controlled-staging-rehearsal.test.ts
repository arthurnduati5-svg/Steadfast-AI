import { describe, it, expect } from 'vitest';
import { runControlledStagingRehearsal } from '../services/task030ControlledStagingRehearsalService';

describe('Task 030 - Controlled Staging Rehearsal', () => {
  it('should run rehearsal scenario', async () => {
    const result = await runControlledStagingRehearsal();
    expect(result.scenarioRun).toBe(true);
    expect(result.scenarioMode).toBe('safe_synthetic_staging_rehearsal');
  });

  it('should load Task 029 proof when flags are set', async () => {
    const origStaging = process.env.TASK030_STAGING_REHEARSAL;
    const origNoLive = process.env.TASK030_NO_LIVE_STUDENTS;
    process.env.TASK030_STAGING_REHEARSAL = '1';
    process.env.TASK030_NO_LIVE_STUDENTS = '1';
    const result = await runControlledStagingRehearsal();
    expect(result.task029ProofLoaded).toBe(true);
    process.env.TASK030_STAGING_REHEARSAL = origStaging;
    process.env.TASK030_NO_LIVE_STUDENTS = origNoLive;
  });

  it('should generate role matrix', async () => {
    const result = await runControlledStagingRehearsal();
    expect(result.roleMatrixGenerated).toBe(true);
  });

  it('should have all journey checks complete', async () => {
    const result = await runControlledStagingRehearsal();
    expect(result.adminJourneyPassed).toBe(true);
    expect(result.teacherJourneyPassed).toBe(true);
    expect(result.studentJourneyPassed).toBe(true);
    expect(result.unknownRoleDenied).toBe(true);
  });

  it('should have all gates passed', async () => {
    const result = await runControlledStagingRehearsal({
      skipTask029Proof: false,
      skipEnvironmentGate: false,
      skipLiveStudentGuard: false,
    });
    expect(result.privacyGatePassed).toBe(true);
    expect(result.deenGatePassed).toBe(true);
    expect(result.socraticGatePassed).toBe(true);
    expect(result.curriculumGatePassed).toBe(true);
  });
});
