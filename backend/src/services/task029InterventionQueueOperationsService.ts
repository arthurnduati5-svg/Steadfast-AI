import type { Task029InterventionQueueOperationsInput, Task029InterventionQueueOperationsSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getInterventionQueueOperations(
  input: Task029InterventionQueueOperationsInput,
): Promise<{ ok: boolean; data: Task029InterventionQueueOperationsSummary[] | null; blockingIssues: string[] }> {
  const blockingIssues: string[] = [];

  const run = await task028ExpansionExecutionRepository.getExecutionRun(input.expansionRunId);
  if (!run) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  const runAny = run as any;
  if (runAny.schoolId !== input.schoolId) {
    blockingIssues.push('cross_school_access_denied');
    return { ok: false, data: null, blockingIssues };
  }

  const interventions = await task028ExpansionExecutionRepository.listInterventionRecords(input.expansionRunId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(input.expansionRunId);

  const data: Task029InterventionQueueOperationsSummary[] = [];

  for (const item of oversightItems) {
    const o = item as any;
    data.push({
      queueItemId: o.id,
      reasonCode: o.reasonCodes?.[0] ?? 'oversight',
      status: o.status,
      severity: o.severity,
      assignedRole: o.assignedRole ?? '',
      createdAt: o.createdAt?.toISOString?.() ?? String(o.createdAt),
      updatedAt: o.updatedAt?.toISOString?.() ?? String(o.updatedAt),
      requiresTeacherReview: o.requiresTeacherReview ?? false,
      requiresAdminReview: o.requiresAdminReview ?? false,
      requiresPrivacyReview: o.requiresPrivacyReview ?? false,
      requiresSafeguardingReview: o.itemType === 'safeguarding',
      requiresContentReview: o.itemType === 'content_governance',
      requiresDeenReview: o.requiresDeenReview ?? false,
      requiresSocraticReview: o.requiresSocraticReview ?? false,
      recommendedControlAction: o.requiresPause ? 'pause_expansion' : o.requiresRollback ? 'request_rollback' : 'review',
      safeSummary: o.safeSummary ?? 'Open oversight item.',
    });
  }

  for (const item of interventions) {
    const inv = item as any;
    data.push({
      queueItemId: inv.id,
      reasonCode: inv.reasonCodes?.[0] ?? 'intervention',
      status: inv.status,
      severity: 'medium',
      assignedRole: '',
      createdAt: inv.createdAt?.toISOString?.() ?? String(inv.createdAt),
      updatedAt: inv.updatedAt?.toISOString?.() ?? String(inv.updatedAt),
      requiresTeacherReview: false,
      requiresAdminReview: true,
      requiresPrivacyReview: false,
      requiresSafeguardingReview: false,
      requiresContentReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      recommendedControlAction: inv.interventionType === 'pause_execution' ? 'pause_expansion' : 'review',
      safeSummary: inv.safeSummary ?? 'Intervention record.',
    });
  }

  for (const item of data) {
    await task029ExpansionOperationsRepository.recordInterventionOperationsView(item);
  }

  return { ok: true, data, blockingIssues: [] };
}
