import type { Task024AlertPolicyResult, Task024AlertSeverity } from '../contracts/task024OperationsReadinessContracts';
import { task024ReadinessRepository } from './task024OperationsReadinessRepository';

export async function evaluateOperationalAlertPolicy(category: string, severity?: Task024AlertSeverity): Promise<Task024AlertPolicyResult> {
  const severities: Task024AlertSeverity[] = ['info', 'warning', 'error', 'critical', 'security', 'safeguarding', 'privacy', 'blocked', 'unknown'];
  const alertSeverity = severity || classifyAlertSeverity(category);
  const owner = validateAlertOwner(category);
  const escalationPath = validateAlertEscalationPath(alertSeverity);
  const thresholdDefined = defineAlertThreshold(category);

  const result: Task024AlertPolicyResult = {
    policyDefined: true,
    alertCategories: [category],
    severity: alertSeverity,
    owner,
    escalationPath,
    thresholdDefined,
    safeSummary: `Alert policy defined for ${category} with severity ${alertSeverity}, owner ${owner}, escalation via ${escalationPath}`,
  };
  await task024ReadinessRepository.recordAlertPolicyResult(result);
  return result;
}

export function classifyAlertSeverity(category: string): Task024AlertSeverity {
  const criticalCategories = ['privacy_boundary_event', 'safeguarding_boundary_event', 'cross_school_attempt_spike'];
  const highCategories = ['school_auth_denial_spike', 'ai_egress_block_event', 'data_integrity_failure'];
  const mediumCategories = ['task020_governance_block_spike', 'error_rate_threshold_exceeded', 'latency_threshold_exceeded'];
  const lowCategories = ['backup_readiness_failure', 'restore_drill_failure', 'load_simulation_failure'];

  if (criticalCategories.includes(category)) return 'critical';
  if (highCategories.includes(category)) return 'error';
  if (mediumCategories.includes(category)) return 'warning';
  if (lowCategories.includes(category)) return 'info';
  return 'info';
}

export function defineAlertThreshold(category: string): boolean {
  return category !== 'unknown';
}

export function validateAlertOwner(category: string): string {
  const owners: Record<string, string> = {
    school_auth_denial_spike: 'school_integration_team',
    cross_school_attempt_spike: 'security_team',
    task020_governance_block_spike: 'privacy_team',
    task021_identity_mapping_failure_spike: 'school_integration_team',
    task022_source_gap_spike: 'content_governance_team',
    task023_readiness_gate_failure: 'deployment_team',
    ai_egress_block_event: 'ai_gateway_team',
    provider_disabled_event: 'ai_gateway_team',
    safeguarding_boundary_event: 'safeguarding_team',
    privacy_boundary_event: 'privacy_team',
    backup_readiness_failure: 'operations_team',
    restore_drill_failure: 'operations_team',
    data_integrity_failure: 'operations_team',
    latency_threshold_exceeded: 'infrastructure_team',
    error_rate_threshold_exceeded: 'infrastructure_team',
    load_simulation_failure: 'performance_team',
  };
  return owners[category] || 'operations_team';
}

export function validateAlertEscalationPath(severity: Task024AlertSeverity): string {
  const paths: Record<string, string> = {
    critical: 'immediate_escalation_to_engineering_lead_and_safety_team',
    security: 'immediate_escalation_to_security_team',
    safeguarding: 'immediate_escalation_to_safeguarding_lead',
    privacy: 'immediate_escalation_to_privacy_lead',
    error: 'escalation_to_engineering_lead_within_1_hour',
    warning: 'escalation_to_team_lead_within_4_hours',
    info: 'logged_for_daily_review',
    blocked: 'requires_owner_intervention',
    unknown: 'requires_classification',
  };
  return paths[severity] || 'logged_for_daily_review';
}
