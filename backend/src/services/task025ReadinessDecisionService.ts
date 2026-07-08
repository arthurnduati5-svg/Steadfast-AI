import type {
  Task025PilotReadinessDecision,
  Task025ReadinessDecision,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { task025PilotReadinessRepository } from './task025PilotReadinessRepository';

export interface ReadinessCheckResults {
  scopeGatePassed: boolean;
  cohortReadinessPassed: boolean;
  teacherWorkflowPassed: boolean;
  adminAcceptancePassed: boolean;
  parentCommunicationPassed: boolean;
  safeguardingPassed: boolean;
  supportOperationsPassed: boolean;
  monitoringGatePassed: boolean;
  pauseRollbackPassed: boolean;
  dataPrivacyPassed: boolean;
  task020ContinuityPassed: boolean;
  task021ContinuityPassed: boolean;
  task022ContinuityPassed: boolean;
  task023ContinuityPassed: boolean;
  task024ContinuityPassed: boolean;
  extraBlockers: Task025ReadinessBlocker[];
}

export async function evaluateReadinessDecision(
  schoolId: string,
  actorRole: string,
  requestId: string,
  results: ReadinessCheckResults,
): Promise<Task025ReadinessDecision> {
  const allBlockers: Task025ReadinessBlocker[] = [...results.extraBlockers];

  if (!results.scopeGatePassed) {
    allBlockers.push({
      type: 'pilot_scope',
      severity: 'high',
      safeDescription: 'Pilot scope gate check failed.',
      requiredAction: 'Resolve all pilot scope blockers.',
    });
  }
  if (!results.cohortReadinessPassed) {
    allBlockers.push({
      type: 'cohort_readiness',
      severity: 'high',
      safeDescription: 'Candidate cohort readiness check failed.',
      requiredAction: 'Resolve all cohort readiness blockers.',
    });
  }
  if (!results.teacherWorkflowPassed) {
    allBlockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'Teacher workflow validation check failed.',
      requiredAction: 'Resolve all teacher workflow blockers.',
    });
  }
  if (!results.adminAcceptancePassed) {
    allBlockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'Admin acceptance readiness check failed.',
      requiredAction: 'Resolve all admin acceptance blockers.',
    });
  }
  if (!results.parentCommunicationPassed) {
    allBlockers.push({
      type: 'parent_communication',
      severity: 'medium',
      safeDescription: 'Parent communication readiness check failed.',
      requiredAction: 'Resolve all parent communication blockers.',
    });
  }
  if (!results.safeguardingPassed) {
    allBlockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'Safeguarding escalation readiness check failed.',
      requiredAction: 'Resolve all safeguarding escalation blockers.',
    });
  }
  if (!results.supportOperationsPassed) {
    allBlockers.push({
      type: 'support_operations',
      severity: 'high',
      safeDescription: 'Support operations readiness check failed.',
      requiredAction: 'Resolve all support operations blockers.',
    });
  }
  if (!results.monitoringGatePassed) {
    allBlockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Monitoring gate readiness check failed.',
      requiredAction: 'Resolve all monitoring gate blockers.',
    });
  }
  if (!results.pauseRollbackPassed) {
    allBlockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'Pause and rollback readiness check failed.',
      requiredAction: 'Resolve all pause and rollback blockers.',
    });
  }
  if (!results.dataPrivacyPassed) {
    allBlockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Data privacy readiness check failed.',
      requiredAction: 'Resolve all data privacy blockers.',
    });
  }
  if (!results.task020ContinuityPassed) {
    allBlockers.push({
      type: 'governance_continuity',
      severity: 'high',
      safeDescription: 'Task 020 governance continuity check failed.',
      requiredAction: 'Resolve Task 020 governance continuity issues.',
    });
  }
  if (!results.task021ContinuityPassed) {
    allBlockers.push({
      type: 'school_identity',
      severity: 'high',
      safeDescription: 'Task 021 school integration continuity check failed.',
      requiredAction: 'Resolve Task 021 school integration issues.',
    });
  }
  if (!results.task022ContinuityPassed) {
    allBlockers.push({
      type: 'content_governance',
      severity: 'high',
      safeDescription: 'Task 022 content governance continuity check failed.',
      requiredAction: 'Resolve Task 022 content governance issues.',
    });
  }
  if (!results.task023ContinuityPassed) {
    allBlockers.push({
      type: 'deployment_readiness',
      severity: 'high',
      safeDescription: 'Task 023 deployment readiness continuity check failed.',
      requiredAction: 'Resolve Task 023 deployment readiness issues.',
    });
  }
  if (!results.task024ContinuityPassed) {
    allBlockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 operations readiness continuity check failed.',
      requiredAction: 'Resolve Task 024 operations readiness issues.',
    });
  }

  const hasHighBlocker = allBlockers.some((b) => b.severity === 'high');
  const highBlockerCount = allBlockers.filter((b) => b.severity === 'high').length;

  let decision: Task025PilotReadinessDecision;
  let riskLevel: Task025RiskLevel;
  let task026SafeToStart: boolean;

  if (allBlockers.length === 0) {
    decision = 'ready_to_start_task026';
    riskLevel = 'low';
    task026SafeToStart = true;
  } else if (hasHighBlocker) {
    decision = 'not_ready';
    riskLevel = 'high';
    task026SafeToStart = false;
  } else {
    decision = 'manual_review_required';
    riskLevel = 'medium';
    task026SafeToStart = false;
  }

  const auditRef = task025PilotReadinessRepository.writeAuditEvent(
    schoolId,
    actorRole,
    'decision_evaluated',
    `Readiness decision: ${decision}. Blockers: ${allBlockers.length}.`,
    requestId,
  );

  const requiredActions = allBlockers.map((b) => b.requiredAction);
  const uniqueActions = [...new Set(requiredActions)];

  return {
    decision,
    riskLevel,
    safeSummary: task026SafeToStart
      ? 'All readiness checks passed. Task 026 is safe to start.'
      : `Readiness check found ${highBlockerCount} high-severity blocker(s) and ${allBlockers.length - highBlockerCount} other issue(s).`,
    safeBlockers: allBlockers,
    requiredActions: uniqueActions,
    task026SafeToStart,
    createdAt: new Date().toISOString(),
    auditRef: auditRef.id,
  };
}
