import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseQueueExplanationRepository,
  InMemoryRecoveryCasePriorityFactorRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseQueueExplanationService } from '../services/recoveryCaseQueueExplanationService';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Queue Explanation Safety', () => {
  let repo: InMemoryRecoveryCaseQueueExplanationRepository;
  let factorRepo: InMemoryRecoveryCasePriorityFactorRepository;
  let service: RecoveryCaseQueueExplanationService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-exp-1',
    idempotencyKey: 'ik-exp-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseQueueExplanationRepository();
    factorRepo = new InMemoryRecoveryCasePriorityFactorRepository();
    service = new RecoveryCaseQueueExplanationService(repo, factorRepo);
  });

  it('creates queue explanation', async () => {
    const result = await service.createQueueExplanation(ctx, 'school-1', {
      queueItemId: 'qi-1',
      priorityAssessmentId: 'pa-1',
      queueSnapshotId: 'qs-1',
      explanationText: 'Rank 1: Score 85, Band critical_review',
      factorBreakdownJson: { risk_level: 35, case_age: 15 },
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.explanationText).toBe('Rank 1: Score 85, Band critical_review');
  });

  it('lists by item', async () => {
    await service.createQueueExplanation(ctx, 'school-1', {
      queueItemId: 'qi-1', priorityAssessmentId: 'pa-1', queueSnapshotId: 'qs-1',
    });
    await service.createQueueExplanation(ctx, 'school-1', {
      queueItemId: 'qi-2', priorityAssessmentId: 'pa-2', queueSnapshotId: 'qs-1',
    });
    const list = await service.listQueueExplanationsForItem('qi-1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by assessment', async () => {
    await service.createQueueExplanation(ctx, 'school-1', {
      queueItemId: 'qi-1', priorityAssessmentId: 'pa-1', queueSnapshotId: 'qs-1',
    });
    const list = await repo.listByAssessment('pa-1');
    expect(list).toHaveLength(1);
  });

  it('lists by snapshot', async () => {
    await service.createQueueExplanation(ctx, 'school-1', {
      queueItemId: 'qi-1', priorityAssessmentId: 'pa-1', queueSnapshotId: 'qs-1',
    });
    await service.createQueueExplanation(ctx, 'school-1', {
      queueItemId: 'qi-2', priorityAssessmentId: 'pa-2', queueSnapshotId: 'qs-1',
    });
    const list = await service.listQueueExplanationsForSnapshot('qs-1');
    expect(list.data).toHaveLength(2);
  });

  it('explanation contains factor breakdown', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [
        { code: 'risk_level', appliedPoints: 35, explanation: 'Risk level critical: +35 points' },
        { code: 'active_blocker', appliedPoints: 30, explanation: 'Active blocker: +30 points' },
      ],
      'No tie-break needed',
    );
    expect(result.data!.explanationText).toContain('risk_level');
    expect(result.data!.explanationText).toContain('active_blocker');
    expect(result.data!.explanationText).toContain('Factor Breakdown');
    expect(result.data!.explanationText).toContain('Tie-break Info');
  });

  it('no raw student answers in explanation', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [{ code: 'risk_level', appliedPoints: 10, explanation: 'Standard risk assessment' }],
      'None',
    );
    expect(result.data!.explanationText).not.toContain('rawStudentAnswer');
    expect(result.data!.explanationText).not.toContain('student said');
    expect(result.data!.explanationText).not.toContain('answer key');
  });

  it('no answer keys in explanation', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [{ code: 'case_age', appliedPoints: 5, explanation: 'Old case' }],
      'None',
    );
    expect(result.data!.explanationText).not.toContain('answerKeyText');
    expect(result.data!.explanationText).not.toContain('correct answer');
  });

  it('no hidden reasoning in explanation', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [{ code: 'risk_level', appliedPoints: 25, explanation: 'Standard' }],
      'None',
    );
    expect(result.data!.explanationText).not.toContain('internalReasoning');
    expect(result.data!.explanationText).not.toContain('chainOfThought');
    expect(result.data!.explanationText).not.toContain('modelOutput');
  });

  it('no sensitive personal data in explanation', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [{ code: 'risk_level', appliedPoints: 15, explanation: 'Medium risk' }],
      'None',
    );
    expect(result.data!.explanationText).not.toContain('diagnosis');
    expect(result.data!.explanationText).not.toContain('familyIncome');
    expect(result.data!.explanationText).not.toContain('homeAddress');
  });

  it('policy version is included', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [{ code: 'risk_level', appliedPoints: 5, explanation: 'Low' }],
      'No tie-break',
    );
    expect(result.data!.explanationText).toContain('RECOVERY_CASE_TRIAGE_PRIORITY_V1');
    const breakdown = result.data!.factorBreakdownJson as any;
    expect(breakdown.policyVersion).toBe('RECOVERY_CASE_TRIAGE_PRIORITY_V1');
  });

  it('tie-break info is included when applicable', async () => {
    const result = await service.buildSafeQueueExplanation(
      ctx, 'school-1', 'qi-1', 'pa-1', 'qs-1',
      [{ code: 'case_age', appliedPoints: 10, explanation: '7 days' }],
      'Tie-break applied: higher risk rank (critical > high)',
    );
    expect(result.data!.explanationText).toContain('Tie-break applied');
    const breakdown = result.data!.factorBreakdownJson as any;
    expect(breakdown.tieBreakInfo).toBe('Tie-break applied: higher risk rank (critical > high)');
  });
});
