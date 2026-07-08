import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import type { PilotExpansionRiskLevel } from '../contracts/task027PilotExpansionContracts';

export async function assessExpansionRisk(expansionProposalId: string): Promise<{
  ok: boolean;
  riskAssessmentId?: string;
  overallRiskLevel: PilotExpansionRiskLevel;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const proposal = await task027PilotExpansionRepository.getProposal(expansionProposalId);
  if (!proposal) {
    return { ok: false, overallRiskLevel: 'high', blockingIssues: ['proposal_not_found'], safeMessage: 'Expansion proposal not found.' };
  }

  const prop = proposal as any;
  const schoolId = prop.schoolId;

  const evidencePack = await task027PilotExpansionRepository.getEvidencePackByProposalId(expansionProposalId);
  if (!evidencePack) {
    return { ok: false, overallRiskLevel: 'high', blockingIssues: ['evidence_pack_required'], safeMessage: 'Evidence pack required before risk assessment.' };
  }

  const ep = evidencePack as any;
  const blockingIssues: string[] = [];
  const riskReasons: string[] = [];
  const mitigations: string[] = [];

  const privacyEvidence = ep.privacyEvidence || {};
  const deenEvidence = ep.deenEvidence || {};
  const socraticEvidence = ep.socraticEvidence || {};
  const curriculumEvidence = ep.curriculumEvidence || {};
  const operationsEvidence = ep.operationsEvidence || {};
  const rollbackEvidence = ep.rollbackEvidence || {};
  const incidentEvidence = ep.incidentEvidence || {};

  const privacySignals = (privacyEvidence as any).privacySignals ?? 0;
  const privacyFeedback = (privacyEvidence as any).privacyFeedback ?? 0;
  const safeguardingCount = (privacyEvidence as any).safeguardingFeedbackCount ?? 0;
  const authGateBlocks = (privacyEvidence as any).authGateBlocks ?? 0;

  const deenSignals = (deenEvidence as any).deenSignals ?? 0;
  const deenFeedbackCount = (deenEvidence as any).deenFeedbackCount ?? 0;
  const deenGateBlocks = (deenEvidence as any).deenGateBlocks ?? 0;

  const socraticBlocks = (socraticEvidence as any).socraticGateBlocks ?? 0;
  const aiCallBlocks = (socraticEvidence as any).aiCallBlocks ?? 0;
  const socraticRegression = (socraticEvidence as any).socraticRegressionSignals ?? 0;

  const curriculumBlocks = (curriculumEvidence as any).curriculumGateBlocks ?? 0;

  const errorCount = (operationsEvidence as any).errorCount ?? 0;
  const rollbackEvents = (rollbackEvidence as any).rollbackEvents ?? 0;
  const killSwitchEngaged = (rollbackEvidence as any).killSwitchEngaged ?? false;
  const criticalSignals = (incidentEvidence as any).criticalSignals ?? 0;
  const highSignals = (incidentEvidence as any).highSignals ?? 0;

  let privacyRiskLevel: PilotExpansionRiskLevel = 'low';
  if (privacySignals > 3 || safeguardingCount > 0 || authGateBlocks > 5) {
    privacyRiskLevel = 'critical';
    blockingIssues.push('Critical privacy risk: unresolved privacy signals or safeguarding concerns.');
    riskReasons.push('Privacy signals indicate sensitive data exposure risk.');
    mitigations.push('Resolve all privacy signals and safeguarding feedback before expansion.');
  } else if (privacySignals > 0 || privacyFeedback > 0) {
    privacyRiskLevel = 'high';
    riskReasons.push('Privacy signals present.');
    mitigations.push('Review and resolve privacy signals.');
  } else if (authGateBlocks > 0) {
    privacyRiskLevel = 'medium';
  }

  let deenRiskLevel: PilotExpansionRiskLevel = 'low';
  if (deenSignals > 2 || deenFeedbackCount > 2) {
    deenRiskLevel = 'critical';
    blockingIssues.push('Critical Deen governance risk: multiple Deen signals or feedback items unresolved.');
    riskReasons.push('Deen-sensitive content concerns require scholar referral.');
    mitigations.push('Resolve all Deen governance signals and obtain scholar review before expansion.');
  } else if (deenSignals > 0 || deenFeedbackCount > 0 || deenGateBlocks > 0) {
    deenRiskLevel = 'high';
    riskReasons.push('Deen governance concerns present.');
    mitigations.push('Review Deen signals and verify Deen governance gates.');
  }

  let socraticRiskLevel: PilotExpansionRiskLevel = 'low';
  if (socraticRegression > 2 || socraticBlocks > 10) {
    socraticRiskLevel = 'critical';
    blockingIssues.push('Critical Socratic quality risk: Socratic regression or excessive blocks.');
    riskReasons.push('Socratic quality degrading, risk of final answer leakage.');
    mitigations.push('Fix Socratic regression and reduce block rate before expansion.');
  } else if (socraticRegression > 0 || socraticBlocks > 5) {
    socraticRiskLevel = 'high';
    riskReasons.push('Socratic quality concerns.');
    mitigations.push('Monitor Socratic quality and address regression patterns.');
  } else if (aiCallBlocks > 0) {
    socraticRiskLevel = 'medium';
  }

  let curriculumRiskLevel: PilotExpansionRiskLevel = 'low';
  if (curriculumBlocks > 10) {
    curriculumRiskLevel = 'high';
    blockingIssues.push('High curriculum gate block rate indicates content gaps.');
    riskReasons.push('Curriculum/source gaps detected.');
    mitigations.push('Resolve curriculum content gaps before expansion.');
  } else if (curriculumBlocks > 0) {
    curriculumRiskLevel = 'medium';
    riskReasons.push('Some curriculum gate blocks recorded.');
    mitigations.push('Verify curriculum scope coverage for proposed expansion subjects.');
  }

  let operationsRiskLevel: PilotExpansionRiskLevel = 'low';
  if (criticalSignals > 0 || errorCount > 100) {
    operationsRiskLevel = 'high';
    riskReasons.push('Operational issues detected.');
    mitigations.push('Resolve critical operational issues before expansion.');
  } else if (highSignals > 5 || errorCount > 50) {
    operationsRiskLevel = 'medium';
  }

  let safeguardingRiskLevel: PilotExpansionRiskLevel = 'low';
  if (safeguardingCount > 0) {
    safeguardingRiskLevel = 'high';
    riskReasons.push('Safeguarding-relevant items detected.');
    mitigations.push('Review all safeguarding items before expansion.');
  }

  if ((rollbackEvidence as any).rollbackReadiness !== 'verified') {
    blockingIssues.push('Rollback readiness not verified.');
    riskReasons.push('Rollback plan must be verified before expansion.');
    mitigations.push('Verify rollback readiness.');
  }

  if (rollbackEvents > 0) {
    blockingIssues.push(`Rollback occurred ${rollbackEvents} time(s) during pilot.`);
    riskReasons.push('Previous rollbacks indicate instability.');
  }

  if (killSwitchEngaged) {
    blockingIssues.push('Kill switch was engaged during pilot.');
    riskReasons.push('Kill switch activation indicates critical issue.');
  }

  const riskLevels = [privacyRiskLevel, deenRiskLevel, socraticRiskLevel, curriculumRiskLevel, operationsRiskLevel, safeguardingRiskLevel];
  const severityOrder: PilotExpansionRiskLevel[] = ['critical', 'high', 'medium', 'low'];
  let overallRiskLevel: PilotExpansionRiskLevel = 'low';
  for (const sev of severityOrder) {
    if (riskLevels.includes(sev)) {
      overallRiskLevel = sev;
      break;
    }
  }

  if (overallRiskLevel === 'critical') {
    blockingIssues.push('Overall risk is critical. Expansion not approved.');
  } else if (overallRiskLevel === 'high') {
    blockingIssues.push('Overall risk is high. Expansion requires conditions or is blocked.');
  }

  const uniqueBlocking = [...new Set(blockingIssues)];

  const assessment = await task027PilotExpansionRepository.createRiskAssessment({
    expansionProposalId,
    schoolId,
    overallRiskLevel,
    learningRiskLevel: 'medium',
    privacyRiskLevel,
    deenRiskLevel,
    socraticRiskLevel,
    curriculumRiskLevel,
    operationsRiskLevel,
    safeguardingRiskLevel,
    riskReasons,
    mitigations,
    blockingIssues: uniqueBlocking,
    safeSummary: `Risk assessment: overall=${overallRiskLevel}, ${uniqueBlocking.length} blocking issues.`,
  });

  return {
    ok: true,
    riskAssessmentId: (assessment as any).id,
    overallRiskLevel,
    blockingIssues: uniqueBlocking,
    safeMessage: `Risk assessment completed. Overall risk: ${overallRiskLevel}.`,
  };
}
