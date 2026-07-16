import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseFairnessCheckRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseFairnessService } from '../services/recoveryCaseFairnessService';
import { PROHIBITED_RANKING_FACTORS, RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Fairness and Prohibited Factors', () => {
  let repo: InMemoryRecoveryCaseFairnessCheckRepository;
  let service: RecoveryCaseFairnessService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-fair-1',
    idempotencyKey: 'ik-fair-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseFairnessCheckRepository();
    service = new RecoveryCaseFairnessService(repo);
  });

  it('fairness check rejects prohibited factors', async () => {
    const result = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { race: 'some-value', genderIdentity: 'other-value' },
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('blocked');
    expect(result.message).toContain('Prohibited ranking factors detected');
  });

  it('prohibited factors list is complete', () => {
    const expectedFirst = [
      'race', 'ethnicity', 'religiousIdentity', 'sectIdentity', 'genderIdentity',
      'sexualOrientation', 'familyIncome', 'paymentStatus', 'parentEngagementScore',
      'diagnosis', 'medicalAssessment', 'psychologicalAssessment',
    ];
    for (const f of expectedFirst) {
      expect(PROHIBITED_RANKING_FACTORS).toContain(f);
    }
    expect(PROHIBITED_RANKING_FACTORS).toContain('rawStudentAnswer');
    expect(PROHIBITED_RANKING_FACTORS).toContain('answerKeyText');
    expect(PROHIBITED_RANKING_FACTORS).toContain('unreleasedScore');
    expect(PROHIBITED_RANKING_FACTORS).toContain('unreleasedGrade');
    expect(PROHIBITED_RANKING_FACTORS).toContain('personalityProfile');
  });

  it('evaluateFairnessCheck returns blocked when prohibited factor detected', async () => {
    const result = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { familyIncome: 'low', parentOccupation: 'engineer' },
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('blocked');
    expect(result.data?.fairnessStatus).toBe('blocked');
  });

  it('evaluateFairnessCheck returns allowed when no prohibited factors', async () => {
    const result = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { riskLevel: 'high', hasActiveBlocker: true },
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('allowed');
    expect(result.data?.fairnessStatus).toBe('allowed');
    expect(result.data?.safeFairnessSummary).toContain('All factors are allowed');
  });

  it('fairness check passes before queue inclusion', async () => {
    const allowed = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { risk_level: 'high' },
    });
    expect(allowed.success).toBe(true);

    const blocked = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-2',
      fairnessChecksJson: { race: 'any' },
    });
    expect(blocked.success).toBe(false);
  });

  it('blocked fairness prevents queue item creation through status', async () => {
    const result = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { diagnosis: 'ADHD' },
    });
    expect(result.data?.fairnessStatus).toBe('blocked');
    expect(result.data?.blockedReasonCodesJson).toContain('PROHIBITED_FACTOR:diagnosis');
  });

  it('blocked fairness prevents allocation/escalation/review-window draft creation via status', async () => {
    const blockedResult = await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { socioeconomicIndicator: 'low' },
    });
    expect(blockedResult.success).toBe(false);
    expect(blockedResult.data?.fairnessStatus).toBe('blocked');

    const check = await service.getFairnessCheck('school-1', blockedResult.data!.fairnessCheckId);
    expect(check.success).toBe(true);
    expect(check.data?.fairnessStatus).toBe('blocked');
  });

  it('createFairnessCheck creates record with allowed default status', async () => {
    const result = await service.createFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.fairnessStatus).toBe('allowed');
  });

  it('list fairness checks by status works', async () => {
    await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-1',
      fairnessChecksJson: { race: 'value' },
    });
    await service.evaluateFairnessCheck(ctx, 'school-1', {
      priorityAssessmentId: 'pa-2',
      fairnessChecksJson: { riskLevel: 'high' },
    });
    const blockedList = await service.listFairnessChecksByStatus('school-1', 'blocked');
    const allowedList = await service.listFairnessChecksByStatus('school-1', 'allowed');
    expect(blockedList.data).toHaveLength(1);
    expect(allowedList.data).toHaveLength(1);
  });
});
