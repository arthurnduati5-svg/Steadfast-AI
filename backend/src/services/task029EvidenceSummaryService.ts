import type { Task029EvidenceSummaryInput, Task029EvidenceSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getEvidenceSummary(input: Task029EvidenceSummaryInput): Promise<{
  ok: boolean;
  data: Task029EvidenceSummary | null;
  blockingIssues: string[];
}> {
  const blockingIssues: string[] = [];

  if (!input.schoolId || !input.actorId || !input.actorRole || !input.expansionRunId) {
    blockingIssues.push('missing_required_input_fields');
    return { ok: false, data: null, blockingIssues };
  }

  const existing = await task029ExpansionOperationsRepository.listEvidenceSummaryViews(input.expansionRunId);
  const latest = existing.length > 0 ? existing[existing.length - 1] : null;

  if (latest) {
    return { ok: true, data: latest, blockingIssues: [] };
  }

  const data: Task029EvidenceSummary = {
    evidenceEventCount: 0,
    accessAllowedCount: 0,
    accessDeniedCount: 0,
    interventionCount: 0,
    incidentCount: 0,
    rollbackCount: 0,
    teacherOversightCount: 0,
    safeLatestEventAt: new Date().toISOString(),
    safeEvidenceCategories: [],
  };

  await task029ExpansionOperationsRepository.recordEvidenceSummaryView(data);

  return { ok: true, data, blockingIssues: [] };
}
