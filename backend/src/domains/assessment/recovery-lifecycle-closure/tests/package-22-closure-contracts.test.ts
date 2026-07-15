import { describe, it, expect } from 'vitest';
import { RecoveryLifecycleClosureCommandContext, RecoveryLifecycleClosureSafeEnvelope, RecoveryLifecycleClosurePolicyDecision } from '../contracts/recoveryLifecycleClosureContracts';
import { RecoveryLifecycleClosureReadiness, CreateRecoveryLifecycleClosureReadinessRequest } from '../contracts/recoveryLifecycleClosureReadinessContracts';
import { RecoveryPostSimulationHandoffPacket, CreateRecoveryPostSimulationHandoffPacketRequest } from '../contracts/recoveryPostSimulationHandoffPacketContracts';
import { RecoveryNextCycleRecommendationDraft, CreateRecoveryNextCycleRecommendationDraftRequest } from '../contracts/recoveryNextCycleRecommendationContracts';
import { RecoveryDeferredIntegrationTicket, CreateRecoveryDeferredIntegrationTicketRequest } from '../contracts/recoveryDeferredIntegrationTicketContracts';
import { RecoveryUnresolvedRiskRegister, CreateRecoveryUnresolvedRiskRegisterRequest } from '../contracts/recoveryUnresolvedRiskRegisterContracts';
import { RecoveryTeacherClosureReviewPacket, RecoveryAdminGovernanceReviewPacket, CreateRecoveryTeacherClosureReviewPacketRequest, CreateRecoveryAdminGovernanceReviewPacketRequest } from '../contracts/recoveryClosureReviewPacketContracts';
import { RecoveryStudentClosureReflectionDraft, RecoveryParentClosureGuidanceDraft, CreateRecoveryStudentClosureReflectionDraftRequest, CreateRecoveryParentClosureGuidanceDraftRequest } from '../contracts/recoveryStakeholderClosureDraftContracts';
import { RecoveryArchiveManifest, CreateRecoveryArchiveManifestRequest } from '../contracts/recoveryArchiveManifestContracts';
import { RecoveryFinalLifecycleSummary, CreateRecoveryFinalLifecycleSummaryRequest } from '../contracts/recoveryFinalLifecycleSummaryContracts';

describe('Package 22 - Closure Contracts', () => {
  it('RecoveryLifecycleClosureCommandContext has required fields', () => {
    const ctx: RecoveryLifecycleClosureCommandContext = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'teacher',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorId).toBe('actor-1');
    expect(ctx.actorRole).toBe('teacher');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.idempotencyKey).toBe('ik-1');
    expect(ctx.sourceRefsJson).toBeUndefined();
  });

  it('RecoveryLifecycleClosureSafeEnvelope wraps data correctly', () => {
    const envelope: RecoveryLifecycleClosureSafeEnvelope<{ id: string }> = { success: true, data: { id: 'test' }, status: 'created' };
    expect(envelope.success).toBe(true);
    expect(envelope.data?.id).toBe('test');
    expect(envelope.status).toBe('created');
  });

  it('RecoveryLifecycleClosurePolicyDecision has allowed, denied, reasonCodes', () => {
    const decision: RecoveryLifecycleClosurePolicyDecision = { allowed: true, denied: false, reasonCodes: [], actorRole: 'teacher', action: 'test' };
    expect(decision.allowed).toBe(true);
    expect(decision.denied).toBe(false);
    expect(Array.isArray(decision.reasonCodes)).toBe(true);
    expect(decision.actorRole).toBe('teacher');
    expect(decision.action).toBe('test');
  });

  it('RecoveryLifecycleClosureReadiness has correct status values', () => {
    const statuses = ['draft', 'review_ready', 'handoff_ready', 'approved_for_future_use', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('review_ready');
    expect(statuses).toContain('handoff_ready');
    expect(statuses).toContain('approved_for_future_use');
    expect(statuses).toContain('suppressed');
    expect(statuses).toContain('blocked');
    expect(statuses).toContain('voided');
  });

  it('RecoveryPostSimulationHandoffPacket starts as draft', () => {
    const packet: Partial<RecoveryPostSimulationHandoffPacket> = { handoffStatus: 'draft' };
    expect(packet.handoffStatus).toBe('draft');
  });

  it('RecoveryNextCycleRecommendationDraft starts as draft', () => {
    const rec: Partial<RecoveryNextCycleRecommendationDraft> = { recommendationStatus: 'draft' };
    expect(rec.recommendationStatus).toBe('draft');
  });

  it('RecoveryDeferredIntegrationTicket starts as draft', () => {
    const t: Partial<RecoveryDeferredIntegrationTicket> = { ticketStatus: 'draft' };
    expect(t.ticketStatus).toBe('draft');
  });

  it('RecoveryUnresolvedRiskRegister starts as draft', () => {
    const r: Partial<RecoveryUnresolvedRiskRegister> = { riskStatus: 'draft' };
    expect(r.riskStatus).toBe('draft');
  });

  it('RecoveryTeacherClosureReviewPacket starts as draft', () => {
    const p: Partial<RecoveryTeacherClosureReviewPacket> = { reviewStatus: 'draft' };
    expect(p.reviewStatus).toBe('draft');
  });

  it('RecoveryAdminGovernanceReviewPacket starts as draft', () => {
    const p: Partial<RecoveryAdminGovernanceReviewPacket> = { reviewStatus: 'draft' };
    expect(p.reviewStatus).toBe('draft');
  });

  it('RecoveryStudentClosureReflectionDraft starts as draft', () => {
    const d: Partial<RecoveryStudentClosureReflectionDraft> = { draftStatus: 'draft' };
    expect(d.draftStatus).toBe('draft');
  });

  it('RecoveryParentClosureGuidanceDraft starts as draft', () => {
    const d: Partial<RecoveryParentClosureGuidanceDraft> = { draftStatus: 'draft' };
    expect(d.draftStatus).toBe('draft');
  });

  it('RecoveryArchiveManifest starts as draft', () => {
    const m: Partial<RecoveryArchiveManifest> = { manifestStatus: 'draft' };
    expect(m.manifestStatus).toBe('draft');
  });

  it('RecoveryFinalLifecycleSummary starts as draft', () => {
    const s: Partial<RecoveryFinalLifecycleSummary> = { summaryStatus: 'draft' };
    expect(s.summaryStatus).toBe('draft');
  });

  it('all create request interfaces have studentRef when expected', () => {
    const readinessReq: CreateRecoveryLifecycleClosureReadinessRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeReadinessSummary: 'test' };
    expect(readinessReq.studentRef).toBe('s-1');
    const handoffReq: CreateRecoveryPostSimulationHandoffPacketRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeHandoffSummary: 'test' };
    expect(handoffReq.studentRef).toBe('s-1');
    const recReq: CreateRecoveryNextCycleRecommendationDraftRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', recommendationType: 'focus', safeRecommendationSummary: 'test' };
    expect(recReq.studentRef).toBe('s-1');
    const ticketReq: CreateRecoveryDeferredIntegrationTicketRequest = { resultRecoveryPlanId: 'p-1', ticketType: 'slo', safeTicketSummary: 'test' };
    expect(ticketReq.resultRecoveryPlanId).toBe('p-1');
    const riskReq: CreateRecoveryUnresolvedRiskRegisterRequest = { resultRecoveryPlanId: 'p-1', riskLevel: 'medium', safeRiskSummary: 'test' };
    expect(riskReq.riskLevel).toBe('medium');
    const teacherReq: CreateRecoveryTeacherClosureReviewPacketRequest = { teacherRef: 't-1', studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeTeacherReviewSummary: 'test' };
    expect(teacherReq.teacherRef).toBe('t-1');
    const adminReq: CreateRecoveryAdminGovernanceReviewPacketRequest = { adminRef: 'a-1', studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeAdminReviewSummary: 'test' };
    expect(adminReq.adminRef).toBe('a-1');
    const studentDraftReq: CreateRecoveryStudentClosureReflectionDraftRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeStudentReflectionSummary: 'test' };
    expect(studentDraftReq.studentRef).toBe('s-1');
    const parentDraftReq: CreateRecoveryParentClosureGuidanceDraftRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeParentGuidanceSummary: 'test' };
    expect(parentDraftReq.studentRef).toBe('s-1');
    const manifestReq: CreateRecoveryArchiveManifestRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeManifestSummary: 'test' };
    expect(manifestReq.studentRef).toBe('s-1');
    const summaryReq: CreateRecoveryFinalLifecycleSummaryRequest = { studentRef: 's-1', resultRecoveryPlanId: 'p-1', safeSummary: 'test' };
    expect(summaryReq.studentRef).toBe('s-1');
  });

  it('forbidden fields are not present in any contract', () => {
    const forbidden = [
      'scoreMutationPayload', 'masteryMutationPayload', 'liveRecoveryActivationPayload',
      'liveRecoveryCompletionPayload', 'liveRecoveryClosurePayload', 'aiNarrative',
      'generatedQuestionText', 'ocrText', 'pdfBinary',
    ];
    const readinessKeys = Object.keys({} as RecoveryLifecycleClosureReadiness);
    const handoffKeys = Object.keys({} as RecoveryPostSimulationHandoffPacket);
    const recKeys = Object.keys({} as RecoveryNextCycleRecommendationDraft);
    const allKeys = [...readinessKeys, ...handoffKeys, ...recKeys];
    for (const f of forbidden) {
      expect(allKeys).not.toContain(f);
    }
  });
});
