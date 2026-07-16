import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryReviewerDecisionRepository,
  InMemoryConsensusRepository,
  InMemoryAdjudicationAuditRepository,
} from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseConsensusService } from '../services/recoveryCaseConsensusService';
import {
  RecoveryCaseAdjudicationCommandContext,
  AdjudicationDecisionCodes,
  AllowedAdjudicationActorRoles,
  ForbiddenAdjudicationActorRoles,
} from '../contracts';

function makeCtx(overrides?: Partial<RecoveryCaseAdjudicationCommandContext>): RecoveryCaseAdjudicationCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
    ...overrides,
  };
}

const DEFAULT_DECISION_INPUT = {
  reviewerActorId: 'r1',
  reviewerRole: 'teacher',
  reviewerPosition: 'primary' as const,
  reasonCodes: {},
  sourceRefs: {},
};

describe('Package 26 - Consensus Evaluation', () => {
  let decisionRepo: InMemoryReviewerDecisionRepository;
  let consensusRepo: InMemoryConsensusRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseConsensusService;

  beforeEach(() => {
    decisionRepo = new InMemoryReviewerDecisionRepository();
    consensusRepo = new InMemoryConsensusRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseConsensusService(consensusRepo, decisionRepo, auditRepo);
  });

  async function makeDecision(overrides: Record<string, unknown> = {}) {
    const input = {
      schoolId: 'school-1' as string,
      queueItemId: 'queue-1' as string,
      ...DEFAULT_DECISION_INPUT,
      decisionCode: 'confirm_priority' as string,
      safeDecisionSummary: 'Test decision' as string,
      createdByActorId: 'actor-1' as string,
      createdByRole: 'teacher' as string,
      ...overrides,
    };
    return decisionRepo.create(input as any);
  }

  it('matching decisions with same decisionCode and same recommendedPriorityBand produce consensus_reached', async () => {
    const primary = await makeDecision({ decisionCode: 'confirm_priority', recommendedPriorityBand: 'high', reviewerActorId: 'reviewer-a' });
    const secondary = await makeDecision({ decisionCode: 'confirm_priority', recommendedPriorityBand: 'high', reviewerActorId: 'reviewer-b' });
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', primary.reviewerDecisionId, secondary.reviewerDecisionId);
    expect(result.success).toBe(true);
    expect(result.data!.consensusStatus).toBe('consensus_reached');
    expect(result.data!.canReachConsensus).toBe(true);
  });

  it('matching decisions with same decisionCode but different recommendedPriorityBand produce partial_consensus', async () => {
    const primary = await makeDecision({ decisionCode: 'confirm_priority', recommendedPriorityBand: 'high', reviewerActorId: 'reviewer-a' });
    const secondary = await makeDecision({ decisionCode: 'confirm_priority', recommendedPriorityBand: 'normal', reviewerActorId: 'reviewer-b' });
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', primary.reviewerDecisionId, secondary.reviewerDecisionId);
    expect(result.success).toBe(true);
    expect(result.data!.consensusStatus).toBe('partial_consensus');
    expect(result.data!.differingFields).toContain('recommendedPriorityBand');
  });

  it('different decision codes produce disagreement', async () => {
    const primary = await makeDecision({ decisionCode: 'confirm_priority', recommendedPriorityBand: 'high', reviewerActorId: 'reviewer-a' });
    const secondary = await makeDecision({ decisionCode: 'recommend_escalation', recommendedPriorityBand: 'high', reviewerActorId: 'reviewer-b' });
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', primary.reviewerDecisionId, secondary.reviewerDecisionId);
    expect(result.success).toBe(true);
    expect(result.data!.consensusStatus).toBe('disagreement');
    expect(result.data!.differingFields).toContain('decisionCode');
  });

  it('cross-school decisions are rejected', async () => {
    const primary = await makeDecision({ schoolId: 'school-1', reviewerActorId: 'reviewer-a' });
    const secondary = await makeDecision({ schoolId: 'school-2', reviewerActorId: 'reviewer-b' });
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', primary.reviewerDecisionId, secondary.reviewerDecisionId);
    expect(result.success).toBe(false);
    expect(result.status).toBe('error');
    expect(result.errorCode).toBe('SCHOOL_MISMATCH');
  });

  it('different queue items are rejected', async () => {
    const primary = await makeDecision({ queueItemId: 'queue-1', reviewerActorId: 'reviewer-a' });
    const secondary = await makeDecision({ queueItemId: 'queue-2', reviewerActorId: 'reviewer-b' });
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', primary.reviewerDecisionId, secondary.reviewerDecisionId);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('QUEUE_ITEM_MISMATCH');
  });

  it('blocked or void decisions are rejected', async () => {
    const primary = await makeDecision({ reviewerActorId: 'reviewer-a' });
    const secondary = await makeDecision({ reviewerActorId: 'reviewer-b' });
    await decisionRepo.updateStatus(secondary.reviewerDecisionId, 'blocked', ['policy_violation']);
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', primary.reviewerDecisionId, secondary.reviewerDecisionId);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('SECONDARY_DECISION_INVALID');
  });

  it('one reviewer cannot create two-reviewer consensus', async () => {
    const decision = await makeDecision({ reviewerActorId: 'reviewer-a' });
    const result = await service.evaluateReviewerConsensus('school-1', 'queue-1', decision.reviewerDecisionId, decision.reviewerDecisionId);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('DUPLICATE_REVIEWER');
  });

  it('system_job cannot declare consensus (role policy restriction)', async () => {
    expect(AllowedAdjudicationActorRoles).toContain('system_job');
    const policy = await import('../policies/recoveryCaseAdjudicationPolicyDefinitions');
    const perms = policy.ADJUDICATION_ROLE_PERMISSIONS['system_job'];
    expect(perms).not.toContain('createConsensus');
  });

  it('consensus status starts as pending', async () => {
    const result = await service.createConsensusRecord(
      makeCtx({ actorRole: 'teacher' }),
      {
        schoolId: 'school-1',
        queueItemId: 'queue-1',
        primaryDecisionId: 'pd-1',
        secondaryDecisionId: 'sd-1',
        safeConsensusSummary: 'Pending test',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      },
    );
    expect(result.success).toBe(true);
    expect(result.data!.consensusStatus).toBe('pending');
  });
});
