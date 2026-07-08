import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateOperationalAlertPolicy, classifyAlertSeverity, validateAlertOwner, validateAlertEscalationPath } from '../services/task024OperationalAlertPolicyService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationalAlertPolicyService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should evaluate alert policy with owner and escalation path', async () => {
    const result = await evaluateOperationalAlertPolicy('school_auth_denial_spike');
    expect(result.policyDefined).toBe(true);
    expect(result.owner).toBeTruthy();
    expect(result.escalationPath).toBeTruthy();
  });

  it('should classify severity correctly', () => {
    expect(classifyAlertSeverity('privacy_boundary_event')).toBe('critical');
    expect(classifyAlertSeverity('safeguarding_boundary_event')).toBe('critical');
    expect(classifyAlertSeverity('school_auth_denial_spike')).toBe('error');
    expect(classifyAlertSeverity('error_rate_threshold_exceeded')).toBe('warning');
    expect(classifyAlertSeverity('backup_readiness_failure')).toBe('info');
  });

  it('should assign owners to all alert categories', () => {
    const categories = ['school_auth_denial_spike', 'cross_school_attempt_spike', 'task020_governance_block_spike', 'task021_identity_mapping_failure_spike', 'task022_source_gap_spike', 'task023_readiness_gate_failure', 'ai_egress_block_event', 'provider_disabled_event', 'safeguarding_boundary_event', 'privacy_boundary_event', 'backup_readiness_failure', 'restore_drill_failure', 'data_integrity_failure', 'latency_threshold_exceeded', 'error_rate_threshold_exceeded', 'load_simulation_failure'];
    for (const cat of categories) {
      const owner = validateAlertOwner(cat);
      expect(owner).toBeTruthy();
      expect(typeof owner).toBe('string');
    }
  });

  it('should assign escalation paths based on severity', () => {
    expect(validateAlertEscalationPath('critical')).toContain('immediate');
    expect(validateAlertEscalationPath('safeguarding')).toContain('immediate');
    expect(validateAlertEscalationPath('privacy')).toContain('immediate');
    expect(validateAlertEscalationPath('error')).toContain('escalation');
    expect(validateAlertEscalationPath('warning')).toContain('escalation');
    expect(validateAlertEscalationPath('info')).toContain('daily');
  });
});
