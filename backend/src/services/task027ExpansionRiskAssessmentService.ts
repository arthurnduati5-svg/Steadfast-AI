import {
  Task027ExpansionRiskAssessmentInput,
  Task027ExpansionRiskAssessmentResult,
  TASK027_RISK_LEVELS,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

type RiskLevel = (typeof TASK027_RISK_LEVELS)[number];

export async function assessExpansionRisk(input: Task027ExpansionRiskAssessmentInput): Promise<Task027ExpansionRiskAssessmentResult> {
  const { schoolId, proposalId, pilotRunId } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      overallRiskLevel: 'high',
      learningQualityRisk: 'high',
      socraticIntegrityRisk: 'high',
      academicIntegrityRisk: 'high',
      privacyRisk: 'high',
      safeguardingRisk: 'high',
      deenContentRisk: 'high',
      teacherWorkloadRisk: 'high',
      operationsCapacityRisk: 'high',
      rollbackReadinessRisk: 'high',
      studentSupportRisk: 'high',
      riskReasons: ['proposal_not_found'],
      mitigations: [],
      requiresHumanReview: true,
      humanReviewReasonCodes: ['proposal_not_found'],
      blockingIssues: ['Expansion proposal not found.'],
      safeMessage: 'Cannot assess risk: proposal not found.',
    };
  }

  const evidenceSummary = await govRepo.getEvidenceSummary(schoolId, pilotRunId);
  const summary = evidenceSummary?.summary ?? {};

  const incidentCount: number = (summary as any).incidentCount ?? 0;
  const safeguardingSignalCount: number = (summary as any).safeguardingSignalCount ?? 0;
  const sessionsBlockedCount: number = (summary as any).sessionsBlockedCount ?? 0;
  const supportNeededCount: number = (summary as any).supportNeededCount ?? 0;
  const pauseCount: number = (summary as any).pauseCount ?? 0;
  const rollbackCount: number = (summary as any).rollbackCount ?? 0;

  const safeLearningQualitySignals: Record<string, unknown> = (summary as any).safeLearningQualitySignals ?? {};
  const safeSocraticIntegritySignals: Record<string, unknown> = (summary as any).safeSocraticIntegritySignals ?? {};
  const safeContentGovernanceSignals: Record<string, unknown> = (summary as any).safeContentGovernanceSignals ?? {};
  const safeOperationsSignals: Record<string, unknown> = (summary as any).safeOperationsSignals ?? {};

  const blockingIssues: string[] = [];
  const riskReasons: string[] = [];
  const mitigations: string[] = [];
  const humanReviewReasonCodes: string[] = [];

  // 1. Learning quality risk
  let learningQualityRisk: RiskLevel = 'low';
  if (sessionsBlockedCount > 50) {
    learningQualityRisk = 'critical';
    blockingIssues.push('Critical learning quality risk: excessive session blocks.');
    riskReasons.push('learning_quality_critical');
    humanReviewReasonCodes.push('learning_quality_critical');
  } else if (sessionsBlockedCount > 20 || (safeLearningQualitySignals as any).learningRegression === true) {
    learningQualityRisk = 'high';
    riskReasons.push('learning_quality_high');
    humanReviewReasonCodes.push('learning_quality_high');
  } else if (sessionsBlockedCount > 5) {
    learningQualityRisk = 'medium';
    riskReasons.push('learning_quality_medium');
  }

  // 2. Socratic integrity risk
  let socraticIntegrityRisk: RiskLevel = 'low';
  const finalAnswerLeakCount: number = (safeSocraticIntegritySignals as any).finalAnswerLeakCount ?? 0;
  const hintLadderBreachCount: number = (safeSocraticIntegritySignals as any).hintLadderBreachCount ?? 0;
  const agencyReductionCount: number = (safeSocraticIntegritySignals as any).agencyReductionCount ?? 0;
  if (finalAnswerLeakCount > 0 || hintLadderBreachCount > 3) {
    socraticIntegrityRisk = 'critical';
    blockingIssues.push('Critical Socratic integrity risk: answer leakage or hint ladder breach.');
    riskReasons.push('socratic_integrity_critical');
    humanReviewReasonCodes.push('socratic_integrity_critical');
  } else if (hintLadderBreachCount > 0 || agencyReductionCount > 5) {
    socraticIntegrityRisk = 'high';
    riskReasons.push('socratic_integrity_high');
    humanReviewReasonCodes.push('socratic_integrity_high');
  } else if (agencyReductionCount > 0) {
    socraticIntegrityRisk = 'medium';
    riskReasons.push('socratic_integrity_medium');
  }

  // 3. Academic integrity risk
  let academicIntegrityRisk: RiskLevel = 'low';
  const answerKeyLeakCount: number = (safeContentGovernanceSignals as any).answerKeyLeakCount ?? 0;
  const homeworkShortcutCount: number = (safeContentGovernanceSignals as any).homeworkShortcutCount ?? 0;
  if (answerKeyLeakCount > 0) {
    academicIntegrityRisk = 'critical';
    blockingIssues.push('Critical academic integrity risk: answer key leakage detected.');
    riskReasons.push('academic_integrity_critical');
    humanReviewReasonCodes.push('academic_integrity_critical');
  } else if (homeworkShortcutCount > 0) {
    academicIntegrityRisk = 'high';
    riskReasons.push('academic_integrity_high');
    humanReviewReasonCodes.push('academic_integrity_high');
  }

  // 4. Privacy risk
  let privacyRisk: RiskLevel = 'low';
  const privacyBreachCount: number = (safeContentGovernanceSignals as any).privacyBreachCount ?? 0;
  const privacyFlagCount: number = (safeContentGovernanceSignals as any).privacyFlagCount ?? 0;
  if (privacyBreachCount > 0) {
    privacyRisk = 'critical';
    blockingIssues.push('Critical privacy risk: privacy breach detected.');
    riskReasons.push('privacy_critical');
    humanReviewReasonCodes.push('privacy_critical');
  } else if (privacyFlagCount > 3) {
    privacyRisk = 'high';
    riskReasons.push('privacy_high');
    humanReviewReasonCodes.push('privacy_high');
  } else if (privacyFlagCount > 0) {
    privacyRisk = 'medium';
    riskReasons.push('privacy_medium');
  }

  // 5. Safeguarding risk
  let safeguardingRisk: RiskLevel = 'low';
  if (safeguardingSignalCount > 0) {
    safeguardingRisk = 'critical';
    blockingIssues.push('Critical safeguarding risk: unresolved safeguarding signals.');
    riskReasons.push('safeguarding_critical');
    humanReviewReasonCodes.push('safeguarding_critical');
    mitigations.push('Full safeguarding review required before expansion.');
  }

  // 6. Deen/content risk
  let deenContentRisk: RiskLevel = 'low';
  const deenGateBlockCount: number = (safeContentGovernanceSignals as any).deenGateBlockCount ?? 0;
  if (deenGateBlockCount > 5) {
    deenContentRisk = 'critical';
    blockingIssues.push('Critical Deen content risk: excessive Deen gate blocks.');
    riskReasons.push('deen_content_critical');
    humanReviewReasonCodes.push('deen_content_critical');
  } else if (deenGateBlockCount > 0) {
    deenContentRisk = 'high';
    riskReasons.push('deen_content_high');
    humanReviewReasonCodes.push('deen_content_high');
  }

  // 7. Teacher workload risk
  let teacherWorkloadRisk: RiskLevel = 'low';
  if (supportNeededCount > 50) {
    teacherWorkloadRisk = 'high';
    riskReasons.push('teacher_workload_high');
    humanReviewReasonCodes.push('teacher_workload_high');
  } else if (supportNeededCount > 20) {
    teacherWorkloadRisk = 'medium';
    riskReasons.push('teacher_workload_medium');
  }

  // 8. Operations capacity risk
  let operationsCapacityRisk: RiskLevel = 'low';
  if (incidentCount > 10 || pauseCount > 5) {
    operationsCapacityRisk = 'high';
    riskReasons.push('operations_capacity_high');
    humanReviewReasonCodes.push('operations_capacity_high');
  } else if (incidentCount > 3 || pauseCount > 1) {
    operationsCapacityRisk = 'medium';
    riskReasons.push('operations_capacity_medium');
  }

  // 9. Rollback readiness risk
  let rollbackReadinessRisk: RiskLevel = 'low';
  if (rollbackCount > 2) {
    rollbackReadinessRisk = 'high';
    riskReasons.push('rollback_readiness_high');
    humanReviewReasonCodes.push('rollback_readiness_high');
  } else if (rollbackCount > 0) {
    rollbackReadinessRisk = 'medium';
    riskReasons.push('rollback_readiness_medium');
    mitigations.push('Verify rollback path before expansion.');
  }

  // 10. Student support risk
  let studentSupportRisk: RiskLevel = 'low';
  if (supportNeededCount > 40) {
    studentSupportRisk = 'high';
    riskReasons.push('student_support_high');
    humanReviewReasonCodes.push('student_support_high');
  } else if (supportNeededCount > 15) {
    studentSupportRisk = 'medium';
    riskReasons.push('student_support_medium');
  }

  const riskLevels: RiskLevel[] = [
    learningQualityRisk, socraticIntegrityRisk, academicIntegrityRisk,
    privacyRisk, safeguardingRisk, deenContentRisk,
    teacherWorkloadRisk, operationsCapacityRisk,
    rollbackReadinessRisk, studentSupportRisk,
  ];

  const severityOrder: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
  let overallRiskLevel: RiskLevel = 'low';
  for (const sev of severityOrder) {
    if (riskLevels.includes(sev)) {
      overallRiskLevel = sev;
      break;
    }
  }

  const requiresHumanReview = humanReviewReasonCodes.length > 0;

  if (overallRiskLevel === 'critical') {
    blockingIssues.push('Overall risk is critical. Expansion not approved.');
  }
  if (overallRiskLevel === 'high' && !humanReviewReasonCodes.includes('overall_high_risk')) {
    humanReviewReasonCodes.push('overall_high_risk_requires_human_review');
  }
  if (overallRiskLevel === 'medium' && mitigations.length === 0) {
    mitigations.push('Medium risk requires documented mitigation plan.');
  }
  if (overallRiskLevel === 'low' && mitigations.length === 0) {
    mitigations.push('Safe monitoring plan in place for low-risk expansion.');
  }

  const ok = overallRiskLevel !== 'critical';

  await govRepo.recordRiskAssessment(schoolId, proposalId, {
    overallRiskLevel,
    learningQualityRisk,
    socraticIntegrityRisk,
    academicIntegrityRisk,
    privacyRisk,
    safeguardingRisk,
    deenContentRisk,
    teacherWorkloadRisk,
    operationsCapacityRisk,
    rollbackReadinessRisk,
    studentSupportRisk,
    riskReasons,
    mitigations,
    requiresHumanReview,
    humanReviewReasonCodes,
    blockingIssues,
  });

  return {
    ok,
    overallRiskLevel,
    learningQualityRisk,
    socraticIntegrityRisk,
    academicIntegrityRisk,
    privacyRisk,
    safeguardingRisk,
    deenContentRisk,
    teacherWorkloadRisk,
    operationsCapacityRisk,
    rollbackReadinessRisk,
    studentSupportRisk,
    riskReasons,
    mitigations,
    requiresHumanReview,
    humanReviewReasonCodes,
    blockingIssues,
    safeMessage: `Risk assessment complete. Overall risk: ${overallRiskLevel}. Blocking issues: ${blockingIssues.length}.`,
  };
}
