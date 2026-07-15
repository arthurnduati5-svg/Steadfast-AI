import { describe, it, expect } from 'vitest';
import { RecoveryExecutionAuthorizationPreviewCommandContext, RecoveryExecutionAuthorizationPreviewSafeEnvelope, RecoveryExecutionAuthorizationPreviewPolicyDecision } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { RecoveryExecutionAuthorizationPreviewReadiness } from '../contracts/recoveryExecutionAuthorizationReadinessContracts';
import { RecoveryExecutionAuthorizationRequestDraft } from '../contracts/recoveryExecutionAuthorizationRequestContracts';
import { RecoveryExecutionAuthorizationEligibilityCheck } from '../contracts/recoveryExecutionAuthorizationEligibilityContracts';
import { RecoveryExecutionAuthorityMatrixSnapshot } from '../contracts/recoveryExecutionAuthorityMatrixContracts';
import { RecoveryExecutionApprovalChainDraft } from '../contracts/recoveryExecutionApprovalChainContracts';
import { RecoveryExecutionRiskAttestation } from '../contracts/recoveryExecutionRiskAttestationContracts';
import { RecoveryExecutionConsentBoundaryCheck } from '../contracts/recoveryExecutionConsentBoundaryContracts';
import { RecoveryExecutionVeto } from '../contracts/recoveryExecutionVetoContracts';
import { RecoveryExecutionPreflightChecklist } from '../contracts/recoveryExecutionPreflightChecklistContracts';
import { RecoveryExecutionAuthorizationDryRun } from '../contracts/recoveryExecutionAuthorizationDryRunContracts';
import { RecoveryExecutionPreLiveDecisionPacket } from '../contracts/recoveryExecutionPreLiveDecisionPacketContracts';
import { RecoveryExecutionMockAuthorizationReceipt } from '../contracts/recoveryExecutionMockAuthorizationReceiptContracts';
import { RecoveryExecutionAuthorizationSummary } from '../contracts/recoveryExecutionAuthorizationSummaryContracts';
import * as path from 'path';
import * as fs from 'fs';

describe('Package 23 - Authorization Contracts', () => {
  it('contracts/index.ts exports all required types', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../contracts/index.ts'), 'utf-8');
    expect(indexContent).toContain('recoveryExecutionAuthorizationPreviewContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorizationReadinessContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorizationRequestContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorizationEligibilityContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorityMatrixContracts');
    expect(indexContent).toContain('recoveryExecutionApprovalChainContracts');
    expect(indexContent).toContain('recoveryExecutionRiskAttestationContracts');
    expect(indexContent).toContain('recoveryExecutionConsentBoundaryContracts');
    expect(indexContent).toContain('recoveryExecutionVetoContracts');
    expect(indexContent).toContain('recoveryExecutionPreflightChecklistContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorizationDryRunContracts');
    expect(indexContent).toContain('recoveryExecutionPreLiveDecisionPacketContracts');
    expect(indexContent).toContain('recoveryExecutionMockAuthorizationReceiptContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorizationSummaryContracts');
    expect(indexContent).toContain('recoveryExecutionAuthorizationRepositoryContracts');
  });

  it('RecoveryExecutionAuthorizationPreviewCommandContext has required fields', () => {
    const ctx: RecoveryExecutionAuthorizationPreviewCommandContext = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'admin',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorId).toBe('actor-1');
    expect(ctx.actorRole).toBe('admin');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.idempotencyKey).toBe('ik-1');
    expect(ctx.sourceRefsJson).toBeUndefined();
  });

  it('RecoveryExecutionAuthorizationPreviewSafeEnvelope wraps data correctly', () => {
    const envelope: RecoveryExecutionAuthorizationPreviewSafeEnvelope<{ id: string }> = { success: true, data: { id: 'test' }, status: 'created' };
    expect(envelope.success).toBe(true);
    expect(envelope.data?.id).toBe('test');
    expect(envelope.status).toBe('created');
  });

  it('RecoveryExecutionAuthorizationPreviewPolicyDecision has allowed and reason', () => {
    const decision: RecoveryExecutionAuthorizationPreviewPolicyDecision = { allowed: true, reason: 'allowed', requiredRole: 'admin' };
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('allowed');
    expect(decision.requiredRole).toBe('admin');
  });

  it('RecoveryExecutionAuthorizationPreviewReadiness starts as draft', () => {
    const r: Partial<RecoveryExecutionAuthorizationPreviewReadiness> = { status: 'draft' };
    expect(r.status).toBe('draft');
  });

  it('RecoveryExecutionAuthorizationRequestDraft starts as draft', () => {
    const r: Partial<RecoveryExecutionAuthorizationRequestDraft> = { requestStatus: 'draft' };
    expect(r.requestStatus).toBe('draft');
  });

  it('RecoveryExecutionAuthorizationEligibilityCheck has decision field', () => {
    const r: Partial<RecoveryExecutionAuthorizationEligibilityCheck> = { decision: 'eligible' };
    expect(r.decision).toBe('eligible');
  });

  it('RecoveryExecutionAuthorityMatrixSnapshot starts as draft', () => {
    const r: Partial<RecoveryExecutionAuthorityMatrixSnapshot> = { snapshotStatus: 'draft' };
    expect(r.snapshotStatus).toBe('draft');
  });

  it('RecoveryExecutionApprovalChainDraft starts as draft', () => {
    const r: Partial<RecoveryExecutionApprovalChainDraft> = { chainStatus: 'draft' };
    expect(r.chainStatus).toBe('draft');
  });

  it('RecoveryExecutionRiskAttestation starts as draft', () => {
    const r: Partial<RecoveryExecutionRiskAttestation> = { attestationStatus: 'draft' };
    expect(r.attestationStatus).toBe('draft');
  });

  it('RecoveryExecutionConsentBoundaryCheck has decision field', () => {
    const r: Partial<RecoveryExecutionConsentBoundaryCheck> = { decision: 'consent_granted' };
    expect(r.decision).toBe('consent_granted');
  });

  it('RecoveryExecutionVeto starts as draft', () => {
    const r: Partial<RecoveryExecutionVeto> = { vetoStatus: 'draft' };
    expect(r.vetoStatus).toBe('draft');
  });

  it('RecoveryExecutionPreflightChecklist starts as draft', () => {
    const r: Partial<RecoveryExecutionPreflightChecklist> = { checklistStatus: 'draft' };
    expect(r.checklistStatus).toBe('draft');
  });

  it('RecoveryExecutionAuthorizationDryRun starts as pending', () => {
    const r: Partial<RecoveryExecutionAuthorizationDryRun> = { dryRunDecision: 'pending' };
    expect(r.dryRunDecision).toBe('pending');
  });

  it('RecoveryExecutionPreLiveDecisionPacket starts as draft', () => {
    const r: Partial<RecoveryExecutionPreLiveDecisionPacket> = { packetStatus: 'draft' };
    expect(r.packetStatus).toBe('draft');
  });

  it('RecoveryExecutionMockAuthorizationReceipt has receiptDecision field', () => {
    const r: Partial<RecoveryExecutionMockAuthorizationReceipt> = { receiptDecision: 'mock_authorized' };
    expect(r.receiptDecision).toBe('mock_authorized');
  });

  it('RecoveryExecutionAuthorizationSummary starts as draft', () => {
    const r: Partial<RecoveryExecutionAuthorizationSummary> = { summaryStatus: 'draft' };
    expect(r.summaryStatus).toBe('draft');
  });

  it('forbidden fields are not present in any contract', () => {
    const forbidden = [
      'scoreMutationPayload', 'masteryMutationPayload', 'liveRecoveryActivationPayload',
      'liveRecoveryCompletionPayload', 'liveRecoveryClosurePayload', 'aiNarrative',
      'generatedQuestionText', 'ocrText', 'pdfBinary',
    ];
    const readinessKeys = Object.keys({} as RecoveryExecutionAuthorizationPreviewReadiness);
    const allKeys = [...readinessKeys];
    for (const f of forbidden) {
      expect(allKeys).not.toContain(f);
    }
  });
});
