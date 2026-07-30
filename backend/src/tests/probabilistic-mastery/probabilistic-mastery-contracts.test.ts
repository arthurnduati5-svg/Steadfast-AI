import { describe, it, expect } from 'vitest';
import type {
  MasteryActorContext,
  MasteryTarget,
  NormalizedMasteryEvidence,
  MasteryState,
  MasteryPolicyConfig,
  MasteryEstimationStrategy,
  MasteryEstimationInput,
  MasteryEstimationResult,
  VisibleMasteryLabel,
  CognitiveDiagnosis,
  NextBestAction,
  PrerequisiteReader,
  MasteryChangeLog,
} from '../../services/probabilisticMasteryContracts';

describe('ProbabilisticMasteryContracts', () => {
  it('MasteryActorContext has required fields', () => {
    const ctx: MasteryActorContext = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'student',
      requestId: 'req-1',
      correlationId: 'corr-1',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorRole).toBe('student');
  });

  it('MasteryTarget has required identity fields', () => {
    const t: MasteryTarget = {
      schoolId: 's1',
      learnerId: 'l1',
      targetNodeId: 'n1',
      targetNodeType: 'skill',
      curriculumVersionId: 'v1',
    };
    expect(t.targetNodeType).toBe('skill');
  });

  it('NormalizedMasteryEvidence has required fields', () => {
    const ev: NormalizedMasteryEvidence = {
      evidenceId: 'e1',
      schoolId: 's1',
      learnerId: 'l1',
      targetNodeId: 'n1',
      targetNodeType: 'skill',
      curriculumVersionId: 'v1',
      sourceType: 'practice_attempt',
      outcome: 1,
      usable: true,
      markingConfidence: 1,
      integrityRisk: 0,
      independence: 1,
      hintDependency: 0,
      explanationQuality: null,
      misconceptionTags: [],
      transferSignal: null,
      retentionSignal: null,
      occurredAt: new Date(),
      committedAt: new Date(),
      policyVersion: 'v1',
      supersedes: null,
    };
    expect(ev.evidenceId).toBe('e1');
    expect(ev.outcome).toBe(1);
  });

  it('VisibleMasteryLabel values are valid', () => {
    const labels: VisibleMasteryLabel[] = [
      'not_started', 'introduced', 'attempted', 'developing',
      'near_mastery', 'mastered', 'needs_revisit',
    ];
    for (const l of labels) {
      expect(l).toBeTruthy();
    }
  });

  it('MasteryState has bounded probabilities', () => {
    const state: MasteryState = {
      schoolId: 's1',
      learnerId: 'l1',
      targetNodeId: 'n1',
      targetNodeType: 'skill',
      curriculumVersionId: 'v1',
      probabilityOfMastery: 0.5,
      confidence: 0.7,
      evidenceCount: 5,
      lastEvidenceAt: new Date(),
      decayRisk: 0.1,
      misconceptionTags: [],
      independenceScore: 0.8,
      hintDependencyScore: 0.2,
      retentionScore: 0.6,
      transferScore: 0.4,
      visibleLabel: 'developing',
      policyVersion: 'v1',
      strategyId: 's1',
      strategyVersion: '1.0',
      stateRevision: 1,
      updatedAt: new Date(),
      consecutiveMissCountSinceMastered: 0,
    };
    expect(state.probabilityOfMastery).toBeGreaterThanOrEqual(0);
    expect(state.probabilityOfMastery).toBeLessThanOrEqual(1);
    expect(state.confidence).toBeGreaterThanOrEqual(0);
    expect(state.confidence).toBeLessThanOrEqual(1);
  });

  it('MasteryState includes consecutiveMissCountSinceMastered', () => {
    const state: MasteryState = {
      schoolId: 's1',
      learnerId: 'l1',
      targetNodeId: 'n1',
      targetNodeType: 'skill',
      curriculumVersionId: 'v1',
      probabilityOfMastery: 0.5,
      confidence: 0.7,
      evidenceCount: 5,
      lastEvidenceAt: new Date(),
      decayRisk: 0.1,
      misconceptionTags: [],
      independenceScore: 0.8,
      hintDependencyScore: 0.2,
      retentionScore: 0.6,
      transferScore: 0.4,
      visibleLabel: 'developing',
      policyVersion: 'v1',
      strategyId: 's1',
      strategyVersion: '1.0',
      stateRevision: 1,
      updatedAt: new Date(),
      consecutiveMissCountSinceMastered: 0,
    };
    expect(state.consecutiveMissCountSinceMastered).toBe(0);
    state.consecutiveMissCountSinceMastered = 3;
    expect(state.consecutiveMissCountSinceMastered).toBe(3);
  });

  it('MasteryEstimationStrategy interface works', () => {
    const strategy: MasteryEstimationStrategy = {
      strategyId: 'test',
      strategyVersion: '1.0',
      estimate(input: MasteryEstimationInput): MasteryEstimationResult {
        return { probabilityOfMastery: 0.5, confidence: 0.5, effectiveEvidenceWeight: 1 };
      },
    };
    const result = strategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 1,
    });
    expect(result.probabilityOfMastery).toBe(0.5);
    expect(result.confidence).toBe(0.5);
  });

  it('CognitiveDiagnosis has required fields', () => {
    const d: CognitiveDiagnosis = {
      diagnosisId: 'd1',
      schoolId: 's1',
      learnerId: 'l1',
      targetNodeId: 'n1',
      diagnosisStatus: 'healthy',
      primaryReason: 'stable_progress',
      reasonCodes: ['stable_progress'],
      weakDirectPrerequisites: [],
      weakTransitivePrerequisites: [],
      misconceptionTags: [],
      evidenceCount: 5,
      confidence: 0.7,
      contributingEvidenceIds: ['e1'],
      generatedAt: new Date(),
      policyVersion: 'v1',
    };
    expect(d.diagnosisId).toBe('d1');
    expect(d.diagnosisStatus).toBe('healthy');
  });

  it('NextBestAction uses valid action type', () => {
    const a: NextBestAction = { action: 'practice', reasonCodes: ['stable_progress'], safeDescription: 'Keep practicing.' };
    expect(a.action).toBe('practice');
  });

  it('MasteryChangeLog preserves previous state', () => {
    const log: MasteryChangeLog = {
      changeId: 'c1',
      schoolId: 's1',
      learnerId: 'l1',
      targetNodeId: 'n1',
      previousState: null,
      newState: {} as MasteryState,
      contributingEvidenceIds: ['e1'],
      policyVersion: 'v1',
      strategyId: 's1',
      reasonCodes: ['stable_progress'],
      createdAt: new Date(),
      correlationId: 'corr1',
    };
    expect(log.previousState).toBeNull();
    expect(log.contributingEvidenceIds).toContain('e1');
  });

  it('MasteryPolicyConfig has all fields typed', () => {
    const policy: MasteryPolicyConfig = {
      policyVersion: 'v1',
      sourceWeights: { tutor_attempt: 1, practice_attempt: 1, daily_objective_check: 1, teach_back: 1, reflection: 1, revision_recall: 1, assessment_result: 1, teacher_observation: 1, artifact_activity: 1, video_learning_checkpoint: 1, manual_seed_fixture: 1 },
      minimumUsableEvidenceCount: 3,
      markingConfidenceAdjustment: 0.3,
      integrityRiskPenalty: -0.5,
      independenceBonus: 0.2,
      hintDependencyPenalty: -0.3,
      explanationAdjustment: { missing: 0, weak: 0.05, partial: 0.1, strong: 0.2 },
      recencyHalfLifeDays: 30,
      decayEnabled: true,
      decayRatePerDay: 0.01,
      decayMinProbability: 0.05,
      retentionContribution: 0.1,
      transferContribution: 0.1,
      misconceptionPenalty: -0.15,
      labelThresholds: { not_started: 0, introduced: 0.05, attempted: 0.1, developing: 0.25, near_mastery: 0.5, mastered: 0.75, needs_revisit: 0.2 },
      prerequisiteThreshold: 0.5,
      modelUncertaintyThreshold: 0.3,
      masteredToNeedsRevisitMissCount: 3,
      masteredToNeedsRevisitDecayDays: 60,
      strategyId: 's1',
      strategyVersion: '1.0',
    };
    expect(policy.minimumUsableEvidenceCount).toBe(3);
  });
});
