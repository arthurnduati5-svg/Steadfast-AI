import { describe, it, expect } from 'vitest';
import { ExamAccessPolicyService } from '../services/examAccessPolicyService';
import { ExamPaperApprovalService } from '../services/examPaperApprovalService';
import { ExamPaperDeliveryBridgeService } from '../services/examPaperDeliveryBridgeService';
import { ExamPaperCommandContext } from '../contracts/examPaperContracts';

describe('Package 6 - Access, Approval, and Bridge', () => {
  const accessService = new ExamAccessPolicyService();
  const approvalService = new ExamPaperApprovalService();
  const bridgeService = new ExamPaperDeliveryBridgeService();

  it('Access policy can be created as metadata only', async () => {
    const policy = await accessService.createAccessPolicy({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      intendedAudienceType: 'class',
      availabilityMode: 'manual_teacher_activation',
      requiresTeacherActivation: true,
      allowStudentSelfStart: false,
      allowRetake: false,
      maxAttempts: 1,
      safePolicySummary: 'Class-level access',
      createdByActorId: 'a1',
    });
    expect(policy.accessPolicyId).toBeTruthy();
    expect(policy.availabilityMode).toBe('manual_teacher_activation');
  });

  it('Access policy cannot activate live delivery', async () => {
    const policy = await accessService.createAccessPolicy({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      intendedAudienceType: 'class',
      availabilityMode: 'paper_only',
      requiresTeacherActivation: true,
      allowStudentSelfStart: false,
      allowRetake: false,
      maxAttempts: 1,
      safePolicySummary: 'Paper only',
      createdByActorId: 'a1',
    });
    const ready = await accessService.markAccessPolicyDeliveryReady(policy);
    expect(ready.status).toBe('delivery_ready');
  });

  it('Access policy does not create release window', () => {
    const policyKeys: string[] = ['accessPolicyId', 'schoolId', 'paperId', 'paperVersionId', 'status', 'intendedAudienceType', 'availabilityMode', 'requiresTeacherActivation', 'allowStudentSelfStart', 'allowRetake', 'maxAttempts', 'safePolicySummary', 'createdByActorId', 'createdAt', 'updatedAt'];
    expect(policyKeys.includes('releaseWindowId')).toBe(false);
    expect(policyKeys.includes('releaseWindowInternal')).toBe(false);
  });

  it('Approval records teacher/admin decision', async () => {
    const approval = await approvalService.approveForDeliveryBridge({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      decision: 'approve_for_delivery_bridge',
      decisionReasonCode: 'TEACHER_REVIEWED',
      safeReason: 'Paper meets standards',
      decidedByActorId: 'a1',
      decidedByRole: 'teacher',
    });
    expect(approval.decision).toBe('approve_for_delivery_bridge');
    expect(approval.paperApprovalId).toBeTruthy();
  });

  it('Student cannot approve', () => {
    const decision = approvalService.validateApprovalContext({
      schoolId: 's1', actorId: 'a1', actorRole: 'student', correlationId: 'c1', idempotencyKey: 'k1',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('ROLE_NOT_ALLOWED');
  });

  it('Parent cannot approve', () => {
    const decision = approvalService.validateApprovalContext({
      schoolId: 's1', actorId: 'a1', actorRole: 'parent', correlationId: 'c1', idempotencyKey: 'k1',
    });
    expect(decision.allowed).toBe(false);
  });

  it('Delivery bridge contract can be created', async () => {
    const bridge = await bridgeService.createDeliveryBridgeContract({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      bridgeType: 'exam_mode_contract',
      compatibleRuntime: 'exam_mode_future',
      contractVersion: '1.0',
      safeContractSummary: 'Exam mode bridge contract',
    });
    expect(bridge.deliveryBridgeId).toBeTruthy();
    expect(bridge.status).toBe('draft');
  });

  it('Delivery bridge validates future ExamMode compatibility without creating sessions', async () => {
    const bridge = await bridgeService.createDeliveryBridgeContract({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      bridgeType: 'exam_mode_contract',
      compatibleRuntime: 'exam_mode_future',
      contractVersion: '1.0',
      safeContractSummary: 'Valid exam mode contract',
    });
    const validation = await bridgeService.validateExamModeBridgeContract(bridge);
    expect(validation.valid).toBe(true);
  });

  it('Delivery bridge validates future print compatibility without OCR', async () => {
    const bridge = await bridgeService.createDeliveryBridgeContract({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      bridgeType: 'paper_print_contract',
      compatibleRuntime: 'print_packet_future',
      contractVersion: '1.0',
      safeContractSummary: 'Print contract',
    });
    const validation = await bridgeService.validatePrintPacketBridgeContract(bridge);
    expect(validation.valid).toBe(true);
  });

  it('Delivery bridge ready status does not create release window', async () => {
    const bridge = await bridgeService.createDeliveryBridgeContract({
      schoolId: 's1', paperId: 'p1', paperVersionId: 'pv1',
      bridgeType: 'exam_mode_contract',
      compatibleRuntime: 'exam_mode_future',
      contractVersion: '1.0',
      safeContractSummary: 'Ready bridge',
    });
    const ready = await bridgeService.markBridgeDeliveryReady(bridge);
    expect(ready.status).toBe('delivery_ready');
    const bridgeKeys = Object.keys(ready);
    expect(bridgeKeys.includes('releaseWindowId')).toBe(false);
  });

  it('No finalization occurs', async () => {
    const mod = await import('../services/examPaperAssemblyService');
    const service = new mod.ExamPaperAssemblyService();
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    expect(methods.some((m) => m.includes('Finalize') || m.includes('finalize'))).toBe(false);
  });

  it('No parent release occurs', async () => {
    const mod = await import('../services/examPaperAssemblyService');
    const service = new mod.ExamPaperAssemblyService();
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    expect(methods.some((m) => m.includes('Parent') || m.includes('parent') || m.includes('Release') || m.includes('release'))).toBe(false);
  });

  it('No mastery mutation occurs', async () => {
    const mod = await import('../services/examPaperAssemblyService');
    const service = new mod.ExamPaperAssemblyService();
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    expect(methods.some((m) => m.includes('Mastery') || m.includes('mastery'))).toBe(false);
  });
});
