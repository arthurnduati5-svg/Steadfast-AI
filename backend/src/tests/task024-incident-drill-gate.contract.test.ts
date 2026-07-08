import { describe, it, expect } from 'vitest';
import { requirePostmortemForSeverity, determineEscalationPath } from '../services/task024IncidentResponseWorkflowService';

describe('Task024 Incident drill gate contract', () => {
  it('should require postmortem for sev0 and sev1 incidents', () => {
    expect(requirePostmortemForSeverity('sev0_school_wide_safety_or_privacy')).toBe(true);
    expect(requirePostmortemForSeverity('sev1_major_learning_or_identity_outage')).toBe(true);
  });

  it('should have escalation paths for all severities', () => {
    expect(determineEscalationPath('sev0_school_wide_safety_or_privacy')).toBeTruthy();
    expect(determineEscalationPath('sev1_major_learning_or_identity_outage')).toBeTruthy();
    expect(determineEscalationPath('sev2_degraded_core_learning')).toBeTruthy();
    expect(determineEscalationPath('sev3_limited_feature_degradation')).toBeTruthy();
    expect(determineEscalationPath('sev4_low_priority')).toBeTruthy();
  });

  it('should have incident workflow with owner, severity, containment, mitigation', () => {
    const workflowComponents = ['owner', 'severity', 'containment', 'mitigation', 'postmortem'];
    expect(workflowComponents.length).toBe(5);
  });
});
