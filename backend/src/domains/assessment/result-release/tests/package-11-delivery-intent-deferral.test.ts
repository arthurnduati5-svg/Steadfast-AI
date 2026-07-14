import { describe, it, expect } from 'vitest';
import type { ResultReleaseCommandContext } from '../contracts/resultReleaseContracts';
import {
  InMemoryResultReleaseDeliveryIntentRepository,
  InMemoryResultReleasePacketRepository,
  InMemoryResultReleaseApprovalRepository,
  InMemoryResultReleaseAuditRepository,
  InMemoryResultReleaseIdempotencyRepository,
} from '../repositories/inMemoryResultReleaseRepositories';
import { ResultReleaseAuditBridge } from '../services/resultReleaseAuditBridge';
import { ResultReleaseIdempotencyService } from '../services/resultReleaseIdempotencyService';
import { ResultReleaseDeliveryIntentService } from '../services/resultReleaseDeliveryIntentService';

function makeCtx(overrides?: Partial<ResultReleaseCommandContext>): ResultReleaseCommandContext {
  return {
    schoolId: 'test-school',
    actorId: 'test-actor',
    actorRole: 'admin',
    correlationId: 'test-correlation',
    idempotencyKey: `ik-${Date.now()}-${Math.random()}`,
    ...overrides,
  };
}

describe('Package 11 - Delivery Intent Deferral', () => {
  const intentRepo = new InMemoryResultReleaseDeliveryIntentRepository();
  const packetRepo = new InMemoryResultReleasePacketRepository();
  const approvalRepo = new InMemoryResultReleaseApprovalRepository();
  const auditRepo = new InMemoryResultReleaseAuditRepository();
  const idempotencyRepo = new InMemoryResultReleaseIdempotencyRepository();
  const auditBridge = new ResultReleaseAuditBridge(auditRepo);
  const idempotencyService = new ResultReleaseIdempotencyService(idempotencyRepo);
  const deliveryIntentService = new ResultReleaseDeliveryIntentService(intentRepo, auditBridge, idempotencyService);

  it('should create delivery intent', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-1',
      resultReleaseApprovalId: 'approval-1',
      studentRef: 'student-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_future',
      safeIntentSummary: 'Deliver to student portal',
    });
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('draft');
  });

  it('should create delivery intent with parent portal future channel', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-parent-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-2',
      resultReleaseApprovalId: 'approval-2',
      studentRef: 'student-2',
      audienceType: 'parent',
      deliveryChannel: 'parent_portal_future',
      safeIntentSummary: 'Parent portal future',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
  });

  it('should create delivery intent with teacher dashboard future channel', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-teacher-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-3',
      resultReleaseApprovalId: 'approval-3',
      studentRef: 'student-3',
      audienceType: 'teacher',
      deliveryChannel: 'teacher_dashboard_future',
      safeIntentSummary: 'Teacher dashboard future',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
  });

  it('should create delivery intent with email future channel', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-email-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-4',
      resultReleaseApprovalId: 'approval-4',
      studentRef: 'student-4',
      audienceType: 'student',
      deliveryChannel: 'email_future',
      safeIntentSummary: 'Email future',
    });
    expect(result.ok).toBe(true);
  });

  it('should create delivery intent with sms future channel', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-sms-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-5',
      resultReleaseApprovalId: 'approval-5',
      studentRef: 'student-5',
      audienceType: 'student',
      deliveryChannel: 'sms_future',
      safeIntentSummary: 'SMS future',
    });
    expect(result.ok).toBe(true);
  });

  it('should create delivery intent with pdf export future channel', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-pdf-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-6',
      resultReleaseApprovalId: 'approval-6',
      studentRef: 'student-6',
      audienceType: 'student',
      deliveryChannel: 'pdf_export_future',
      safeIntentSummary: 'PDF export future',
    });
    expect(result.ok).toBe(true);
  });

  it('should create delivery intent with external school system future channel', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-di-ext-${Date.now()}` });
    const result = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-7',
      resultReleaseApprovalId: 'approval-7',
      studentRef: 'student-7',
      audienceType: 'admin',
      deliveryChannel: 'external_school_system_future',
      safeIntentSummary: 'External system future',
    });
    expect(result.ok).toBe(true);
  });

  it('should mark delivery intent eligible', async () => {
    const ctx = makeCtx({ idempotencyKey: `mark-eligible-${Date.now()}` });
    const created = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-8',
      resultReleaseApprovalId: 'approval-8',
      studentRef: 'student-8',
      audienceType: 'student',
      deliveryChannel: 'student_portal_future',
      safeIntentSummary: 'Eligible test',
    });
    const intentId = created.resourceId!;
    const result = await deliveryIntentService.markDeliveryIntentEligible(ctx, intentId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('eligible_for_future_delivery');
  });

  it('should block delivery intent', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-di-${Date.now()}` });
    const created = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-9',
      resultReleaseApprovalId: 'approval-9',
      studentRef: 'student-9',
      audienceType: 'student',
      deliveryChannel: 'student_portal_future',
      safeIntentSummary: 'Block test',
    });
    const intentId = created.resourceId!;
    const result = await deliveryIntentService.blockDeliveryIntent(ctx, intentId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should void delivery intent', async () => {
    const ctx = makeCtx({ idempotencyKey: `void-di-${Date.now()}` });
    const created = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-10',
      resultReleaseApprovalId: 'approval-10',
      studentRef: 'student-10',
      audienceType: 'student',
      deliveryChannel: 'student_portal_future',
      safeIntentSummary: 'Void test',
    });
    const intentId = created.resourceId!;
    const result = await deliveryIntentService.voidDeliveryIntent(ctx, intentId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should reject marking eligible for already-eligible intent', async () => {
    const ctx = makeCtx({ idempotencyKey: `double-elig-${Date.now()}` });
    const created = await deliveryIntentService.createDeliveryIntent(ctx, {
      resultReleasePacketId: 'packet-11',
      resultReleaseApprovalId: 'approval-11',
      studentRef: 'student-11',
      audienceType: 'student',
      deliveryChannel: 'student_portal_future',
      safeIntentSummary: 'Double eligible',
    });
    const intentId = created.resourceId!;
    await deliveryIntentService.markDeliveryIntentEligible(ctx, intentId);
    const result = await deliveryIntentService.markDeliveryIntentEligible(ctx, intentId);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('should not import executable delivery adapter in delivery intent service', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/domains/assessment/result-release/services/resultReleaseDeliveryIntentService.ts', 'utf-8');
    expect(content).not.toContain('notify');
    expect(content).not.toContain('publish');
    expect(content).not.toContain('email');
    expect(content).not.toContain('sms');
    expect(content).not.toContain('push');
    expect(content).not.toContain('whatsapp');
    expect(content).not.toContain('portal');
    expect(content).not.toContain('pdf');
    expect(content).not.toContain('adapter');
  });

  it('should not import notification client in route file', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/routes/resultRelease.ts', 'utf-8');
    expect(content).not.toContain('notify');
    expect(content).not.toContain('publish');
    expect(content).not.toContain('email');
    expect(content).not.toContain('sms');
    expect(content).not.toContain('push');
    expect(content).not.toContain('whatsapp');
    expect(content).not.toContain('portal');
    expect(content).not.toContain('pdf');
  });

  it('should not import PDF library in route file', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/routes/resultRelease.ts', 'utf-8');
    expect(content).not.toContain('pdfkit');
    expect(content).not.toContain('pdfmake');
    expect(content).not.toContain('pdf-lib');
    expect(content).not.toContain('jspdf');
  });

  it('delivery channels are all future-intent only', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/domains/assessment/result-release/contracts/resultReleaseContracts.ts', 'utf-8');
    expect(content).toContain('student_portal_future');
    expect(content).toContain('parent_portal_future');
    expect(content).toContain('teacher_dashboard_future');
    expect(content).toContain('email_future');
    expect(content).toContain('sms_future');
    expect(content).toContain('pdf_export_future');
    expect(content).toContain('external_school_system_future');
  });
});
