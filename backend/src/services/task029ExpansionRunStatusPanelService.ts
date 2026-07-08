import type { Task029ExpansionRunOperationsStatus } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export async function getExpansionRunStatus(expansionRunId: string, schoolId: string): Promise<{
  ok: boolean;
  data: Task029ExpansionRunOperationsStatus | null;
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

  const data: Task029ExpansionRunOperationsStatus = {
    runId: run.id,
    schoolId: run.schoolId,
    status: run.status,
    currentStage: run.currentStage ?? 0,
    createdAt: run.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: run.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    startedAt: run.startedAt?.toISOString?.() ?? '',
    pausedAt: run.pausedAt?.toISOString?.() ?? '',
    rolledBackAt: run.rolledBackAt?.toISOString?.() ?? '',
    completedAt: run.completedAt?.toISOString?.() ?? '',
    safeSummary: run.safeSummary ?? '',
    pauseState: run.status?.includes('paused') ? 'paused' : 'not_paused',
    rollbackState: run.status === 'rolled_back' ? 'rolled_back' : run.status === 'rollback_requested' ? 'requested' : 'not_requested',
    killSwitchState: 'disabled',
    safeStatusReasonCodes: run.blockingIssues ?? [],
  };

  return { ok: true, data, blockingIssues: [] };
}
