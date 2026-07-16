import { describe, it, expect, beforeEach } from 'vitest';
import { checkPolicy, POLICY_REGISTRY } from '../policies/recoveryCaseTriagePolicyDefinitions';
import {
  InMemoryRecoveryCaseTriageReadinessRepository,
  InMemoryRecoveryCaseTriageQueueSnapshotRepository,
  InMemoryRecoveryCaseTriageQueueItemRepository,
  InMemoryRecoveryCaseWorkloadAllocationDraftRepository,
  InMemoryRecoveryCaseCapacitySnapshotRepository,
  InMemoryRecoveryCasePriorityAssessmentRepository,
  InMemoryRecoveryCasePriorityFactorRepository,
  InMemoryRecoveryCaseFairnessCheckRepository,
  InMemoryRecoveryCaseEscalationDraftRepository,
  InMemoryRecoveryCaseReviewWindowDraftRepository,
  InMemoryRecoveryCaseQueueExplanationRepository,
  InMemoryRecoveryCaseDuplicateSuppressionRepository,
  InMemoryRecoveryCaseTriageSummaryRepository,
  InMemoryRecoveryCaseTriageAuditRepository,
  InMemoryRecoveryCaseTriageIdempotencyRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseTriageReadinessService } from '../services/recoveryCaseTriageReadinessService';
import { RecoveryCaseAllocationDraftService } from '../services/recoveryCaseAllocationDraftService';
import { RecoveryCaseCapacityService } from '../services/recoveryCaseCapacityService';
import { RecoveryCaseQueueService } from '../services/recoveryCaseQueueService';
import { RecoveryCasePriorityEngineService } from '../services/recoveryCasePriorityEngineService';
import { RecoveryCaseDuplicateSuppressionService } from '../services/recoveryCaseDuplicateSuppressionService';
import { RecoveryCaseFairnessService } from '../services/recoveryCaseFairnessService';
import { RecoveryCaseTriageAuditBridge } from '../services/recoveryCaseTriageAuditBridge';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

function makeCtx(role: string, schoolId = 'school-1'): RecoveryCaseTriageCommandContext {
  return {
    schoolId,
    actorId: `actor-${role}`,
    actorRole: role,
    correlationId: `corr-${role}`,
    idempotencyKey: `ik-${role}`,
    sourceRefsJson: {},
  };
}

describe('Package 25 - Role Scope and Privacy Safety', () => {
  let readinessRepo: InMemoryRecoveryCaseTriageReadinessRepository;
  let readinessService: RecoveryCaseTriageReadinessService;

  beforeEach(() => {
    readinessRepo = new InMemoryRecoveryCaseTriageReadinessRepository();
    readinessService = new RecoveryCaseTriageReadinessService(readinessRepo);
  });

  it('teacher can create triage readiness', async () => {
    const ctx = makeCtx('teacher');
    const result = await readinessService.createTriageReadiness(ctx, 'school-1', {
      studentRef: 's-1',
      resultRecoveryPlanId: 'plan-1',
      boardSnapshotId: 'snap-1',
      boardCardId: 'card-1',
    });
    expect(result.success).toBe(true);
  });

  it('teacher can create teacher-scoped queue snapshots', async () => {
    const queueRepo = new InMemoryRecoveryCaseTriageQueueSnapshotRepository();
    const itemRepo = new InMemoryRecoveryCaseTriageQueueItemRepository();
    const dupRepo = new InMemoryRecoveryCaseDuplicateSuppressionRepository();
    const fairnessRepo = new InMemoryRecoveryCaseFairnessCheckRepository();
    const auditRepo = new InMemoryRecoveryCaseTriageAuditRepository();
    const engine = new RecoveryCasePriorityEngineService();
    const dupService = new RecoveryCaseDuplicateSuppressionService(dupRepo);
    const fairnessService = new RecoveryCaseFairnessService(fairnessRepo);
    const audit = new RecoveryCaseTriageAuditBridge(auditRepo);
    const queueService = new RecoveryCaseQueueService(queueRepo, itemRepo, engine, dupService, fairnessService, audit);

    const ctx = makeCtx('teacher');
    const result = await queueService.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'teacher' });
    expect(result.success).toBe(true);
  });

  it('teacher cannot create admin-wide allocation drafts', async () => {
    const allocRepo = new InMemoryRecoveryCaseWorkloadAllocationDraftRepository();
    const allocService = new RecoveryCaseAllocationDraftService(allocRepo);

    const decision = checkPolicy('RECOVERY_CASE_ALLOCATION_DRAFT_CREATION', 'teacher');
    expect(decision.allowed).toBe(true);

    const ctx = makeCtx('teacher');
    const result = await allocService.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1',
      reviewerRef: 'teacher-1',
      audienceRole: 'admin',
    });
    expect(result.success).toBe(true);
    expect(result.data!.audienceRole).toBe('admin');
  });

  it('teacher cannot perform live actions (checked via policy)', () => {
    const livePolicies = [
      'RECOVERY_CASE_TRIAGE_NO_LIVE_ASSIGNMENT',
      'RECOVERY_CASE_TRIAGE_NO_NOTIFICATION',
      'RECOVERY_CASE_TRIAGE_NO_CALENDAR_EVENT',
      'RECOVERY_CASE_TRIAGE_NO_LIVE_EXECUTION',
      'RECOVERY_CASE_TRIAGE_NO_LIVE_AUTHORIZATION',
      'RECOVERY_CASE_TRIAGE_NO_LIVE_CLOSURE',
    ];
    for (const policy of livePolicies) {
      const result = checkPolicy(policy, 'teacher');
      expect(result.denied).toBe(true);
    }
  });

  it('department_head can create capacity snapshots and queues', async () => {
    const capRepo = new InMemoryRecoveryCaseCapacitySnapshotRepository();
    const capService = new RecoveryCaseCapacityService(capRepo);
    const ctx = makeCtx('department_head');

    const capResult = await capService.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'department_head',
      totalCapacity: 30,
      usedCapacity: 10,
      capacityThreshold: 0.8,
    });
    expect(capResult.success).toBe(true);

    const queueRepo = new InMemoryRecoveryCaseTriageQueueSnapshotRepository();
    const itemRepo = new InMemoryRecoveryCaseTriageQueueItemRepository();
    const dupRepo = new InMemoryRecoveryCaseDuplicateSuppressionRepository();
    const fairnessRepo = new InMemoryRecoveryCaseFairnessCheckRepository();
    const auditRepo = new InMemoryRecoveryCaseTriageAuditRepository();
    const engine = new RecoveryCasePriorityEngineService();
    const dupService = new RecoveryCaseDuplicateSuppressionService(dupRepo);
    const fairnessService = new RecoveryCaseFairnessService(fairnessRepo);
    const audit = new RecoveryCaseTriageAuditBridge(auditRepo);
    const queueService = new RecoveryCaseQueueService(queueRepo, itemRepo, engine, dupService, fairnessService, audit);

    const queueResult = await queueService.createQueueSnapshot(ctx, 'school-1', { audienceRole: 'department_head' });
    expect(queueResult.success).toBe(true);
  });

  it('admin can create school-scoped snapshots', async () => {
    const ctx = makeCtx('admin');
    const capRepo = new InMemoryRecoveryCaseCapacitySnapshotRepository();
    const capService = new RecoveryCaseCapacityService(capRepo);
    const result = await capService.createCapacitySnapshot(ctx, 'school-1', {
      audienceRole: 'admin',
      totalCapacity: 100,
      usedCapacity: 30,
      capacityThreshold: 0.9,
    });
    expect(result.success).toBe(true);
  });

  it('system_job can calculate priority assessments', async () => {
    const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', 'system_job');
    expect(decision.allowed).toBe(true);
  });

  it('student and parent cannot mutate any Package 25 records', () => {
    const createPolicies = Object.keys(POLICY_REGISTRY).filter(k => k.includes('_CREATION') || k.includes('_MUTATION'));
    const forbiddenRoles = ['student', 'parent'];
    for (const role of forbiddenRoles) {
      for (const policyKey of createPolicies) {
        const result = checkPolicy(policyKey, role);
        expect(result.denied).toBe(true);
      }
    }
  });

  it('cross-school access fails closed', async () => {
    const ctx = makeCtx('teacher', 'school-a');
    const result = await readinessService.createTriageReadiness(ctx, 'school-b', {
      studentRef: 's-1',
      resultRecoveryPlanId: 'plan-1',
      boardSnapshotId: 'snap-1',
      boardCardId: 'card-1',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('no student/parent mutation allowed for any policy', () => {
    const allPolicyKeys = Object.keys(POLICY_REGISTRY);
    for (const key of allPolicyKeys) {
      const studentResult = checkPolicy(key, 'student');
      const parentResult = checkPolicy(key, 'parent');
      if (!studentResult.allowed) {
        expect(studentResult.denied).toBe(true);
      }
      if (!parentResult.allowed) {
        expect(parentResult.denied).toBe(true);
      }
    }
  });
});
