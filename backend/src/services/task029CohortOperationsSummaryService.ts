import type { Task029CohortOperationsSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export async function getCohortOperationsSummary(expansionRunId: string, schoolId: string): Promise<{
  ok: boolean;
  data: Task029CohortOperationsSummary | null;
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

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(expansionRunId);

  const data: Task029CohortOperationsSummary = {
    approvedCohortCount: participants.filter(p => p.activationStatus === 'active' || p.activationStatus === 'pending').length,
    approvedLearnerSafeCount: participants.filter(p => p.role === 'student' && (p.activationStatus === 'active' || p.activationStatus === 'pending')).length,
    activeLearnerSafeCount: participants.filter(p => p.role === 'student' && p.activationStatus === 'active').length,
    blockedLearnerSafeCount: participants.filter(p => p.role === 'student' && p.activationStatus === 'blocked').length,
    rolledBackLearnerSafeCount: participants.filter(p => p.role === 'student' && p.activationStatus === 'rolled_back').length,
    teacherSafeCount: participants.filter(p => p.role === 'teacher').length,
    supportOwnerSafeCount: participants.filter(p => p.role === 'support_owner' || p.role === 'admin').length,
    outOfScopeAccessDeniedCount: participants.filter(p => p.activationStatus === 'blocked').length,
    crossSchoolDeniedCount: 0,
  };

  return { ok: true, data, blockingIssues: [] };
}
