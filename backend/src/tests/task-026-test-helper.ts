import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

export async function setupPilotTestEnvironment(opts?: {
  allowedSubjects?: string[];
  allowedCurriculumTracks?: string[];
}) {
  task025PilotRepository._clearMemory();
  task026PilotExecutionRepository._clearMemory();
  process.env.NODE_ENV = 'test';
  delete process.env.TASK026_REQUIRE_REAL_PRISMA;

  const program = await task025PilotRepository.createPilotProgram({
    schoolId: 'school-1',
    name: 'Test Pilot',
    scopeSummarySafe: 'Test pilot scope',
    allowedRoles: ['student', 'teacher'],
    allowedSubjects: opts?.allowedSubjects ?? ['Math'],
    allowedCurriculumTracks: opts?.allowedCurriculumTracks ?? ['National'],
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
    status: 'active',
    safeSummary: 'Active test execution',
    allowedCohortIds: ['cohort-1'],
  });
  const executionRunId = (run as any).id;

  return { pilotProgramId, executionRunId };
}
