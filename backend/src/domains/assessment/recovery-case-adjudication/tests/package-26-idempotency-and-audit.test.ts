import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAdjudicationIdempotencyRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseAdjudicationIdempotencyService } from '../services/recoveryCaseAdjudicationIdempotencyService';
import { RecoveryCaseAdjudicationAuditBridge } from '../services/recoveryCaseAdjudicationAuditBridge';

describe('Package 26 - Idempotency and Audit', () => {
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  describe('Idempotency', () => {
    let repo: InMemoryAdjudicationIdempotencyRepository;
    let service: RecoveryCaseAdjudicationIdempotencyService;

    beforeEach(() => {
      repo = new InMemoryAdjudicationIdempotencyRepository();
      service = new RecoveryCaseAdjudicationIdempotencyService(repo);
    });

    it('first request does not exist, second request detects duplicate', async () => {
      const first = await service.checkIdempotency(schoolA, 'key-1', 'createReadiness');
      expect(first.exists).toBe(false);

      await service.createIdempotencyEntry(schoolA, 'key-1', 'createReadiness', service.hashRequest('{"data":"test"}'));

      const second = await service.checkIdempotency(schoolA, 'key-1', 'createReadiness');
      expect(second.exists).toBe(true);
    });

    it('check by key returns correct status', async () => {
      await service.createIdempotencyEntry(schoolA, 'key-status', 'createDisposition', 'hash123');
      const result = await service.checkIdempotency(schoolA, 'key-status', 'createDisposition');
      expect(result.exists).toBe(true);
      expect(result.status).toBe('in_progress');
    });

    it('complete marks as completed', async () => {
      await service.createIdempotencyEntry(schoolA, 'key-complete', 'createConsensus', 'hash456');
      await service.completeIdempotencyEntry(schoolA, 'key-complete', 'createConsensus', 'ref-consensus-1');

      const result = await service.checkIdempotency(schoolA, 'key-complete', 'createConsensus');
      expect(result.exists).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.responseRef).toBe('ref-consensus-1');
    });

    it('same key does not share across schools', async () => {
      await service.createIdempotencyEntry(schoolA, 'shared-key', 'op', 'h1');
      const a = await service.checkIdempotency(schoolA, 'shared-key', 'op');
      const b = await service.checkIdempotency(schoolB, 'shared-key', 'op');
      expect(a.exists).toBe(true);
      expect(b.exists).toBe(false);
    });

    it('hashRequest produces consistent output', () => {
      const hash1 = service.hashRequest('{"hello":"world"}');
      const hash2 = service.hashRequest('{"hello":"world"}');
      const hash3 = service.hashRequest('{"hello":"different"}');
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('Audit', () => {
    let repo: InMemoryAdjudicationAuditRepository;
    let bridge: RecoveryCaseAdjudicationAuditBridge;

    beforeEach(() => {
      repo = new InMemoryAdjudicationAuditRepository();
      bridge = new RecoveryCaseAdjudicationAuditBridge(repo);
    });

    it('record audit event stores correctly', async () => {
      await bridge.recordAuditEvent({
        schoolId: schoolA,
        entityType: 'adjudication_readiness',
        entityId: 'ard-123',
        action: 'create',
        actorId: 'actor-1',
        actorRole: 'teacher',
        correlationId: 'corr-1',
        safeMetadata: { detail: 'test' },
      });
      const events = await bridge.listAuditEventsForSchool(schoolA);
      expect(events).toHaveLength(1);
    });

    it('list by school returns school-scoped events', async () => {
      await bridge.recordAuditEvent({ schoolId: schoolA, entityType: 'readiness', entityId: 'e1', action: 'create', actorId: 'a1', actorRole: 'teacher' });
      await bridge.recordAuditEvent({ schoolId: schoolB, entityType: 'readiness', entityId: 'e2', action: 'create', actorId: 'a2', actorRole: 'teacher' });
      const eventsA = await bridge.listAuditEventsForSchool(schoolA);
      const eventsB = await bridge.listAuditEventsForSchool(schoolB);
      expect(eventsA).toHaveLength(1);
      expect(eventsB).toHaveLength(1);
    });

    it('list by entity returns entity-scoped events', async () => {
      await bridge.recordAuditEvent({ schoolId: schoolA, entityType: 'readiness', entityId: 'entity-target', action: 'create', actorId: 'a1', actorRole: 'teacher' });
      await bridge.recordAuditEvent({ schoolId: schoolA, entityType: 'readiness', entityId: 'entity-other', action: 'create', actorId: 'a1', actorRole: 'teacher' });
      const events = await bridge.listAuditEventsForEntity(schoolA, 'entity-target');
      expect(events).toHaveLength(1);
    });

    it('audit event contains schoolId, entityType, entityId, action, actorId, actorRole', async () => {
      await bridge.recordAuditEvent({
        schoolId: schoolA,
        entityType: 'consensus',
        entityId: 'cs-42',
        action: 'create_consensus',
        actorId: 'actor-lead',
        actorRole: 'lead_teacher',
        correlationId: 'corr-42',
        safeMetadata: { band: 'high' },
      });
      const events = await bridge.listAuditEventsForSchool(schoolA);
      expect(events).toHaveLength(1);
      const event = events[0] as any;
      expect(event.schoolId).toBe(schoolA);
      expect(event.entityType).toBe('consensus');
      expect(event.entityId).toBe('cs-42');
      expect(event.action).toBe('create_consensus');
      expect(event.actorId).toBe('actor-lead');
      expect(event.actorRole).toBe('lead_teacher');
    });
  });
});
