import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

export async function setupExpansionTestEnvironment() {
  task025PilotRepository._clearMemory();
  task026PilotExecutionRepository._clearMemory();
  task027PilotExpansionRepository._clearMemory();
  process.env.NODE_ENV = 'test';
  delete process.env.TASK027_REQUIRE_REAL_PRISMA;

  const program = await task025PilotRepository.createPilotProgram({
    schoolId: 'school-1',
    name: 'Expansion Test Pilot',
    scopeSummarySafe: 'Test pilot scope',
    allowedRoles: ['student', 'teacher'],
    allowedSubjects: ['Math', 'Science'],
    allowedCurriculumTracks: ['National'],
    createdByRole: 'admin',
    approvalStatus: 'approved',
  });
  const pilotProgramId = (program as any).id;
  await task025PilotRepository.updatePilotProgramStatus(pilotProgramId, 'active', 'admin');

  await task025PilotRepository.addParticipant({
    pilotProgramId,
    schoolId: 'school-1',
    actorIdHash: 'student-1',
    role: 'student',
    eligibilityStatus: 'eligible',
  });
  await task025PilotRepository.addParticipant({
    pilotProgramId,
    schoolId: 'school-1',
    actorIdHash: 'teacher-1',
    role: 'teacher',
    eligibilityStatus: 'eligible',
  });

  await task025PilotRepository.createCohort({
    pilotProgramId,
    schoolId: 'school-1',
    name: 'Cohort A',
    status: 'active',
  });

  await task025PilotRepository.writeDryRun({
    pilotProgramId,
    schoolId: 'school-1',
    scenarioName: 'Test dry run',
    status: 'passed',
    safeSummary: 'Test dry run passed',
    checksPassed: ['all'],
    checksFailed: [],
  });

  const run = await task026PilotExecutionRepository.createExecutionRun({
    pilotProgramId,
    schoolId: 'school-1',
    status: 'completed',
    safeSummary: 'Completed test execution',
    allowedCohortIds: ['cohort-1'],
  });
  const executionRunId = (run as any).id;

  await task026PilotExecutionRepository.createPostPilotReview({
    executionRunId,
    pilotProgramId,
    schoolId: 'school-1',
    status: 'generated',
    safeSummary: 'Post-pilot review for expansion test',
    learningQualitySummary: { sessionsCompleted: 10 },
    safetySummary: { criticalSignals: 0 },
    privacySummary: { privacySignals: 0 },
    deenSummary: { deenSignals: 0 },
    operationsSummary: { errors: 0 },
    feedbackSummary: { total: 5 },
    recommendedDecision: 'expand_cautiously',
    safeToStartNextTask: true,
    blockingIssues: [],
  });

  const proposal = await task027PilotExpansionRepository.createProposal({
    pilotProgramId,
    schoolId: 'school-1',
    status: 'draft',
    proposalName: 'Test expansion to Cohort B',
    safeSummary: 'Proposal to expand pilot to additional cohort',
    requestedStudentIncrease: 10,
    requestedTeacherIncrease: 2,
    requestedClassIds: ['class-2', 'class-3'],
    requestedSubjectIds: ['subject-2'],
    requestedCurriculumScopes: ['National'],
    requestedYearGroups: ['Year 10'],
    createdByRole: 'admin',
    createdByActorIdHash: 'admin-1',
  });
  const proposalId = (proposal as any).id;

  return { pilotProgramId, executionRunId, proposalId };
}
