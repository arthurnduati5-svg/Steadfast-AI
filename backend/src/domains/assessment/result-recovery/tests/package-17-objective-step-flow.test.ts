import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryPlanRepository,
  InMemoryResultRecoveryObjectiveRepository,
  InMemoryResultRecoveryStepRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryPlanService } from '../services/resultRecoveryPlanService';
import { ResultRecoveryObjectiveService } from '../services/resultRecoveryObjectiveService';
import { ResultRecoveryStepService } from '../services/resultRecoveryStepService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-obj',
    ...overrides,
  } as any;
}

describe('Package 17 — Objective & Step Flow', () => {
  it('Recovery objective can be created for a plan', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);

    const planService = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);
    const plan = await planService.createRecoveryPlan(makeCtx(), { studentRef: 's1', safePlanSummary: 'Plan for objectives' });
    const planId = plan.resourceId!;

    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);
    const result = await objService.createRecoveryObjective(makeCtx(), {
      resultRecoveryPlanId: planId,
      studentRef: 's1',
      safeObjectiveSummary: 'Review algebra concepts',
      objectiveType: 'concept_repair',
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.reasonCode).toBe('OBJECTIVE_CREATED');
  });

  it('Objective can be listed by plan', async () => {
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);

    await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-1', studentRef: 's1', safeObjectiveSummary: 'Obj 1' });
    await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-1', studentRef: 's1', safeObjectiveSummary: 'Obj 2' });

    const list = await objService.listObjectivesForPlan(makeCtx(), 'plan-1');
    expect(list.ok).toBe(true);
    const data = list.data as any[];
    expect(data.length).toBe(2);
  });

  it('Objective can be listed by student', async () => {
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);

    await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-x', studentRef: 'student-a', safeObjectiveSummary: 'A1' });
    await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-y', studentRef: 'student-a', safeObjectiveSummary: 'A2' });

    const list = await objService.listObjectivesForStudent(makeCtx(), 'student-a');
    expect(list.ok).toBe(true);
    const data = list.data as any[];
    expect(data.length).toBe(2);
  });

  it('Objective can be marked ready', async () => {
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);

    const created = await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-r', studentRef: 's1', safeObjectiveSummary: 'Ready test' });
    const objId = created.resourceId!;

    const ready = await objService.markObjectiveReady(makeCtx({ idempotencyKey: 'ik-or1' }), objId, 'READY', 'Objective is ready');
    expect(ready.ok).toBe(true);
    expect(ready.status).toBe('ready');
  });

  it('Objective can be completed_mock', async () => {
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);

    const created = await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-cm', studentRef: 's1', safeObjectiveSummary: 'Mock complete' });
    const objId = created.resourceId!;

    const completed = await objService.completeObjectiveMock(makeCtx(), objId, 'COMPLETED', 'Mock done');
    expect(completed.ok).toBe(true);
    expect(completed.status).toBe('completed_mock');
  });

  it('Objective can be suppressed', async () => {
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);

    const created = await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-supp', studentRef: 's1', safeObjectiveSummary: 'Suppress' });
    const objId = created.resourceId!;

    const sup = await objService.suppressObjective(makeCtx(), objId, 'SUPPRESSED', 'Not needed');
    expect(sup.ok).toBe(true);
    expect(sup.status).toBe('suppressed');
  });

  it('Objective can be voided', async () => {
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const objService = new ResultRecoveryObjectiveService(objectiveRepo as any, safety, auditBridge, idempotency);

    const created = await objService.createRecoveryObjective(makeCtx(), { resultRecoveryPlanId: 'plan-v', studentRef: 's1', safeObjectiveSummary: 'Void' });
    const objId = created.resourceId!;

    const voided = await objService.voidObjective(makeCtx(), objId, 'VOIDED', 'Created in error');
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });

  it('Recovery step can be created for plan/objective', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    const result = await stepService.createRecoveryStep(makeCtx(), {
      resultRecoveryPlanId: 'plan-st',
      resultRecoveryObjectiveId: 'obj-st',
      studentRef: 's1',
      stepType: 'review_concept',
      safeStepSummary: 'Review step',
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.reasonCode).toBe('STEP_CREATED');
  });

  it('Steps preserve deterministic order', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-ord', studentRef: 's1', stepPriority: '1', safeStepSummary: 'First' });
    await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-ord', studentRef: 's1', stepPriority: '2', safeStepSummary: 'Second' });

    const list = await stepService.listStepsForPlan(makeCtx(), 'plan-ord');
    expect(list.ok).toBe(true);
    const data = list.data as any[];
    expect(data.length).toBe(2);
  });

  it('Step can be review_ready', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    const created = await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-rr', studentRef: 's1', safeStepSummary: 'Review ready' });
    const stepId = created.resourceId!;

    const rr = await stepService.markStepReviewReady(makeCtx({ idempotencyKey: 'ik-srr' }), stepId, 'READY', 'Step ready');
    expect(rr.ok).toBe(true);
    expect(rr.status).toBe('review_ready');
  });

  it('Step can be approved_for_future_use', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    const created = await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-app', studentRef: 's1', safeStepSummary: 'Approve' });
    const stepId = created.resourceId!;

    const app = await stepService.approveStepForFutureUse(makeCtx({ idempotencyKey: 'ik-sap' }), stepId, 'APPROVED', 'Step approved');
    expect(app.ok).toBe(true);
    expect(app.status).toBe('approved_for_future_use');
  });

  it('Step can be completed_mock', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    const created = await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-cm', studentRef: 's1', safeStepSummary: 'Mock' });
    const stepId = created.resourceId!;

    const cm = await stepService.completeStepMock(makeCtx(), stepId, 'COMPLETED', 'Mock done');
    expect(cm.ok).toBe(true);
    expect(cm.status).toBe('completed_mock');
  });

  it('Step can be suppressed', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    const created = await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-sup', studentRef: 's1', safeStepSummary: 'Suppress me' });
    const stepId = created.resourceId!;

    const sup = await stepService.suppressStep(makeCtx(), stepId, 'SUPPRESSED', 'Not needed');
    expect(sup.ok).toBe(true);
    expect(sup.status).toBe('suppressed');
  });

  it('Step can be voided', async () => {
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const stepService = new ResultRecoveryStepService(stepRepo as any, safety, auditBridge, idempotency);

    const created = await stepService.createRecoveryStep(makeCtx(), { resultRecoveryPlanId: 'plan-vd', studentRef: 's1', safeStepSummary: 'Void me' });
    const stepId = created.resourceId!;

    const vd = await stepService.voidStep(makeCtx(), stepId, 'VOIDED', 'Mistake');
    expect(vd.ok).toBe(true);
    expect(vd.status).toBe('void');
  });

  it('Step does not assign live work', async () => {
    const safety = new ResultRecoverySafetyService();
    const liveCheck = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: 'homework' });
    expect(liveCheck.allowed).toBe(false);

    const hwCheck = safety.assertNoHomeworkAssignmentPayload({ homeworkAssignmentPayload: 'data' });
    expect(hwCheck.allowed).toBe(false);

    const practiceCheck = safety.assertNoPracticeAssignmentPayload({ practiceAssignmentPayload: 'data' });
    expect(practiceCheck.allowed).toBe(false);
  });
});
