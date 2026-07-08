import type { Task024IncidentSeverityDecision, Task024IncidentSeverity } from '../contracts/task024OperationsReadinessContracts';
import { task024ReadinessRepository } from './task024OperationsReadinessRepository';

export async function classifyIncidentSeverity(
  incidentId: string, incidentCategory: string
): Promise<Task024IncidentSeverityDecision> {
  const severity = determineSeverity(incidentCategory);
  const decision: Task024IncidentSeverityDecision = {
    incidentId,
    severity,
    requiresImmediateContainment: requiresImmediateContainment(severity),
    requiresSafeguardingEscalation: requiresSafeguardingEscalation(incidentCategory),
    requiresPrivacyEscalation: requiresPrivacyEscalation(incidentCategory),
    requiresSchoolAdminNotification: requiresSchoolAdminNotification(severity),
    requiresPostmortem: requiresPostmortem(severity),
    safeReasonCode: `classified_${incidentCategory}_as_${severity}`,
  };
  await task024ReadinessRepository.recordIncidentSeverityDecision(decision);
  return decision;
}

function determineSeverity(category: string): Task024IncidentSeverity {
  const sev0 = ['safeguarding_boundary_failure', 'cross_school_access_attempt', 'privacy_boundary_failure'];
  const sev1 = ['school_auth_outage', 'ai_egress_block_failure', 'database_connectivity_failure'];
  const sev2 = ['curriculum_source_gap_spike', 'provider_failure', 'data_integrity_failure', 'deen_boundary_failure'];
  const sev3 = ['backup_readiness_failure', 'restore_drill_failure', 'high_error_rate', 'high_latency'];
  const sev4 = ['rate_limit_backpressure_event'];

  if (sev0.includes(category)) return 'sev0_school_wide_safety_or_privacy';
  if (sev1.includes(category)) return 'sev1_major_learning_or_identity_outage';
  if (sev2.includes(category)) return 'sev2_degraded_core_learning';
  if (sev3.includes(category)) return 'sev3_limited_feature_degradation';
  if (sev4.includes(category)) return 'sev4_low_priority';
  return 'unknown';
}

export function requiresImmediateContainment(severity: Task024IncidentSeverity): boolean {
  return severity === 'sev0_school_wide_safety_or_privacy' || severity === 'sev1_major_learning_or_identity_outage';
}

export function requiresSafeguardingEscalation(category: string): boolean {
  return category === 'safeguarding_boundary_failure';
}

export function requiresPrivacyEscalation(category: string): boolean {
  return category === 'privacy_boundary_failure' || category === 'cross_school_access_attempt';
}

export function requiresSchoolAdminNotification(severity: Task024IncidentSeverity): boolean {
  return severity === 'sev0_school_wide_safety_or_privacy' || severity === 'sev1_major_learning_or_identity_outage';
}

export function requiresPostmortem(severity: Task024IncidentSeverity): boolean {
  return severity === 'sev0_school_wide_safety_or_privacy' || severity === 'sev1_major_learning_or_identity_outage';
}
