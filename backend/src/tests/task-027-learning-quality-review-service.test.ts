import { describe, it, expect } from 'vitest';
import { reviewLearningQuality } from '../services/task027LearningQualityReviewService';

function buildValidEvidence(overrides?: Record<string, unknown>) {
  return {
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
    ...overrides,
  };
}

describe('task027LearningQualityReviewService', () => {
  it('returns ok with passed reviewStatus for valid evidence', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence(),
    });
    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('returns recommendations for passed review', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence(),
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toContain('satisfactory');
  });

  it('blocks when safeLearningQualitySignals is empty', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({ safeLearningQualitySignals: {} }),
    });
    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('blocked');
    expect(result.blockingIssues).toContain('Learning quality evidence missing');
  });

  it('blocks when blocked session rate exceeds 15%', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({
        sessionsStartedCount: 10,
        sessionsBlockedCount: 5,
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some((i) => i.includes('Blocked session rate'))).toBe(true);
  });

  it('includes recommendation to review blocked sessions', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({
        sessionsStartedCount: 10,
        sessionsBlockedCount: 5,
      }),
    });
    expect(result.recommendations).toContain('Review blocked sessions to identify root cause');
  });

  it('blocks when support-needed rate exceeds 25%', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({
        sessionsStartedCount: 10,
        supportNeededCount: 6,
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some((i) => i.includes('Support-needed rate'))).toBe(true);
  });

  it('includes recommendation to review support needs', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({
        sessionsStartedCount: 10,
        supportNeededCount: 6,
      }),
    });
    expect(result.recommendations).toContain('Review support needs and adjust scaffolding');
  });

  it('blocks when safeSocraticIntegritySignals is empty', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({ safeSocraticIntegritySignals: {} }),
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Socratic integrity not proven');
  });

  it('recommends collecting Socratic evidence when integrity not proven', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({ safeSocraticIntegritySignals: {} }),
    });
    expect(result.recommendations).toContain(
      'Collect Socratic integrity evidence before expansion'
    );
  });

  it('blocks when safeContentGovernanceSignals is empty', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({ safeContentGovernanceSignals: {} }),
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Content governance not proven');
  });

  it('blocks when teacher unresolvedFeedback is set', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({
        teacherMonitoringSnapshotSafeSummary: { unresolvedFeedback: true },
      } as any),
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Teacher safe feedback unresolved');
  });

  it('blocks when learner feedback unresolved', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({
        dailyPilotSummarySafeMetadata: { learnerFeedbackUnresolved: true },
      } as any),
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Learner safe feedback unresolved');
  });

  it('safeSummary contains status for blocked review', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence({ safeLearningQualitySignals: {} }),
    });
    expect(result.safeSummary).toContain('blocked');
  });

  it('safeSummary contains status for passed review', async () => {
    const result = await reviewLearningQuality({
      schoolId: 'school-1',
      pilotRunId: 'pilot-1',
      evidenceSummary: buildValidEvidence(),
    });
    expect(result.safeSummary).toContain('passed');
  });
});
