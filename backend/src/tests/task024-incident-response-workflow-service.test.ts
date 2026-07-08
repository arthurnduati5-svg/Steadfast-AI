import { describe, it, expect, beforeEach } from 'vitest';
import { createIncidentResponsePlan, requirePostmortemForSeverity, determineEscalationPath } from '../services/task024IncidentResponseWorkflowService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024IncidentResponseWorkflowService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should create incident response plan with owner and escalation', async () => {
    const plan = await createIncidentResponsePlan('inc_1', 'privacy_boundary_failure', 'sev0_school_wide_safety_or_privacy', 'privacy_lead');
    expect(plan.incidentId).toBe('inc_1');
    expect(plan.owner).toBe('privacy_lead');
    expect(plan.escalationPath).toBeTruthy();
    expect(plan.containmentSteps.length).toBeGreaterThan(0);
    expect(plan.mitigationSteps.length).toBeGreaterThan(0);
  });

  it('should require postmortem for sev0 and sev1', () => {
    expect(requirePostmortemForSeverity('sev0_school_wide_safety_or_privacy')).toBe(true);
    expect(requirePostmortemForSeverity('sev1_major_learning_or_identity_outage')).toBe(true);
    expect(requirePostmortemForSeverity('sev3_limited_feature_degradation')).toBe(false);
  });

  it('should determine escalation path by severity', () => {
    expect(determineEscalationPath('sev0_school_wide_safety_or_privacy')).toContain('immediate');
    expect(determineEscalationPath('sev1_major_learning_or_identity_outage')).toContain('30_min');
    expect(determineEscalationPath('sev2_degraded_core_learning')).toContain('2_hours');
    expect(determineEscalationPath('sev3_limited_feature_degradation')).toContain('next_business');
    expect(determineEscalationPath('sev4_low_priority')).toContain('weekly');
  });
});
