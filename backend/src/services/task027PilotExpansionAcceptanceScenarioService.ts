import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { generateExpansionEvidencePack } from './task027PilotExpansionEvidencePackService';
import { assessExpansionRisk } from './task027PilotExpansionRiskAssessmentService';
import { submitExpansionReview } from './task027PilotExpansionReviewService';
import { decideExpansion } from './task027PilotExpansionDecisionService';
import { applyCohortExpansion } from './task027PilotExpansionCohortChangeService';

interface AcceptanceScenarioInput {
  schoolId?: string;
  pilotProgramId?: string;
}

interface AcceptanceScenarioResult {
  scenarioRun: boolean;
  scenarioMode: string;
  task026ProofMode: string;
  productionTask026ProofUsed: boolean;
  proposalCreated: boolean;
  proposalId?: string;
  evidencePackGenerated: boolean;
  evidencePackId?: string;
  riskAssessmentGenerated: boolean;
  riskAssessmentId?: string;
  requiredReviewsApproved: boolean;
  decisionServiceExecuted: boolean;
  decisionApproved: boolean;
  approvalId?: string;
  cohortChangePrepared: boolean;
  cohortChangeId?: string;
  safeToExpand: boolean;
  safeToStartTask028: boolean;
  blockingIssues: string[];
  rawPrivateDataUsed: boolean;
  liveProductionExpansionPerformed: boolean;
  cohortChangeMode: string;
  productionCohortMutated: boolean;
}

export async function runAcceptanceScenario(input?: AcceptanceScenarioInput): Promise<AcceptanceScenarioResult> {
  const schoolId = input?.schoolId ?? 'school_task027_acceptance_safe';
  const pilotProgramId = input?.pilotProgramId ?? 'pilot_task027_acceptance_safe';

  const result: AcceptanceScenarioResult = {
    scenarioRun: true,
    scenarioMode: 'safe_synthetic_acceptance_fixture',
    task026ProofMode: 'synthetic_safe_fixture_for_task027_acceptance',
    productionTask026ProofUsed: false,
    proposalCreated: false,
    evidencePackGenerated: false,
    riskAssessmentGenerated: false,
    requiredReviewsApproved: false,
    decisionServiceExecuted: false,
    decisionApproved: false,
    cohortChangePrepared: false,
    safeToExpand: false,
    safeToStartTask028: false,
    blockingIssues: [],
    rawPrivateDataUsed: false,
    liveProductionExpansionPerformed: false,
    cohortChangeMode: 'synthetic_safe_preparation',
    productionCohortMutated: false,
  };

  try {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId,
      name: 'Safe Acceptance Scenario Pilot',
      scopeSummarySafe: 'Safe synthetic acceptance scenario for Task 027',
      allowedRoles: ['student', 'teacher'],
      allowedSubjects: ['math'],
      allowedCurriculumTracks: ['approved_curriculum_track_safe'],
      createdByRole: 'admin',
      approvalStatus: 'approved',
    });
    const prog = program as any;
    const actualPilotProgramId = prog.id;
    await task025PilotRepository.updatePilotProgramStatus(actualPilotProgramId, 'active', 'admin');

    await task025PilotRepository.addParticipant({
      pilotProgramId: actualPilotProgramId,
      schoolId,
      actorIdHash: 'student_safe_001',
      role: 'student',
      eligibilityStatus: 'eligible',
    });

    await task025PilotRepository.createCohort({
      pilotProgramId: actualPilotProgramId,
      schoolId,
      name: 'Cohort Safe Alpha',
      status: 'active',
    });

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: actualPilotProgramId,
      schoolId,
      status: 'completed',
      safeSummary: 'Safe synthetic execution for Task 027 acceptance',
      allowedCohortIds: ['cohort_safe_001'],
    });
    const executionRunId = (run as any).id;

    await task026PilotExecutionRepository.createPostPilotReview({
      executionRunId,
      pilotProgramId: actualPilotProgramId,
      schoolId,
      status: 'generated',
      safeSummary: 'Safe synthetic post-pilot review confirms controlled expansion may be evaluated.',
      learningQualitySummary: { sessionsCompleted: 10, avgEngagement: 0.85 },
      safetySummary: { criticalSignals: 0, highSignals: 0 },
      privacySummary: { privacySignals: 0 },
      deenSummary: { deenSignals: 0 },
      operationsSummary: { errors: 0, p95LatencyMs: 450 },
      feedbackSummary: { total: 5, positiveRate: 0.9 },
      recommendedDecision: 'expand_cautiously',
      safeToStartNextTask: true,
      blockingIssues: [],
    });

    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: actualPilotProgramId,
      schoolId,
      status: 'review_required',
      proposalName: 'Safe Task 027 Acceptance Expansion Fixture',
      safeSummary: 'Safe synthetic proposal for Task 027 acceptance scenario. All fixture data.',
      requestedStudentIncrease: 5,
      requestedTeacherIncrease: 1,
      requestedClassIds: ['class_safe_001'],
      requestedSubjectIds: ['subject_safe_math_001'],
      requestedCurriculumScopes: ['approved_curriculum_scope_safe_001'],
      requestedYearGroups: ['year_safe_001'],
      createdByRole: 'admin',
      blockingIssues: [],
      warnings: [],
    });
    const proposalObj = proposal as any;
    const proposalId = proposalObj.id;
    result.proposalCreated = true;
    result.proposalId = proposalId;

    const epResult = await generateExpansionEvidencePack(proposalId);
    result.evidencePackGenerated = epResult.ok;
    result.evidencePackId = epResult.evidencePackId;
    if (epResult.blockingIssues.length > 0) {
      result.blockingIssues.push(...epResult.blockingIssues.map((b: string) => `evidence_pack: ${b}`));
    }

    const raResult = await assessExpansionRisk(proposalId);
    result.riskAssessmentGenerated = raResult.ok;
    result.riskAssessmentId = raResult.riskAssessmentId;
    if (raResult.blockingIssues.length > 0) {
      result.blockingIssues.push(...raResult.blockingIssues.map((b: string) => `risk_assessment: ${b}`));
    }

    const requiredTypes = [
      'teacher_learning_quality', 'admin_operations', 'privacy',
      'deen_governance', 'socratic_quality', 'curriculum_source_coverage',
      'rollback_readiness',
    ];

    let allReviewsApproved = true;
    for (const rt of requiredTypes) {
      const revResult = await submitExpansionReview({
        expansionProposalId: proposalId,
        schoolId,
        reviewType: rt as any,
        reviewerRole: 'admin',
        safeSummary: `Safe review: ${rt} confirms readiness for controlled expansion.`,
        blockingIssues: [],
        warnings: [],
        evidenceRefs: ['evidence_safe_synthetic'],
      });
      if (revResult.reviewStatus !== 'approved') {
        allReviewsApproved = false;
        result.blockingIssues.push(`review_${rt}: status ${revResult.reviewStatus}`);
      }
    }
    result.requiredReviewsApproved = allReviewsApproved;

    const decResult = await decideExpansion(proposalId, 'admin', 'admin_hash_safe_001');
    result.decisionServiceExecuted = decResult.ok;
    result.decisionApproved = decResult.safeToExpand;
    result.approvalId = decResult.approvalId;
    result.safeToExpand = decResult.safeToExpand;
    result.safeToStartTask028 = decResult.safeToStartTask028;
    if (decResult.blockingIssues.length > 0) {
      result.blockingIssues.push(...decResult.blockingIssues.map((b: string) => `decision: ${b}`));
    }

    if (decResult.safeToExpand) {
      const ccResult = await applyCohortExpansion(proposalId, 'admin', 'admin_hash_safe_001');
      result.cohortChangePrepared = ccResult.ok;
      result.cohortChangeId = ccResult.cohortChangeId;
      if (ccResult.blockingIssues.length > 0) {
        result.blockingIssues.push(...ccResult.blockingIssues.map((b: string) => `cohort_change: ${b}`));
      }
    }
  } catch (err: any) {
    result.blockingIssues.push(`acceptance_scenario_error: ${err.message || 'unknown error'}`);
  }

  result.safeToExpand = result.blockingIssues.length === 0 && result.decisionApproved;
  result.safeToStartTask028 = result.safeToExpand;
  if (!result.safeToStartTask028) {
    result.safeToStartTask028 = false;
  }

  return result;
}
