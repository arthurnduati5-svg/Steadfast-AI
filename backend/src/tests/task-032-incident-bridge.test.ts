import { describe, it, expect } from 'vitest';
import { verifyTask032CanaryIncidentBridge } from '../services/task032CanaryIncidentBridgeService';

describe('Task 032 - Incident Bridge', () => {
  it('should pass with valid activationId and schoolId', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have safe incident reason codes exist', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.safeIncidentReasonCodesExist).toBe(true);
  });

  it('should have escalation labels exist', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.escalationLabelsExist).toBe(true);
  });

  it('should have rollback trigger labels exist', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.rollbackTriggerLabelsExist).toBe(true);
  });

  it('should not expose safeguarding raw details', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.safeguardingRawDetailsNotExposed).toBe(true);
  });

  it('should not expose private Deen text', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.privateDeenTextNotExposed).toBe(true);
  });

  it('should confirm no notification sent', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.noNotificationSent).toBe(true);
  });

  it('should confirm no external ticket created', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.noExternalTicketCreated).toBe(true);
  });

  it('should confirm no webhook called', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(result.noWebhookCalled).toBe(true);
  });

  it('should fail with missing activationId', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: '',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('missing_activation_id');
  });

  it('should fail with missing schoolId', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('missing_school_id');
  });

  it('should fail with both missing activationId and schoolId', async () => {
    const result = await verifyTask032CanaryIncidentBridge({
      activationId: '',
      schoolId: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('missing_activation_id');
    expect(result.blockingIssues).toContain('missing_school_id');
    expect(result.blockingIssues.length).toBe(2);
  });
});
