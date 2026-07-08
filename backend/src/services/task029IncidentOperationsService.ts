import type { Task029IncidentOperationsInput, Task029IncidentOperationsSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getIncidentOperations(
  input: Task029IncidentOperationsInput,
): Promise<{ ok: boolean; data: Task029IncidentOperationsSummary[] | null; blockingIssues: string[] }> {
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

  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(input.expansionRunId);

  const data: Task029IncidentOperationsSummary[] = [];

  for (const item of oversightItems) {
    const o = item as any;

    if (o.severity !== 'critical' && o.severity !== 'high' && o.severity !== 'medium') continue;

    const safeCategory =
      o.itemType === 'safeguarding' ? 'safeguarding' :
      o.itemType === 'privacy' ? 'privacy' :
      o.itemType === 'content_governance' ? 'content_governance' :
      o.itemType === 'curriculum' ? 'curriculum' : 'operations';

    const recommendedControlAction =
      o.requiresPause ? 'pause_expansion' :
      o.requiresRollback ? 'request_rollback' : 'review';

    data.push({
      incidentId: o.id,
      severity: o.severity,
      status: o.status,
      safeCategory,
      recommendedControlAction,
      requiresSafeguardingReview: o.itemType === 'safeguarding',
      requiresPrivacyReview: o.itemType === 'privacy',
      requiresAdminReview: o.requiresAdminReview ?? false,
      requiresRollbackReview: o.requiresRollback ?? false,
      createdAt: o.createdAt?.toISOString?.() ?? String(o.createdAt),
      safeSummary: o.safeSummary ?? 'Incident requires review.',
    });
  }

  for (const item of data) {
    await task029ExpansionOperationsRepository.recordIncidentOperationsView(item);
  }

  return { ok: true, data, blockingIssues: [] };
}
