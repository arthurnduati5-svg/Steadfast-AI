export interface Task022ContentGovernanceReadinessDecision {
  approvedSourceRequired: boolean;
  contentGapResponseAvailable: boolean;
  answerArtifactBlockingAvailable: boolean;
  deenSourcePolicyAvailable: boolean;
  cambridgeSourcePolicyAvailable: boolean;
  challengeRemediationGroundingAvailable: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export function verifyTask022ContentGovernanceGate(): Task022ContentGovernanceReadinessDecision {
  const sourceOk = verifyApprovedSourceRequired();
  const gapOk = verifyContentGapResponseAvailable();
  const artifactBlockOk = verifyAnswerArtifactBlockingAvailable();
  const deenOk = verifyDeenSourcePolicyAvailable();
  const cambridgeOk = verifyCambridgeSourcePolicyAvailable();
  const remediationOk = verifyChallengeRemediationGroundingAvailable();

  const reasonCodes: string[] = [];
  let passed = true;

  if (sourceOk) reasonCodes.push('APPROVED_SOURCE_REQUIRED');
  else { reasonCodes.push('APPROVED_SOURCE_MISSING'); passed = false; }

  if (gapOk) reasonCodes.push('CONTENT_GAP_RESPONSE_AVAILABLE');
  else { reasonCodes.push('CONTENT_GAP_RESPONSE_MISSING'); passed = false; }

  if (artifactBlockOk) reasonCodes.push('ANSWER_ARTIFACT_BLOCKING_AVAILABLE');
  else { reasonCodes.push('ANSWER_ARTIFACT_BLOCKING_MISSING'); passed = false; }

  if (deenOk) reasonCodes.push('DEEN_SOURCE_POLICY_AVAILABLE');
  else { reasonCodes.push('DEEN_SOURCE_POLICY_MISSING'); passed = false; }

  if (cambridgeOk) reasonCodes.push('CAMBRIDGE_SOURCE_POLICY_AVAILABLE');
  else { reasonCodes.push('CAMBRIDGE_SOURCE_POLICY_MISSING'); passed = false; }

  if (remediationOk) reasonCodes.push('CHALLENGE_REMEDIATION_GROUNDING_AVAILABLE');
  else { reasonCodes.push('CHALLENGE_REMEDIATION_GROUNDING_MISSING'); passed = false; }

  return {
    approvedSourceRequired: sourceOk,
    contentGapResponseAvailable: gapOk,
    answerArtifactBlockingAvailable: artifactBlockOk,
    deenSourcePolicyAvailable: deenOk,
    cambridgeSourcePolicyAvailable: cambridgeOk,
    challengeRemediationGroundingAvailable: remediationOk,
    reasonCodes,
    passed,
  };
}

function verifyApprovedSourceRequired(): boolean {
  try {
    const svc = require('./task022ApprovedSourceRegistryService');
    return typeof svc.approvedSourceRegistryService?.getApprovedSources === 'function';
  } catch {
    return false;
  }
}

function verifyContentGapResponseAvailable(): boolean {
  try {
    const svc = require('./task022ContentGroundingService');
    return typeof svc.contentGroundingService?.check === 'function';
  } catch {
    return false;
  }
}

function verifyAnswerArtifactBlockingAvailable(): boolean {
  try {
    require('./task022ContentItemGovernanceService');
    return true;
  } catch {
    return false;
  }
}

function verifyDeenSourcePolicyAvailable(): boolean {
  try {
    require('./task022DeenSourcePolicyService');
    return true;
  } catch {
    return false;
  }
}

function verifyCambridgeSourcePolicyAvailable(): boolean {
  try {
    require('./task022CambridgeAcademicContentPolicyService');
    return true;
  } catch {
    return false;
  }
}

function verifyChallengeRemediationGroundingAvailable(): boolean {
  try {
    require('./task022TutorChallengeRemediationIntegrationService');
    return true;
  } catch {
    return false;
  }
}

export function buildTask022ContentGovernanceReadinessDecision(
  decision: Task022ContentGovernanceReadinessDecision
): string {
  if (decision.passed) return 'TASK022_CONTENT_GOVERNANCE_READY';
  return `TASK022_CONTENT_GOVERNANCE_BLOCKED: ${decision.reasonCodes.join(', ')}`;
}
