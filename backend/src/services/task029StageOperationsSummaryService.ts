import type { Task029StageOperationsSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export async function getStageOperationsSummary(expansionRunId: string, schoolId: string): Promise<{
  ok: boolean;
  data: Task029StageOperationsSummary[] | null;
  blockingIssues: string[];
}> {
  const blockingIssues: string[] = [];

  if (!expansionRunId || !expansionRunId.trim()) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  if (!schoolId || !schoolId.trim()) {
    blockingIssues.push('school_context_missing');
    return { ok: false, data: null, blockingIssues };
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(expansionRunId);

  if (!run) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  if (run.schoolId !== schoolId) {
    blockingIssues.push('cross_school_access_denied');
    return { ok: false, data: null, blockingIssues };
  }

  const stages = await task028ExpansionExecutionRepository.listStagesByRun(expansionRunId);

  const data: Task029StageOperationsSummary[] = stages.map(s => ({
    stageId: s.id,
    stageNumber: s.stageNumber,
    status: s.status,
    plannedSafeLearnerCount: s.plannedStudentCount ?? 0,
    activeSafeLearnerCount: s.activatedStudentCount ?? 0,
    blockedSafeLearnerCount: 0,
    safeSubjectScopeCount: s.allowedSubjectIds?.length ?? 0,
    safeCurriculumScopeCount: s.allowedCurriculumScopes?.length ?? 0,
    startedAt: s.startedAt?.toISO?.() ?? '',
    pausedAt: s.pausedAt?.toISO?.() ?? '',
    completedAt: s.completedAt?.toISO?.() ?? '',
    safeSummary: s.safeSummary ?? '',
  }));

  return { ok: true, data, blockingIssues: [] };
}
