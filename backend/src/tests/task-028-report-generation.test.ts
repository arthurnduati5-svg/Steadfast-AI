import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { generateExecutionReport } from '../services/task028ExpansionExecutionReportService';

describe('Task 028 Report Generation', () => {
  const SCHOOL_ID = 'report_gen_school';
  const PILOT_ID = 'pilot_report_gen';

  let RUN_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_report_gen',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'completed',
      safeSummary: 'Report generation test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: ['class_a'], subjectIds: ['math'] },
    });
    RUN_ID = (run as any).id;

    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_report_gen',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'completed',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: ['class_a'],
      allowedSubjectIds: ['math'],
      allowedCurriculumScopes: ['scope_a'],
      safeSummary: 'Report gen test stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student_report_hash',
      role: 'student',
      classId: 'class_a',
      subjectIds: ['math'],
      curriculumScopes: ['scope_a'],
      activationStatus: 'active',
    });

    await task028ExpansionExecutionRepository.createHealthSnapshot({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      activeExpandedSessions: 2,
      allowedExpandedSessionStarts: 3,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 0,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 1,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Health snapshot for report test',
    });

    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      itemType: 'teacher_review_needed',
      severity: 'low',
      source: 'test',
      safeSummary: 'Sample oversight item for report',
      requiresTeacherReview: true,
      requiresAdminReview: false,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });

    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'admin',
      action: 'rollback_executed',
      safeSummary: 'Rollback executed during test',
    });

    await task028ExpansionExecutionRepository.createCompletionReview({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'generated',
      safeSummary: 'Completion review for report test',
      learningQualitySummary: { sessionsCompleted: 2, avgEngagement: 0.85 },
      safetySummary: { criticalSignals: 0, highSignals: 0 },
      privacySummary: { privacySignals: 0 },
      deenSummary: { deenSignals: 0 },
      socraticSummary: { socraticQualityScore: 0.9 },
      curriculumSummary: { curriculumCoverage: 1.0 },
      operationsSummary: { errors: 0, p95LatencyMs: 300 },
      teacherAdminSummary: { teacherReviewsCompleted: 1 },
      rollbackSummary: { rollbackCount: 1, rollbackPathProven: true },
      recommendedDecision: 'ready_for_larger_school_rollout',
      safeToStartNextTask: true,
      blockingIssues: [],
      knownLimitations: [],
      artifactPaths: ['docs/ops/task-028/task-028-expansion-execution-report.json'],
    });
  });

  it('should generate execution report through repository', async () => {
    const report = await task028ExpansionExecutionRepository.createExecutionReport({
      executionRunId: RUN_ID,
      schoolId: SCHOOL_ID,
      taskId: '028',
      taskName: 'Expansion Execution',
      status: 'generated',
      safeToStartNextTask: true,
      safeSummary: 'Test report for generation validation',
      executionSummary: { executionRunId: RUN_ID, status: 'completed' },
      stageSummary: { stageOneStatus: 'completed' },
      runtimeGateSummary: { allowedInScope: 1, blocked: 0 },
      monitoringSummary: { healthSnapshots: 1 },
      oversightSummary: { totalItems: 1 },
      rollbackSummary: { hasRolledBack: true },
      completionReviewSummary: { reviewGenerated: true },
      blockingIssues: [],
      knownLimitations: [],
      artifactPaths: ['docs/ops/task-028/task-028-expansion-execution-report.json'],
    });
    expect((report as any).id).toBeTruthy();
    expect((report as any).taskId).toBe('028');
    expect((report as any).status).toBe('generated');
  });

  it('should generate execution report through service', async () => {
    const result = await generateExecutionReport(RUN_ID);
    expect(result.ok).toBe(true);
    expect(result.reportId).toBeTruthy();
  });

  it('should return safeToStartTask029 true when all gates pass', async () => {
    const result = await generateExecutionReport(RUN_ID);
    expect(result.ok).toBe(true);
    expect(result.safeToStartTask029).toBe(true);
  });

  it('should include expected fields in generated report', async () => {
    const result = await generateExecutionReport(RUN_ID);
    expect(result.reportId).toBeTruthy();
    expect(typeof result.safeToStartTask029).toBe('boolean');
    expect(Array.isArray(result.blockingIssues)).toBe(true);
    expect(typeof result.safeMessage).toBe('string');
  });

  it('should return no blocking issues when report generation finds none', async () => {
    const result = await generateExecutionReport(RUN_ID);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should fetch persisted report by id', async () => {
    const created = await task028ExpansionExecutionRepository.createExecutionReport({
      executionRunId: RUN_ID,
      schoolId: SCHOOL_ID,
      taskId: '028',
      taskName: 'Expansion Execution',
      status: 'generated',
      safeToStartNextTask: true,
      safeSummary: 'Fetch test report',
    });
    const fetched = await task028ExpansionExecutionRepository.getExecutionReport((created as any).id);
    expect(fetched).toBeTruthy();
    expect((fetched as any).id).toBe((created as any).id);
  });

  it('should return null for non-existent report id', async () => {
    const fetched = await task028ExpansionExecutionRepository.getExecutionReport('non_existent_report_id');
    expect(fetched).toBeNull();
  });
});
