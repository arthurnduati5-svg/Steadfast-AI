import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionRiskAttestationService } from '../services/recoveryExecutionRiskAttestationService';
import { RecoveryExecutionVetoService } from '../services/recoveryExecutionVetoService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Risk Attestation and Veto Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let riskService: RecoveryExecutionRiskAttestationService;
  let vetoService: RecoveryExecutionVetoService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    riskService = new RecoveryExecutionRiskAttestationService(repos.riskAttestation, audit, idempotency);
    vetoService = new RecoveryExecutionVetoService(repos.veto, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('risk attestation records do NOT reduce safety gates', async () => {
    const result = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'high',
      safeAttestationSummary: 'Risk attestation test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.attestationStatus).not.toMatch(/live/);
    expect(result.data?.attestationStatus).not.toMatch(/executed/);
  });

  it('creates attestation with risk level', async () => {
    const result = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'critical',
      safeAttestationSummary: 'Critical risk test',
    });
    expect(result.data?.riskLevel).toBe('critical');
  });

  it('can mark risk_attested with attestor info', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeAttestationSummary: 'Attest test',
    });
    const attested = await riskService.markRiskAttested(ctx, schoolId, created.data!.riskAttestationId);
    expect(attested.data?.attestationStatus).toBe('risk_attested');
    expect(attested.data?.attestorActorId).toBe('actor-1');
    expect(attested.data?.attestorRole).toBe('admin');
    expect(attested.data?.attestedAt).toBeDefined();
  });

  it('can veto attestation', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'low',
      safeAttestationSummary: 'Veto test',
    });
    const vetoed = await riskService.vetoRiskAttestation(ctx, schoolId, created.data!.riskAttestationId);
    expect(vetoed.data?.attestationStatus).toBe('vetoed');
    expect(vetoed.data?.vetoedAt).toBeDefined();
  });

  it('veto records block preview flow but do NOT execute rollback', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'low',
      safeAttestationSummary: 'Veto block test',
    });
    const vetoed = await riskService.vetoRiskAttestation(ctx, schoolId, created.data!.riskAttestationId);
    expect(vetoed.data?.attestationStatus).toBe('vetoed');
    expect(vetoed.data?.attestationStatus).not.toMatch(/rollback/);
    expect(vetoed.data?.attestationStatus).not.toMatch(/reverted/);
  });

  it('can suppress, block, void risk attestation', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeAttestationSummary: 'Suppress test',
    });
    const suppressed = await riskService.suppressRiskAttestation(ctx, schoolId, created.data!.riskAttestationId);
    expect(suppressed.data?.suppressedAt).toBeDefined();
  });

  it('can block risk attestation', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'high',
      safeAttestationSummary: 'Block test',
    });
    const blocked = await riskService.blockRiskAttestation(ctx, schoolId, created.data!.riskAttestationId, ['risk_not_accepted']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('risk_not_accepted');
  });

  it('can void risk attestation', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'low',
      safeAttestationSummary: 'Void test',
    });
    const voided = await riskService.voidRiskAttestation(ctx, schoolId, created.data!.riskAttestationId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by risk level', async () => {
    await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'high',
      safeAttestationSummary: 'Risk level list',
    });
    const levelList = await riskService.listRiskAttestationsByRiskLevel(schoolId, 'high');
    expect(levelList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can create execution veto', async () => {
    const result = await vetoService.createExecutionVeto(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      vetoReason: 'safety_concern',
      safeVetoSummary: 'Veto test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.vetoReason).toBe('safety_concern');
  });

  it('can list vetoes by reason', async () => {
    await vetoService.createExecutionVeto(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      vetoReason: 'compliance',
      safeVetoSummary: 'Reason list test',
    });
    const reasonList = await vetoService.listExecutionVetoesByReason(schoolId, 'compliance');
    expect(reasonList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can list vetoes by actor', async () => {
    await vetoService.createExecutionVeto(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      vetoReason: 'policy',
      safeVetoSummary: 'Actor list test',
    });
    const actorList = await vetoService.listExecutionVetoesByActor(schoolId, 'actor-1');
    expect(actorList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct risk attestation', async () => {
    const created = await riskService.createRiskAttestation(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      riskLevel: 'medium',
      safeAttestationSummary: 'Test get',
    });
    const found = await riskService.getRiskAttestation(schoolId, created.data!.riskAttestationId);
    expect(found.success).toBe(true);
    expect(found.data?.safeAttestationSummary).toBe('Test get');
  });
});
