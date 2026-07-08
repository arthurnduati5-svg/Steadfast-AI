import type {
  Task025ParentCommunicationStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface ParentCommunicationResult {
  parentCommunicationStatus: Task025ParentCommunicationStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  templatesReady: boolean;
  noRawLearnerDataInTemplates: boolean;
  noUnsupportedClaims: boolean;
  noReligiousAuthorityOverclaim: boolean;
  noAiExaggeration: boolean;
  noGuaranteeOfOutcomes: boolean;
  clearPilotExplanation: boolean;
  clearSupportPath: boolean;
  clearSchoolContactPath: boolean;
  clearPrivacySummary: boolean;
  clearOptOutPathDefined: boolean;
}

export async function checkParentCommunicationReadiness(params: {
  templatesReady: boolean;
  noRawLearnerDataInTemplates: boolean;
  noUnsupportedClaims: boolean;
  noReligiousAuthorityOverclaim: boolean;
  noAiExaggeration: boolean;
  noGuaranteeOfOutcomes: boolean;
  clearPilotExplanation: boolean;
  clearSupportPath: boolean;
  clearSchoolContactPath: boolean;
  clearPrivacySummary: boolean;
  clearOptOutPathDefined: boolean;
}): Promise<ParentCommunicationResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.templatesReady) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication templates are not ready.',
      requiredAction: 'Prepare parent communication templates.',
    });
  }

  if (!params.noRawLearnerDataInTemplates) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication templates may contain raw learner data.',
      requiredAction: 'Remove raw learner data from parent communication templates.',
    });
  }

  if (!params.noUnsupportedClaims) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication may contain unsupported claims.',
      requiredAction: 'Review and remove unsupported claims from templates.',
    });
  }

  if (!params.noReligiousAuthorityOverclaim) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication may overclaim religious authority.',
      requiredAction: 'Review and remove religious authority overclaim.',
    });
  }

  if (!params.noAiExaggeration) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication may exaggerate AI capabilities.',
      requiredAction: 'Review and remove AI capability exaggeration.',
    });
  }

  if (!params.noGuaranteeOfOutcomes) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication may guarantee outcomes.',
      requiredAction: 'Remove any guarantee of learning outcomes.',
    });
  }

  if (!params.clearPilotExplanation) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication lacks clear pilot explanation.',
      requiredAction: 'Add a clear explanation of the pilot program.',
    });
  }

  if (!params.clearSupportPath) {
    blockers.push({
      type: 'parent_communication',
      severity: 'medium',
      safeDescription: 'Parent communication lacks clear support path.',
      requiredAction: 'Add a clear support contact path.',
    });
  }

  if (!params.clearSchoolContactPath) {
    blockers.push({
      type: 'parent_communication',
      severity: 'medium',
      safeDescription: 'Parent communication lacks school contact path.',
      requiredAction: 'Add school contact information.',
    });
  }

  if (!params.clearPrivacySummary) {
    blockers.push({
      type: 'parent_communication',
      severity: 'high',
      safeDescription: 'Parent communication lacks privacy summary.',
      requiredAction: 'Add a clear privacy summary to communication.',
    });
  }

  if (!params.clearOptOutPathDefined) {
    blockers.push({
      type: 'parent_communication',
      severity: 'medium',
      safeDescription: 'Parent communication lacks opt-out or query path.',
      requiredAction: 'Define and communicate the opt-out or query path.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025ParentCommunicationStatus = hasHighBlocker
    ? 'parent_communication_blocked'
    : blockers.length > 0
      ? 'parent_communication_pending'
      : 'parent_communication_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : blockers.length > 0 ? 'medium' : 'low';

  return {
    parentCommunicationStatus: status,
    riskLevel,
    safeSummary: status === 'parent_communication_ready'
      ? 'Parent communication materials are ready.'
      : `Parent communication readiness has ${blockers.length} issue(s).`,
    safeBlockers: blockers,
    templatesReady: params.templatesReady,
    noRawLearnerDataInTemplates: params.noRawLearnerDataInTemplates,
    noUnsupportedClaims: params.noUnsupportedClaims,
    noReligiousAuthorityOverclaim: params.noReligiousAuthorityOverclaim,
    noAiExaggeration: params.noAiExaggeration,
    noGuaranteeOfOutcomes: params.noGuaranteeOfOutcomes,
    clearPilotExplanation: params.clearPilotExplanation,
    clearSupportPath: params.clearSupportPath,
    clearSchoolContactPath: params.clearSchoolContactPath,
    clearPrivacySummary: params.clearPrivacySummary,
    clearOptOutPathDefined: params.clearOptOutPathDefined,
  };
}
