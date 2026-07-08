import { describe, it, expect, beforeEach } from 'vitest';
import { classifyIncidentSeverity, requiresImmediateContainment, requiresSafeguardingEscalation, requiresPrivacyEscalation, requiresPostmortem } from '../services/task024IncidentSeverityEscalationService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024IncidentSeverityEscalationService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should classify safeguarding boundary as sev0', async () => {
    const d = await classifyIncidentSeverity('inc_1', 'safeguarding_boundary_failure');
    expect(d.severity).toBe('sev0_school_wide_safety_or_privacy');
    expect(d.requiresImmediateContainment).toBe(true);
  });

  it('should classify privacy boundary as sev0', async () => {
    const d = await classifyIncidentSeverity('inc_2', 'privacy_boundary_failure');
    expect(d.severity).toBe('sev0_school_wide_safety_or_privacy');
  });

  it('should classify school auth outage as sev1', async () => {
    const d = await classifyIncidentSeverity('inc_3', 'school_auth_outage');
    expect(d.severity).toBe('sev1_major_learning_or_identity_outage');
  });

  it('should classify curriculum source gap as sev2', async () => {
    const d = await classifyIncidentSeverity('inc_4', 'curriculum_source_gap_spike');
    expect(d.severity).toBe('sev2_degraded_core_learning');
  });

  it('should classify backup failure as sev3', async () => {
    const d = await classifyIncidentSeverity('inc_5', 'backup_readiness_failure');
    expect(d.severity).toBe('sev3_limited_feature_degradation');
  });

  it('should classify rate limit as sev4', async () => {
    const d = await classifyIncidentSeverity('inc_6', 'rate_limit_backpressure_event');
    expect(d.severity).toBe('sev4_low_priority');
  });

  it('should require safeguarding escalation for safeguarding events', () => {
    expect(requiresSafeguardingEscalation('safeguarding_boundary_failure')).toBe(true);
    expect(requiresSafeguardingEscalation('school_auth_outage')).toBe(false);
  });

  it('should require privacy escalation for privacy and cross-school events', () => {
    expect(requiresPrivacyEscalation('privacy_boundary_failure')).toBe(true);
    expect(requiresPrivacyEscalation('cross_school_access_attempt')).toBe(true);
    expect(requiresPrivacyEscalation('school_auth_outage')).toBe(false);
  });

  it('should require school admin notification for sev0 and sev1', () => {
    expect(requiresImmediateContainment('sev0_school_wide_safety_or_privacy')).toBe(true);
    expect(requiresImmediateContainment('sev1_major_learning_or_identity_outage')).toBe(true);
    expect(requiresImmediateContainment('sev4_low_priority')).toBe(false);
  });
});
