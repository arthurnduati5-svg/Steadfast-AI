import type {
  Task025StakeholderReadinessStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface DataPrivacyResult {
  privacyStatus: Task025StakeholderReadinessStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  dataClassificationApplied: boolean;
  roleMatrixApplied: boolean;
  retentionExportDeleteFoundationNotBypassed: boolean;
  aiEgressGuardNotBypassed: boolean;
  rawLearnerDataBlocked: boolean;
  parentDataBlocked: boolean;
  safeguardingRawBlocked: boolean;
  privateDeenTextBlocked: boolean;
  hiddenReasoningBlocked: boolean;
  answerArtifactsBlocked: boolean;
}

export async function checkDataPrivacyReadiness(params: {
  dataClassificationApplied: boolean;
  roleMatrixApplied: boolean;
  retentionExportDeleteFoundationNotBypassed: boolean;
  aiEgressGuardNotBypassed: boolean;
  rawLearnerDataBlocked: boolean;
  parentDataBlocked: boolean;
  safeguardingRawBlocked: boolean;
  privateDeenTextBlocked: boolean;
  hiddenReasoningBlocked: boolean;
  answerArtifactsBlocked: boolean;
}): Promise<DataPrivacyResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.dataClassificationApplied) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Data classification not applied.',
      requiredAction: 'Apply data classification from Task 020 governance.',
    });
  }

  if (!params.roleMatrixApplied) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Role access matrix not applied.',
      requiredAction: 'Apply role access matrix from Task 020 governance.',
    });
  }

  if (!params.retentionExportDeleteFoundationNotBypassed) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Retention/export/delete foundation has been bypassed.',
      requiredAction: 'Restore retention/export/delete foundation from Task 020.',
    });
  }

  if (!params.aiEgressGuardNotBypassed) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'AI egress guard has been bypassed.',
      requiredAction: 'Reinstate AI egress privacy guard from Task 020.',
    });
  }

  if (!params.rawLearnerDataBlocked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Raw learner data is not blocked in readiness context.',
      requiredAction: 'Block raw learner data in all readiness outputs.',
    });
  }

  if (!params.parentDataBlocked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Parent contact data is not blocked.',
      requiredAction: 'Block parent contact data in all readiness outputs.',
    });
  }

  if (!params.safeguardingRawBlocked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Raw safeguarding data is not blocked.',
      requiredAction: 'Block raw safeguarding data in all readiness outputs.',
    });
  }

  if (!params.privateDeenTextBlocked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Private Deen text is not blocked.',
      requiredAction: 'Block private Deen text in all readiness outputs.',
    });
  }

  if (!params.hiddenReasoningBlocked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Hidden reasoning is not blocked.',
      requiredAction: 'Block hidden reasoning in all readiness outputs.',
    });
  }

  if (!params.answerArtifactsBlocked) {
    blockers.push({
      type: 'data_privacy',
      severity: 'high',
      safeDescription: 'Answer artifacts are not blocked.',
      requiredAction: 'Block answer artifacts in all readiness outputs.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025StakeholderReadinessStatus = hasHighBlocker ? 'stakeholder_blocked' : 'stakeholder_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : 'low';

  return {
    privacyStatus: status,
    riskLevel,
    safeSummary: status === 'stakeholder_ready'
      ? 'Data privacy readiness confirmed. Task 020 governance continuity maintained.'
      : `Data privacy readiness has ${blockers.length} blocker(s).`,
    safeBlockers: blockers,
    dataClassificationApplied: params.dataClassificationApplied,
    roleMatrixApplied: params.roleMatrixApplied,
    retentionExportDeleteFoundationNotBypassed: params.retentionExportDeleteFoundationNotBypassed,
    aiEgressGuardNotBypassed: params.aiEgressGuardNotBypassed,
    rawLearnerDataBlocked: params.rawLearnerDataBlocked,
    parentDataBlocked: params.parentDataBlocked,
    safeguardingRawBlocked: params.safeguardingRawBlocked,
    privateDeenTextBlocked: params.privateDeenTextBlocked,
    hiddenReasoningBlocked: params.hiddenReasoningBlocked,
    answerArtifactsBlocked: params.answerArtifactsBlocked,
  };
}
