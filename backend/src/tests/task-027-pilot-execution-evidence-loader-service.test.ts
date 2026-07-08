import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import { loadPilotExecutionEvidence } from '../services/task027PilotExecutionEvidenceLoaderService';

const validInput = {
  schoolId: 'school-1',
  pilotRunId: 'pilot-1',
  executionRunId: 'exec-1',
};

function seedValidEvidence(): void {
  govRepo.recordEvidenceSummary('school-1', 'pilot-1', {
    pilotRunId: 'pilot-1',
    schoolId: 'school-1',
    cohortSafeCount: 30,
    sessionsStartedCount: 100,
    sessionsBlockedCount: 5,
    supportNeededCount: 10,
    incidentCount: 2,
    safeguardingSignalCount: 0,
    pauseCount: 0,
    rollbackCount: 0,
    safeLearningQualitySignals: { comprehensionRate: 0.85 },
    safeSocraticIntegritySignals: { finalAnswerLeakCount: 0 },
    safeContentGovernanceSignals: { answerKeyLeakCount: 0 },
    safeOperationsSignals: { uptime: 0.999 },
  });
}

describe('task027PilotExecutionEvidenceLoaderService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('returns ok with evidence for valid school and pilot IDs', async () => {
    seedValidEvidence();

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.ok).toBe(true);
    expect(result.evidence).not.toBeNull();
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('returns evidence with expected schoolId and pilotRunId', async () => {
    seedValidEvidence();

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.schoolId).toBe('school-1');
    expect(result.evidence!.pilotRunId).toBe('pilot-1');
  });

  it('returns correct cohortSafeCount from evidence', async () => {
    seedValidEvidence();

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.cohortSafeCount).toBe(30);
  });

  it('returns correct sessionsStartedCount from evidence', async () => {
    seedValidEvidence();

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.sessionsStartedCount).toBe(100);
  });

  it('returns correct sessionsBlockedCount from evidence', async () => {
    seedValidEvidence();

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.sessionsBlockedCount).toBe(5);
  });

  it('returns null evidence when no data exists', async () => {
    const result = await loadPilotExecutionEvidence({
      schoolId: 'missing-school',
      pilotRunId: 'missing-pilot',
      executionRunId: 'missing-exec',
    });
    expect(result.ok).toBe(false);
    expect(result.evidence).toBeNull();
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('returns blocking issue when evidence missing', async () => {
    const result = await loadPilotExecutionEvidence({
      schoolId: 'missing',
      pilotRunId: 'missing',
      executionRunId: 'missing',
    });
    expect(result.blockingIssues[0]).toContain('No pilot execution evidence found');
  });

  it('rejects evidence with rawStudentData forbidden field', async () => {
    govRepo.recordEvidenceSummary('school-1', 'pilot-1', {
      pilotRunId: 'pilot-1',
      schoolId: 'school-1',
      cohortSafeCount: 30,
      sessionsStartedCount: 100,
      sessionsBlockedCount: 5,
      supportNeededCount: 10,
      incidentCount: 2,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
      rawStudentData: 'leaked',
      safeLearningQualitySignals: {},
      safeSocraticIntegritySignals: {},
      safeContentGovernanceSignals: {},
      safeOperationsSignals: {},
    } as any);

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.ok).toBe(false);
    expect(result.evidence).toBeNull();
    expect(result.blockingIssues[0]).toContain('forbidden');
  });

  it('rejects evidence with rawTeacherNotes forbidden field', async () => {
    govRepo.recordEvidenceSummary('school-1', 'pilot-1', {
      pilotRunId: 'pilot-1',
      schoolId: 'school-1',
      cohortSafeCount: 30,
      sessionsStartedCount: 100,
      sessionsBlockedCount: 5,
      supportNeededCount: 10,
      incidentCount: 2,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
      rawTeacherNotes: 'leaked',
      safeLearningQualitySignals: {},
      safeSocraticIntegritySignals: {},
      safeContentGovernanceSignals: {},
      safeOperationsSignals: {},
    } as any);

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.ok).toBe(false);
  });

  it('returns safeMessage when evidence loaded successfully', async () => {
    seedValidEvidence();

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.safeMessage).toContain('loaded and verified');
  });

  it('loads teacherMonitoringSnapshotSafeSummary if present', async () => {
    govRepo.recordEvidenceSummary('school-1', 'pilot-1', {
      pilotRunId: 'pilot-1',
      schoolId: 'school-1',
      cohortSafeCount: 30,
      sessionsStartedCount: 100,
      sessionsBlockedCount: 5,
      supportNeededCount: 10,
      incidentCount: 2,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
      safeLearningQualitySignals: {},
      safeSocraticIntegritySignals: {},
      safeContentGovernanceSignals: {},
      safeOperationsSignals: {},
      teacherMonitoringSnapshotSafeSummary: { unresolvedFeedback: false } as any,
      dailyPilotSummarySafeMetadata: { learnerFeedbackUnresolved: false } as any,
    } as any);

    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.ok).toBe(true);
  });

  it('provides evidence with incidentCount from repo', async () => {
    seedValidEvidence();
    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.incidentCount).toBe(2);
  });

  it('provides evidence with safeguardingSignalCount from repo', async () => {
    seedValidEvidence();
    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.safeguardingSignalCount).toBe(0);
  });

  it('provides evidence with safeSocraticIntegritySignals from repo', async () => {
    seedValidEvidence();
    const result = await loadPilotExecutionEvidence(validInput);
    expect(result.evidence!.safeSocraticIntegritySignals).toEqual({ finalAnswerLeakCount: 0 });
  });
});
