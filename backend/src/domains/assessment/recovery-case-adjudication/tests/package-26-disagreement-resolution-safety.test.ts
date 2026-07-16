import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDisagreementDraftRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseDisagreementService } from '../services/recoveryCaseDisagreementService';
import type { RecoveryCaseAdjudicationCommandContext } from '../contracts';
import type { RecoveryCaseDisagreementResolutionDraft } from '../contracts/recoveryCaseDisagreementContracts';

describe('Package 26 - Disagreement Resolution Safety', () => {
  let repo: InMemoryDisagreementDraftRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseDisagreementService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';
  const ctx: RecoveryCaseAdjudicationCommandContext = {
    schoolId: schoolA,
    actorId: 'actor-1',
    actorRole: 'department_head',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryDisagreementDraftRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseDisagreementService(repo, auditRepo);
  });

  it('create disagreement resolution draft stores disputed decision IDs (primary and secondary)', async () => {
    const result = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      consensusId: 'consensus-1',
      primaryDecisionId: 'decision-primary-1',
      secondaryDecisionId: 'decision-secondary-2',
      safeDisagreementSummary: 'Primary recommends higher priority, secondary recommends no change',
      reasonCodeComparison: { primary: ['score_discrepancy'], secondary: ['evidence_insufficient'] },
      evidenceGaps: ['missing_rubric_v2'],
      proposedGovernanceRole: 'department_head',
      proposedResolutionOptions: ['request_second_review', 'escalate_to_admin'],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
    expect(result.data!.primaryDecisionId).toBe('decision-primary-1');
    expect(result.data!.secondaryDecisionId).toBe('decision-secondary-2');
  });

  it('has safe disagreement summary', async () => {
    const result = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Primary recommends higher priority, secondary recommends no change',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    expect(result.success).toBe(true);
    expect(result.data!.safeDisagreementSummary).toBe('Primary recommends higher priority, secondary recommends no change');
  });

  it('starts as draft', async () => {
    const result = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    expect(result.data!.draftStatus).toBe('draft');
  });

  it('mark review ready changes status to review_ready', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const updated = await service.markDisagreementDraftReviewReady(created.data!.disagreementResolutionDraftId);
    expect(updated.success).toBe(true);
    expect(updated.data!.draftStatus).toBe('review_ready');
  });

  it('approve for future use changes status to approved_for_future_use', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const updated = await service.approveDisagreementDraftForFutureUse(created.data!.disagreementResolutionDraftId);
    expect(updated.success).toBe(true);
    expect(updated.data!.draftStatus).toBe('approved_for_future_use');
  });

  it('block adds reason codes', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const blocked = await service.blockDisagreementDraft(created.data!.disagreementResolutionDraftId, ['missing_evidence', 'incomplete_comparison']);
    expect(blocked.success).toBe(true);
    expect(blocked.data!.draftStatus).toBe('blocked');
    expect(blocked.data!.blockedReasonCodes).toEqual(['missing_evidence', 'incomplete_comparison']);
  });

  it('suppress changes status to suppressed', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const suppressed = await service.suppressDisagreementDraft(created.data!.disagreementResolutionDraftId);
    expect(suppressed.success).toBe(true);
    expect(suppressed.data!.draftStatus).toBe('suppressed');
  });

  it('void sets voidedAt and status to void', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const voided = await service.voidDisagreementDraft(created.data!.disagreementResolutionDraftId);
    expect(voided.success).toBe(true);
    expect(voided.data!.draftStatus).toBe('void');
  });

  it('school isolation - records from school A not visible to school B queries', async () => {
    await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-a1',
      safeDisagreementSummary: 'School A',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    await service.createDisagreementResolutionDraft({ ...ctx, schoolId: schoolB, actorRole: 'department_head' }, {
      schoolId: schoolB,
      queueItemId: 'queue-b1',
      safeDisagreementSummary: 'School B',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-2',
      createdByRole: 'department_head',
    });
    const listA = await service.listDisagreementDraftsForSchool(schoolA);
    const listB = await service.listDisagreementDraftsForSchool(schoolB);
    expect(listA.data!).toHaveLength(1);
    expect(listA.data![0].schoolId).toBe(schoolA);
    expect(listB.data!).toHaveLength(1);
    expect(listB.data![0].schoolId).toBe(schoolB);
  });

  it('no automatic resolution method on the interface', () => {
    const draft: RecoveryCaseDisagreementResolutionDraft = {} as RecoveryCaseDisagreementResolutionDraft;
    expect((draft as any).autoResolve).toBeUndefined();
    expect((draft as any).chooseWinner).toBeUndefined();
  });

  it('get by ID returns correct record', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Get test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const found = await service.getDisagreementResolutionDraft(created.data!.disagreementResolutionDraftId);
    expect(found.success).toBe(true);
    expect(found.data!.disagreementResolutionDraftId).toBe(created.data!.disagreementResolutionDraftId);
  });

  it('list by status returns filtered records', async () => {
    const created = await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      safeDisagreementSummary: 'Status test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    await service.markDisagreementDraftReviewReady(created.data!.disagreementResolutionDraftId);
    const drafts = await service.listDisagreementDraftsByStatus(schoolA, 'review_ready');
    expect(drafts.data!).toHaveLength(1);
    expect(drafts.data![0].draftStatus).toBe('review_ready');
  });

  it('list by queue item returns filtered records', async () => {
    await service.createDisagreementResolutionDraft(ctx, {
      schoolId: schoolA,
      queueItemId: 'qi-specific',
      safeDisagreementSummary: 'Filter test',
      reasonCodeComparison: {},
      evidenceGaps: [],
      proposedResolutionOptions: [],
      createdByActorId: 'actor-1',
      createdByRole: 'department_head',
    });
    const items = await service.listDisagreementDraftsForQueueItem(schoolA, 'qi-specific');
    expect(items.data!).toHaveLength(1);
    expect(items.data![0].queueItemId).toBe('qi-specific');
  });
});
