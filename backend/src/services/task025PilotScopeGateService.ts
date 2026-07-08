import type {
  Task025PilotScopeInput,
  Task025PilotScopeAssessment,
  Task025ReadinessBlocker,
} from '../contracts/task025ControlledPilotReadinessContracts';

export async function evaluatePilotScope(
  input: Task025PilotScopeInput,
): Promise<Task025PilotScopeAssessment> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!input.teacherCoverageAvailable) {
    blockers.push({
      type: 'pilot_scope',
      severity: 'high',
      safeDescription: 'Teacher coverage is not available for the proposed pilot scope.',
      requiredAction: 'Assign teacher coverage before proceeding.',
    });
  }

  if (!input.safeguardingEscalationPathDefined) {
    blockers.push({
      type: 'safeguarding_escalation',
      severity: 'high',
      safeDescription: 'Safeguarding escalation path is not defined for the pilot scope.',
      requiredAction: 'Define a safeguarding escalation path and assign an owner.',
    });
  }

  if (!input.parentCommunicationMaterialPrepared) {
    blockers.push({
      type: 'parent_communication',
      severity: 'medium',
      safeDescription: 'Parent communication materials are not yet prepared.',
      requiredAction: 'Prepare parent communication materials before pilot start.',
    });
  }

  if (!input.deenSourceReferralPathDefined) {
    blockers.push({
      type: 'content_governance',
      severity: 'medium',
      safeDescription: 'Deen source/referral path is not defined for relevant content.',
      requiredAction: 'Define a source/referral path for Deen-related pilot support.',
    });
  }

  if (!input.curriculumSourceGovernanceReady) {
    blockers.push({
      type: 'content_governance',
      severity: 'high',
      safeDescription: 'Curriculum source governance is not ready.',
      requiredAction: 'Complete curriculum source governance setup before pilot.',
    });
  }

  if (!input.privacyGovernanceReady) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Privacy governance is not ready for the pilot scope.',
      requiredAction: 'Complete privacy governance readiness checks.',
    });
  }

  if (!input.operationsMonitoringReady) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Operations monitoring is not ready.',
      requiredAction: 'Complete operations monitoring setup before pilot.',
    });
  }

  if (input.cohortSize > 50) {
    blockers.push({
      type: 'pilot_scope',
      severity: 'medium',
      safeDescription: `Cohort size of ${input.cohortSize} exceeds recommended maximum of 50 for initial controlled pilot.`,
      requiredAction: 'Consider reducing cohort size or document explicit approval.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const hasMediumBlocker = blockers.some((b) => b.severity === 'medium');

  let scopeStatus: 'scope_defined' | 'scope_approved' | 'scope_blocked' | 'scope_pending_review';
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let task026SafeToStart: boolean;

  if (hasHighBlocker) {
    scopeStatus = 'scope_blocked';
    riskLevel = 'high';
    task026SafeToStart = false;
  } else if (hasMediumBlocker) {
    scopeStatus = 'scope_pending_review';
    riskLevel = 'medium';
    task026SafeToStart = false;
  } else {
    scopeStatus = 'scope_approved';
    riskLevel = 'low';
    task026SafeToStart = true;
  }

  const safeSummary = task026SafeToStart
    ? `Pilot scope is approved. Purpose: ${input.pilotPurpose}. Cohort size: ${input.cohortSize}. Duration: ${input.pilotDurationWeeks} weeks.`
    : `Pilot scope has ${blockers.length} blocker(s) to resolve.`;

  return {
    scopeStatus,
    riskLevel,
    safeSummary,
    safeBlockers: blockers,
    task026SafeToStart,
  };
}
