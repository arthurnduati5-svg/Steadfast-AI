import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { generateExpansionReport } from '../services/task027PilotExpansionReportService';
import { decideExpansion } from '../services/task027PilotExpansionDecisionService';
import { submitExpansionReview } from '../services/task027PilotExpansionReviewService';
import { generateExpansionEvidencePack } from '../services/task027PilotExpansionEvidencePackService';
import { assessExpansionRisk } from '../services/task027PilotExpansionRiskAssessmentService';
import { runAcceptanceScenario } from '../services/task027PilotExpansionAcceptanceScenarioService';

describe('Task 027 Report safeToStartTask028 Propagation', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK027_REQUIRE_REAL_PRISMA;
  });

  it('should never return safeToStartTask028 undefined from report service', async () => {
    const result = await generateExpansionReport('027');
    expect(typeof result.safeToStartTask028).toBe('boolean');
  });

  it('should return safeToStartTask028 false when no proposal exists', async () => {
    const result = await generateExpansionReport('027');
    expect(result.safeToStartTask028).toBe(false);
    expect(result.blockingIssues).toContain('expansion_proposal_missing');
  });

  it('should return safeToStartTask028 false when evidence pack missing', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-safe-1', name: 'Test', scopeSummarySafe: 'test',
      allowedRoles: ['student'], allowedSubjects: ['Math'], allowedCurriculumTracks: ['National'],
      createdByRole: 'admin', approvalStatus: 'approved',
    });
    const pilotProgramId = (program as any).id;
    await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId, schoolId: 'school-safe-1', status: 'completed',
      safeSummary: 'test', allowedCohortIds: ['cohort-1'],
    });
    await task027PilotExpansionRepository.createProposal({
      pilotProgramId, schoolId: 'school-safe-1',
      proposalName: 'Test', safeSummary: 'test',
      createdByRole: 'admin',
    });
    const result = await generateExpansionReport('027');
    expect(typeof result.safeToStartTask028).toBe('boolean');
    expect(result.safeToStartTask028).toBe(false);
  });

  it('should return safeToStartTask028 false when risk assessment missing', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-safe-1', name: 'Test', scopeSummarySafe: 'test',
      allowedRoles: ['student'], allowedSubjects: ['Math'], allowedCurriculumTracks: ['National'],
      createdByRole: 'admin', approvalStatus: 'approved',
    });
    const pilotProgramId = (program as any).id;
    await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId, schoolId: 'school-safe-1', status: 'completed',
      safeSummary: 'test', allowedCohortIds: ['cohort-1'],
    });
    const prop = await task027PilotExpansionRepository.createProposal({
      pilotProgramId, schoolId: 'school-safe-1',
      proposalName: 'Test', safeSummary: 'test',
      createdByRole: 'admin',
    });
    const proposalId = (prop as any).id;
    await generateExpansionEvidencePack(proposalId);
    // No risk assessment
    const result = await generateExpansionReport('027');
    expect(typeof result.safeToStartTask028).toBe('boolean');
    expect(result.safeToStartTask028).toBe(false);
  });

  it('should return safeToStartTask028 false when decision is rejected', async () => {
    const result = await decideExpansion('nonexistent', 'admin');
    expect(typeof result.safeToStartTask028).toBe('boolean');
    expect(result.safeToStartTask028).toBe(false);
  });

  it('should return safeToStartTask028 true when full acceptance scenario passes', async () => {
    const scenario = await runAcceptanceScenario();
    expect(scenario.safeToStartTask028).toBe(true);
    const reportResult = await generateExpansionReport('027');
    expect(typeof reportResult.safeToStartTask028).toBe('boolean');
    expect(reportResult.safeToStartTask028).toBe(true);
  });

  it('should compute safeToStartTask028 from acceptance scenario and report service', async () => {
    const scenario = await runAcceptanceScenario();
    expect(scenario.proposalCreated).toBe(true);
    expect(scenario.evidencePackGenerated).toBe(true);
    expect(scenario.riskAssessmentGenerated).toBe(true);
    expect(scenario.requiredReviewsApproved).toBe(true);
    expect(scenario.decisionServiceExecuted).toBe(true);
    expect(scenario.decisionApproved).toBe(true);
    expect(scenario.cohortChangePrepared).toBe(true);
    expect(scenario.safeToExpand).toBe(true);
    expect(scenario.safeToStartTask028).toBe(true);
    expect(scenario.blockingIssues).toHaveLength(0);

    const reportResult = await generateExpansionReport('027');
    expect(reportResult.safeToStartTask028).toBe(true);
    expect(reportResult.blockingIssues).toHaveLength(0);
  });
});
