import type { Task025ReadinessBlocker, Task025RiskLevel } from '../contracts/task025ControlledPilotReadinessContracts';

export interface PilotEligibilityResult {
  eligible: boolean;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
}

export async function checkPilotEligibility(params: {
  schoolId: string;
  schoolVerified: boolean;
  pilotScopeEvaluated: boolean;
  cohortReadinessEvaluated: boolean;
  teacherWorkflowValidated: boolean;
  adminAcceptanceChecked: boolean;
  parentCommunicationChecked: boolean;
  safeguardingChecked: boolean;
  monitoringGateChecked: boolean;
  pauseRollbackChecked: boolean;
  dataPrivacyChecked: boolean;
  task020ContinuityPassed: boolean;
  task021ContinuityPassed: boolean;
  task022ContinuityPassed: boolean;
  task023ContinuityPassed: boolean;
  task024ContinuityPassed: boolean;
}): Promise<PilotEligibilityResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.schoolId || params.schoolId.trim() === '') {
    blockers.push({
      type: 'school_identity',
      severity: 'high',
      safeDescription: 'No school identity provided.',
      requiredAction: 'Provide a valid school identity.',
    });
  }

  if (!params.schoolVerified) {
    blockers.push({
      type: 'school_identity',
      severity: 'high',
      safeDescription: 'School identity is not verified.',
      requiredAction: 'Complete school identity verification before pilot eligibility.',
    });
  }

  if (!params.pilotScopeEvaluated) {
    blockers.push({
      type: 'pilot_scope',
      severity: 'high',
      safeDescription: 'Pilot scope has not been evaluated.',
      requiredAction: 'Run pilot scope evaluation.',
    });
  }

  if (!params.cohortReadinessEvaluated) {
    blockers.push({
      type: 'cohort_readiness',
      severity: 'high',
      safeDescription: 'Cohort readiness has not been evaluated.',
      requiredAction: 'Run candidate cohort readiness evaluation.',
    });
  }

  if (!params.teacherWorkflowValidated) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'Teacher workflow has not been validated.',
      requiredAction: 'Complete teacher workflow validation.',
    });
  }

  if (!params.adminAcceptanceChecked) {
    blockers.push({
      type: 'admin_acceptance',
      severity: 'high',
      safeDescription: 'Admin acceptance has not been checked.',
      requiredAction: 'Complete admin acceptance readiness check.',
    });
  }

  if (!params.parentCommunicationChecked) {
    blockers.push({
      type: 'parent_communication',
      severity: 'medium',
      safeDescription: 'Parent communication readiness has not been checked.',
      requiredAction: 'Complete parent communication readiness check.',
    });
  }

  if (!params.safeguardingChecked) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'Safeguarding escalation readiness has not been checked.',
      requiredAction: 'Complete safeguarding escalation readiness check.',
    });
  }

  if (!params.monitoringGateChecked) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Monitoring gate readiness has not been checked.',
      requiredAction: 'Complete monitoring gate readiness check.',
    });
  }

  if (!params.pauseRollbackChecked) {
    blockers.push({
      type: 'pause_rollback',
      severity: 'high',
      safeDescription: 'Pause and rollback readiness has not been checked.',
      requiredAction: 'Complete pause and rollback readiness check.',
    });
  }

  if (!params.dataPrivacyChecked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Data privacy readiness has not been checked.',
      requiredAction: 'Complete data privacy readiness check.',
    });
  }

  if (!params.task020ContinuityPassed) {
    blockers.push({
      type: 'governance_continuity',
      severity: 'high',
      safeDescription: 'Task 020 governance continuity check failed.',
      requiredAction: 'Resolve governance continuity issues from Task 020.',
    });
  }

  if (!params.task021ContinuityPassed) {
    blockers.push({
      type: 'school_identity',
      severity: 'high',
      safeDescription: 'Task 021 school integration continuity check failed.',
      requiredAction: 'Resolve school integration continuity issues from Task 021.',
    });
  }

  if (!params.task022ContinuityPassed) {
    blockers.push({
      type: 'content_governance',
      severity: 'high',
      safeDescription: 'Task 022 content governance continuity check failed.',
      requiredAction: 'Resolve content governance continuity issues from Task 022.',
    });
  }

  if (!params.task023ContinuityPassed) {
    blockers.push({
      type: 'deployment_readiness',
      severity: 'high',
      safeDescription: 'Task 023 deployment readiness continuity check failed.',
      requiredAction: 'Resolve deployment readiness issues from Task 023.',
    });
  }

  if (!params.task024ContinuityPassed) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 operations readiness continuity check failed.',
      requiredAction: 'Resolve operations readiness issues from Task 024.',
    });
  }

  const hasHighBlockers = blockers.some((b) => b.severity === 'high');
  const eligible = !hasHighBlockers && blockers.length === 0;
  const riskLevel: Task025RiskLevel = hasHighBlockers ? 'high' : blockers.length > 0 ? 'medium' : 'low';

  const safeSummary = eligible
    ? 'School meets all pilot eligibility criteria.'
    : `Pilot eligibility blocked: ${blockers.length} issue(s) found.`;

  return { eligible, riskLevel, safeSummary, safeBlockers: blockers };
}
