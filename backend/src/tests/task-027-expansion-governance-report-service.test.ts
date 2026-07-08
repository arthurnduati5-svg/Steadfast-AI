import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateGovernanceReport } from '../services/task027ExpansionGovernanceReportService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const SCHOOL_ID = 'test-school-report';
const PILOT_RUN_ID = 'test-pilot-report';

describe('task027ExpansionGovernanceReportService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  afterEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('generates report with all required fields', async () => {
    const report = await generateGovernanceReport(SCHOOL_ID, PILOT_RUN_ID);

    expect(report).toHaveProperty('taskId');
    expect(report).toHaveProperty('scope');
    expect(report).toHaveProperty('schoolId');
    expect(report).toHaveProperty('pilotRunId');
    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('governanceDecision');
    expect(report).toHaveProperty('evidencePack');
    expect(report).toHaveProperty('diagnostics');
    expect(report).toHaveProperty('safeSummary');
    expect(report).toHaveProperty('safeToStartTask028');
    expect(report).toHaveProperty('safeToStartTask029');
    expect(report).toHaveProperty('safeToStartTask040');

    expect(report.taskId).toBe('task027');
    expect(report.scope).toBe('Pilot Expansion Governance');
    expect(report.schoolId).toBe(SCHOOL_ID);
    expect(report.pilotRunId).toBe(PILOT_RUN_ID);
    expect(typeof report.generatedAt).toBe('string');
  });

  it('report includes governance decision', async () => {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 30,
      proposedScopeLabels: ['class_1'],
      proposedClassOrGradeIds: ['grade-5'],
      teacherOwnerSafeRefs: ['teacher-1'],
      supportOwnerSafeRefs: ['support-1'],
      curriculumSourceScopeIds: ['curr-1'],
      startReadinessWindow: '2026-09-01',
      rollbackReadinessPath: '/rollback/path',
    });

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    const reviewTypes = [
      'learning_quality', 'cohort_eligibility', 'teacher_review',
      'admin_approval', 'parent_learner_feedback', 'safeguarding',
      'deen_content', 'privacy', 'socratic_integrity',
      'academic_integrity', 'operations_health_budget', 'pause_rollback_readiness',
    ];
    for (const rt of reviewTypes) {
      await govRepo.recordReviewResult(SCHOOL_ID, proposal.id, rt, {
        reviewStatus: 'passed',
        blockingIssues: [],
      });
    }

    const report = await generateGovernanceReport(SCHOOL_ID, PILOT_RUN_ID);

    expect(report.governanceDecision).toBeDefined();
    expect(report.governanceDecision.decision).toBeDefined();
    expect(typeof report.governanceDecision.decision).toBe('string');

    report.governanceDecision.decision === 'approved_for_task028'
      ? expect(report.safeToStartTask028).toBe(true)
      : expect(report.safeToStartTask028).toBe(false);
  });

  it('report includes diagnostics', async () => {
    const report = await generateGovernanceReport(SCHOOL_ID, PILOT_RUN_ID);

    expect(report.diagnostics).toBeDefined();
    expect(report.diagnostics.governanceStarted).toBe(false);
    expect(report.diagnostics.currentDecision).toBe('no_decision');
    expect(report.diagnostics.gateStatuses).toBeDefined();
    expect(Object.keys(report.diagnostics.gateStatuses).length).toBeGreaterThan(0);
  });

  it('report includes safe summary', async () => {
    const report = await generateGovernanceReport(SCHOOL_ID, PILOT_RUN_ID);

    expect(report.safeSummary).toBeTruthy();
    expect(typeof report.safeSummary).toBe('string');
    expect(report.safeSummary).toContain(SCHOOL_ID);
    expect(report.safeSummary).toContain(PILOT_RUN_ID);
    expect(report.safeSummary).toContain('safeToStartTask028');
  });

  it('report has safeToStartTask029 and safeToStartTask040 always false', async () => {
    const report = await generateGovernanceReport(SCHOOL_ID, PILOT_RUN_ID);

    expect(report.safeToStartTask029).toBe(false);
    expect(report.safeToStartTask040).toBe(false);
  });
});
