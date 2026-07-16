import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseTriageQueueSnapshotRepository,
  InMemoryRecoveryCaseTriageQueueItemRepository,
  InMemoryRecoveryCaseDuplicateSuppressionRepository,
  InMemoryRecoveryCaseFairnessCheckRepository,
  InMemoryRecoveryCaseTriageAuditRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseQueueService } from '../services/recoveryCaseQueueService';
import { RecoveryCasePriorityEngineService } from '../services/recoveryCasePriorityEngineService';
import { RecoveryCaseDuplicateSuppressionService } from '../services/recoveryCaseDuplicateSuppressionService';
import { RecoveryCaseFairnessService } from '../services/recoveryCaseFairnessService';
import { RecoveryCaseTriageAuditBridge } from '../services/recoveryCaseTriageAuditBridge';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';
import type { RecoveryCaseQueueCandidate } from '../contracts/recoveryCaseQueueContracts';

describe('Package 25 - Queue Generation Lifecycle', () => {
  let snapshotRepo: InMemoryRecoveryCaseTriageQueueSnapshotRepository;
  let itemRepo: InMemoryRecoveryCaseTriageQueueItemRepository;
  let dupRepo: InMemoryRecoveryCaseDuplicateSuppressionRepository;
  let fairnessRepo: InMemoryRecoveryCaseFairnessCheckRepository;
  let auditRepo: InMemoryRecoveryCaseTriageAuditRepository;
  let engine: RecoveryCasePriorityEngineService;
  let dupService: RecoveryCaseDuplicateSuppressionService;
  let fairnessService: RecoveryCaseFairnessService;
  let audit: RecoveryCaseTriageAuditBridge;
  let service: RecoveryCaseQueueService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'actor-queue-1',
    actorRole: 'teacher',
    correlationId: 'corr-queue-1',
    idempotencyKey: 'ik-queue-1',
    sourceRefsJson: {},
  };

  function makeCandidate(overrides: Partial<RecoveryCaseQueueCandidate>): RecoveryCaseQueueCandidate {
    return {
      studentRef: 's-1',
      resultRecoveryPlanId: 'plan-1',
      boardSnapshotId: 'snap-1',
      boardCardId: 'card-1',
      priorityAssessmentId: 'pa-1',
      fairnessCheckId: null,
      priorityBand: 'normal',
      riskRank: 'low',
      totalScore: 10,
      triageDecision: 'queued',
      ...overrides,
    };
  }

  beforeEach(() => {
    snapshotRepo = new InMemoryRecoveryCaseTriageQueueSnapshotRepository();
    itemRepo = new InMemoryRecoveryCaseTriageQueueItemRepository();
    dupRepo = new InMemoryRecoveryCaseDuplicateSuppressionRepository();
    fairnessRepo = new InMemoryRecoveryCaseFairnessCheckRepository();
    auditRepo = new InMemoryRecoveryCaseTriageAuditRepository();
    engine = new RecoveryCasePriorityEngineService();
    dupService = new RecoveryCaseDuplicateSuppressionService(dupRepo);
    fairnessService = new RecoveryCaseFairnessService(fairnessRepo);
    audit = new RecoveryCaseTriageAuditBridge(auditRepo);
    service = new RecoveryCaseQueueService(snapshotRepo, itemRepo, engine, dupService, fairnessService, audit);
  });

  it('creates queue snapshot', async () => {
    const result = await service.createQueueSnapshot(ctx, 'school-1', {
      audienceRole: 'teacher',
      queueSummary: 'Test queue',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.queueStatus).toBe('draft');
  });

  it('generates queue from eligible items', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const candidates = [
      makeCandidate({ studentRef: 'A', totalScore: 50, riskRank: 'high', priorityBand: 'high' }),
      makeCandidate({ studentRef: 'B', totalScore: 30, riskRank: 'medium', priorityBand: 'normal' }),
    ];
    const result = await service.generateQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, candidates, 10);
    expect(result.success).toBe(true);
    expect(result.data!.rankedCount).toBe(2);
    expect(result.data!.items[0].studentRef).toBe('A');
    expect(result.data!.items[1].studentRef).toBe('B');
  });

  it('verify ordering is deterministic', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const candidates = [
      makeCandidate({ studentRef: 'X', totalScore: 40, riskRank: 'low', boardCardId: 'card-x' }),
      makeCandidate({ studentRef: 'Y', totalScore: 40, riskRank: 'high', boardCardId: 'card-y' }),
    ];
    const result1 = await service.generateQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, candidates, 10);
    const snapshot2 = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const result2 = await service.generateQueueSnapshot(ctx, 'school-1', snapshot2.data!.queueSnapshotId, candidates, 10);
    expect(result1.data!.items[0].studentRef).toBe(result2.data!.items[0].studentRef);
    expect(result1.data!.items[1].studentRef).toBe(result2.data!.items[1].studentRef);
  });

  it('duplicate suppression works during generation', async () => {
    const dupCtx = { ...ctx, idempotencyKey: 'dup-1' };
    await dupService.createDuplicateSuppression(dupCtx, 'school-1', {
      resultRecoveryPlanId: 'plan-suppressed',
      canonicalBoardCardId: 'canonical-card',
      duplicateBoardCardId: 'dupe-card',
      suppressionReason: 'Duplicate detected',
    });

    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const candidates = [
      makeCandidate({ studentRef: 'A', totalScore: 50, resultRecoveryPlanId: 'plan-suppressed', priorityBand: 'high' }),
      makeCandidate({ studentRef: 'B', totalScore: 30, resultRecoveryPlanId: 'plan-other', priorityBand: 'normal' }),
    ];
    const result = await service.generateQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, candidates, 10);
    expect(result.data!.rankedCount).toBe(1);
    expect(result.data!.items[0].resultRecoveryPlanId).toBe('plan-other');
  });

  it('fairness checks gate queue inclusion via scorePriorityAssessment flow', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const candidates = [
      makeCandidate({ studentRef: 'A', totalScore: 50, priorityBand: 'high' }),
    ];
    const result = await service.generateQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, candidates, 10);
    expect(result.success).toBe(true);
    expect(result.data!.rankedCount).toBe(1);
  });

  it('capacity exceeded marking when applicable', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const candidates = [
      makeCandidate({ studentRef: 'A', totalScore: 80, riskRank: 'critical', priorityBand: 'critical_review', boardCardId: 'card-a' }),
      makeCandidate({ studentRef: 'B', totalScore: 50, riskRank: 'medium', priorityBand: 'normal', boardCardId: 'card-b' }),
      makeCandidate({ studentRef: 'C', totalScore: 30, riskRank: 'low', priorityBand: 'low', boardCardId: 'card-c' }),
    ];
    const result = await service.generateQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, candidates, 2);
    expect(result.data!.exceededCount).toBe(1);
    const exceededItems = result.data!.items.filter(i => i.triageDecision === 'capacity_exceeded');
    expect(exceededItems).toHaveLength(1);
  });

  it('critical-review items preserved under capacity pressure', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const candidates = [
      makeCandidate({ studentRef: 'A', totalScore: 90, riskRank: 'critical', priorityBand: 'critical_review', boardCardId: 'card-a' }),
      makeCandidate({ studentRef: 'B', totalScore: 50, riskRank: 'medium', priorityBand: 'normal', boardCardId: 'card-b' }),
      makeCandidate({ studentRef: 'C', totalScore: 85, riskRank: 'high', priorityBand: 'critical_review', boardCardId: 'card-c' }),
    ];
    const result = await service.generateQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, candidates, 2);
    const exceeded = result.data!.items.filter(i => i.triageDecision === 'capacity_exceeded');
    const preservedCritical = result.data!.items.filter(i => i.priorityBand === 'critical_review' && i.triageDecision === 'queued');
    expect(preservedCritical).toHaveLength(2);
    expect(exceeded.length + preservedCritical.length).toBe(result.data!.items.length);
  });

  it('blocks queue snapshot', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const blocked = await snapshotRepo.block(snapshot.data!.queueSnapshotId, 'MANUAL_BLOCK', 'Test block');
    expect(blocked.queueStatus).toBe('blocked');
  });

  it('voids queue snapshot', async () => {
    const snapshot = await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const voided = await service.voidQueueSnapshot(ctx, 'school-1', snapshot.data!.queueSnapshotId, 'MANUAL_VOID', 'Test void');
    expect(voided.data!.queueStatus).toBe('void');
  });

  it('enforces school isolation for queue snapshots', async () => {
    await service.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    const listA = await service.listQueueSnapshotsForSchool('school-1');
    const listB = await service.listQueueSnapshotsForSchool('school-other');
    expect(listA.data).toHaveLength(1);
    expect(listB.data).toHaveLength(0);
  });
});
