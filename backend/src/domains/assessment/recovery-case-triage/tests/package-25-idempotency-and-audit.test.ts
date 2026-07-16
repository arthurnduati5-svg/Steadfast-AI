import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseTriageIdempotencyRepository,
  InMemoryRecoveryCaseTriageAuditRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseTriageIdempotencyService } from '../services/recoveryCaseTriageIdempotencyService';
import { RecoveryCaseTriageAuditBridge } from '../services/recoveryCaseTriageAuditBridge';
import { RecoveryCasePriorityEngineService } from '../services/recoveryCasePriorityEngineService';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Idempotency and Audit', () => {
  let idempotencyRepo: InMemoryRecoveryCaseTriageIdempotencyRepository;
  let auditRepo: InMemoryRecoveryCaseTriageAuditRepository;
  let engine: RecoveryCasePriorityEngineService;
  let idempotencyService: RecoveryCaseTriageIdempotencyService;
  let auditBridge: RecoveryCaseTriageAuditBridge;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-ia-1',
    idempotencyKey: 'ik-test-1',
    sourceRefsJson: { source: 'test' },
  };

  beforeEach(() => {
    idempotencyRepo = new InMemoryRecoveryCaseTriageIdempotencyRepository();
    auditRepo = new InMemoryRecoveryCaseTriageAuditRepository();
    engine = new RecoveryCasePriorityEngineService();
    idempotencyService = new RecoveryCaseTriageIdempotencyService(idempotencyRepo, engine);
    auditBridge = new RecoveryCaseTriageAuditBridge(auditRepo);
  });

  it('creates idempotency entry', async () => {
    const result = await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'scorePriorityAssessment');
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.idempotencyKey).toBe('ik-test-1');
    expect(result.data!.operation).toBe('scorePriorityAssessment');
  });

  it('detects duplicate request by idempotency key', async () => {
    await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'scorePriorityAssessment');
    const duplicate = await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'scorePriorityAssessment');
    expect(duplicate.success).toBe(true);
    expect(duplicate.status).toBe('duplicate');
  });

  it('completes idempotency entry', async () => {
    const created = await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'scorePriorityAssessment');
    const completed = await idempotencyService.completeIdempotencyEntry('school-1', 'scorePriorityAssessment', 'ik-test-1', 'Assessment scored 85 (high)');
    expect(completed.success).toBe(true);
    expect(completed.status).toBe('completed');
    expect(completed.data!.status).toBe('completed');
  });

  it('creates audit event for school', async () => {
    const result = await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'priority_assessment',
      entityId: 'pa-1',
      action: 'scored',
      actorId: 'actor-1',
      actorRole: 'teacher',
      safeSummary: 'Priority assessment scored 85 (critical_review)',
      reasonCodesJson: null,
      metadataJson: { totalScore: 85, band: 'critical_review' },
      correlationId: 'corr-audit-1',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.entityType).toBe('priority_assessment');
    expect(result.data!.action).toBe('scored');
  });

  it('lists audit events by school', async () => {
    await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'triage_readiness', entityId: 'tr-1', action: 'created',
      actorId: 'actor-1', actorRole: 'teacher', safeSummary: 'Created',
      reasonCodesJson: null, metadataJson: null, correlationId: 'c1',
    });
    await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'priority_assessment', entityId: 'pa-1', action: 'scored',
      actorId: 'actor-1', actorRole: 'teacher', safeSummary: 'Scored 75',
      reasonCodesJson: null, metadataJson: null, correlationId: 'c2',
    });
    const events = await auditBridge.listAuditEventsForSchool('school-1');
    expect(events.data).toHaveLength(2);
  });

  it('lists audit events by entity', async () => {
    await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'priority_assessment', entityId: 'pa-1', action: 'scored',
      actorId: 'actor-1', actorRole: 'teacher', safeSummary: 'Scored',
      reasonCodesJson: null, metadataJson: null, correlationId: 'c1',
    });
    const events = await auditBridge.listAuditEventsForEntity('school-1', 'priority_assessment', 'pa-1');
    expect(events.data).toHaveLength(1);
  });

  it('lists audit events by action', async () => {
    await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'triage_readiness', entityId: 'tr-1', action: 'created',
      actorId: 'actor-1', actorRole: 'teacher', safeSummary: 'Created',
      reasonCodesJson: null, metadataJson: null, correlationId: 'c1',
    });
    await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'queue_snapshot', entityId: 'qs-1', action: 'generated',
      actorId: 'actor-1', actorRole: 'teacher', safeSummary: 'Generated',
      reasonCodesJson: null, metadataJson: null, correlationId: 'c2',
    });
    const createdEvents = await auditBridge.listAuditEventsByAction('school-1', 'created');
    expect(createdEvents.data).toHaveLength(1);
  });

  it('lists audit events by actor', async () => {
    await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'triage_readiness', entityId: 'tr-1', action: 'created',
      actorId: 'actor-1', actorRole: 'teacher', safeSummary: 'Created',
      reasonCodesJson: null, metadataJson: null, correlationId: 'c1',
    });
    const events = await auditBridge.listAuditEventsByActor('school-1', 'actor-1');
    expect(events.data).toHaveLength(1);
  });

  it('audit event has safe metadata (no raw data)', async () => {
    const result = await auditBridge.createAuditEvent(ctx, 'school-1', {
      entityType: 'priority_assessment',
      entityId: 'pa-1',
      action: 'scored',
      actorId: 'actor-1',
      actorRole: 'teacher',
      safeSummary: 'Assessment scored 50',
      reasonCodesJson: null,
      metadataJson: { totalScore: 50, band: 'normal', factorCount: 3 },
      correlationId: 'corr-1',
    });
    expect(result.data!.safeSummary).toBe('Assessment scored 50');
    expect(result.data!.metadataJson).toEqual({ totalScore: 50, band: 'normal', factorCount: 3 });
    expect(JSON.stringify(result.data!.metadataJson)).not.toContain('rawStudentAnswer');
    expect(JSON.stringify(result.data!.metadataJson)).not.toContain('answerKeyText');
    expect(JSON.stringify(result.data!.metadataJson)).not.toContain('internalReasoning');
  });

  it('isDuplicateRequest detects completed duplicate', async () => {
    const created = await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'scorePriorityAssessment');
    await idempotencyService.completeIdempotencyEntry('school-1', 'scorePriorityAssessment', 'ik-test-1', 'Done');
    const check = await idempotencyService.isDuplicateRequest(ctx, 'school-1', 'scorePriorityAssessment');
    expect(check.success).toBe(true);
    expect(check.data!.isDuplicate).toBe(true);
  });

  it('isDuplicateRequest returns false for new request', async () => {
    const check = await idempotencyService.isDuplicateRequest(ctx, 'school-1', 'newOperation');
    expect(check.data!.isDuplicate).toBe(false);
  });

  it('idempotency entry has expiration', async () => {
    const result = await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'testOp');
    expect(result.data!.expiresAt).toBeDefined();
    expect(new Date(result.data!.expiresAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it('lists idempotency entries by school', async () => {
    await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'op-1');
    await idempotencyService.createIdempotencyEntry({ ...ctx, idempotencyKey: 'ik-2' }, 'school-1', 'op-2');
    const entries = await idempotencyRepo.listBySchool('school-1');
    expect(entries).toHaveLength(2);
  });

  it('lists idempotency entries by operation', async () => {
    await idempotencyService.createIdempotencyEntry(ctx, 'school-1', 'scorePriorityAssessment');
    await idempotencyService.createIdempotencyEntry({ ...ctx, idempotencyKey: 'ik-3' }, 'school-1', 'createTriageReadiness');
    const byOp = await idempotencyRepo.listByOperation('school-1', 'scorePriorityAssessment');
    expect(byOp).toHaveLength(1);
  });

  it('handles school mismatch in idempotency', async () => {
    const wrongCtx = { ...ctx, schoolId: 'school-other' };
    const result = await idempotencyService.createIdempotencyEntry(wrongCtx, ctx.schoolId, 'op');
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });
});
