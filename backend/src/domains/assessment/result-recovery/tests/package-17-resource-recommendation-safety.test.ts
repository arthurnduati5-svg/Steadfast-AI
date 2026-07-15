import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryResourceRecommendationRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryResourceRecommendationService } from '../services/resultRecoveryResourceRecommendationService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-res',
    ...overrides,
  } as any;
}

describe('Package 17 — Resource Recommendation Safety', () => {
  it('Resource recommendation can be created', async () => {
    const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safety, auditBridge, idempotency);

    const result = await service.createResourceRecommendation(makeCtx(), {
      resultRecoveryPlanId: 'plan-001',
      studentRef: 's1',
      resourceType: 'video',
      resourceRef: 'vid-001',
      safeResourceSummary: 'Khan Academy algebra video',
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect((result.data as any).recommendationStatus).toBe('draft');
    expect(result.reasonCode).toBe('RESOURCE_CREATED');
  });

  it('Resource recommendation uses metadata refs only', async () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertPracticeDraftUsesReferencesOnly({ resourceRefsJson: { ref: 'vid-001' } });
    expect(check.allowed).toBe(true);
  });

  it('Resource recommendation can be marked review_ready', async () => {
    const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safety, auditBridge, idempotency);

    const created = await service.createResourceRecommendation(makeCtx(), {
      resultRecoveryPlanId: 'plan-rr', studentRef: 's1', resourceType: 'article', resourceRef: 'art-001', safeResourceSummary: 'Review',
    });
    const resId = created.resourceId!;

    const rr = await service.markResourceRecommendationReviewReady(makeCtx({ idempotencyKey: 'ik-rrr' }), resId, 'READY', 'Ready');
    expect(rr.ok).toBe(true);
    expect(rr.status).toBe('review_ready');
  });

  it('Resource recommendation can be approved_for_future_use', async () => {
    const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safety, auditBridge, idempotency);

    const created = await service.createResourceRecommendation(makeCtx(), {
      resultRecoveryPlanId: 'plan-app', studentRef: 's1', resourceType: 'practice', resourceRef: 'pr-001', safeResourceSummary: 'Approve',
    });
    const resId = created.resourceId!;

    const app = await service.approveResourceRecommendationForFutureUse(makeCtx({ idempotencyKey: 'ik-ra' }), resId, 'APPROVED', 'Approved');
    expect(app.ok).toBe(true);
    expect(app.status).toBe('approved_for_future_use');
  });

  it('Resource recommendation can be suppressed', async () => {
    const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safety, auditBridge, idempotency);

    const created = await service.createResourceRecommendation(makeCtx(), {
      resultRecoveryPlanId: 'plan-sup', studentRef: 's1', resourceType: 'video', resourceRef: 'v-sup', safeResourceSummary: 'Suppress',
    });
    const resId = created.resourceId!;

    const sup = await service.suppressResourceRecommendation(makeCtx(), resId, 'SUPPRESSED', 'Not needed');
    expect(sup.ok).toBe(true);
    expect(sup.status).toBe('suppressed');
  });

  it('Resource recommendation can be blocked', async () => {
    const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safety, auditBridge, idempotency);

    const created = await service.createResourceRecommendation(makeCtx(), {
      resultRecoveryPlanId: 'plan-blk', studentRef: 's1', resourceType: 'link', resourceRef: 'l-blk', safeResourceSummary: 'Block',
    });
    const resId = created.resourceId!;

    const blk = await service.blockResourceRecommendation(makeCtx(), resId, 'BLOCKED', 'Not suitable');
    expect(blk.ok).toBe(true);
    expect(blk.status).toBe('blocked');
  });

  it('Resource recommendation can be voided', async () => {
    const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safety, auditBridge, idempotency);

    const created = await service.createResourceRecommendation(makeCtx(), {
      resultRecoveryPlanId: 'plan-vd', studentRef: 's1', resourceType: 'doc', resourceRef: 'd-vd', safeResourceSummary: 'Void',
    });
    const resId = created.resourceId!;

    const vd = await service.voidResourceRecommendation(makeCtx(), resId, 'VOIDED', 'Mistake');
    expect(vd.ok).toBe(true);
    expect(vd.status).toBe('void');
  });

  it('Resource recommendation does not fetch external resources', async () => {
    const safety = new ResultRecoverySafetyService();
    const liveCheck = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: 'fetch external' });
    expect(liveCheck.allowed).toBe(false);
    const extCheck = safety.assertNoExternalSyncPayload({ externalSyncPayload: 'sync data' });
    expect(extCheck.allowed).toBe(false);
  });

  it('Resource recommendation does not upload files', async () => {
    const safety = new ResultRecoverySafetyService();
    const pdfCheck = safety.assertNoPdfBinary({ pdfBinary: Buffer.from('test') });
    expect(pdfCheck.allowed).toBe(false);
    expect(pdfCheck.reasonCode).toBe('PDF_BINARY');
  });

  it('Resource recommendation does not publish resources', async () => {
    const safety = new ResultRecoverySafetyService();
    const liveCheck = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: 'publish' });
    expect(liveCheck.allowed).toBe(false);
    const notifCheck = safety.assertNoNotificationPayload({ emailPayload: 'publish notification' });
    expect(notifCheck.allowed).toBe(false);
  });
});
