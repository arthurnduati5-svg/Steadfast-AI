import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { EXPANSION_OVERSIGHT_ITEM_TYPES } from '../contracts/task028ExpansionExecutionContracts';
import type { ExpansionOversightItemInput, ExpansionOversightSeverity } from '../contracts/task028ExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ExpansionExecutionContracts';

export interface OversightQueueResult {
  ok: boolean;
  itemId?: string;
  reasonCodes: string[];
  safeMessage: string;
}

export async function createOversightItem(
  input: ExpansionOversightItemInput,
): Promise<OversightQueueResult> {
  if (!input.executionRunId || !input.pilotProgramId || !input.schoolId) {
    return { ok: false, reasonCodes: ['missing_required_fields'], safeMessage: 'executionRunId, pilotProgramId, and schoolId are required.' };
  }

  if (input.itemType === 'rollback_recommendation' && input.severity !== 'critical') {
    return { ok: false, reasonCodes: ['rollback_recommendation_must_be_critical'], safeMessage: 'Rollback recommendation requires critical severity.' };
  }

  const safeSummary = (input.safeSummary || 'No summary provided').substring(0, 2000);

  const needsPause = input.requiresPause || ['critical_safety_signal', 'rollback_recommendation'].includes(input.itemType);
  const needsRollback = input.requiresRollback || input.itemType === 'rollback_recommendation';

  const item = await task028ExpansionExecutionRepository.createOversightItem({
    executionRunId: input.executionRunId,
    stageId: input.stageId,
    pilotProgramId: input.pilotProgramId,
    schoolId: input.schoolId,
    itemType: input.itemType,
    severity: input.severity,
    source: input.source,
    safeSummary,
    reasonCodes: input.reasonCodes ?? [],
    assignedRole: input.assignedRole,
    requiresTeacherReview: input.requiresTeacherReview,
    requiresAdminReview: input.requiresAdminReview,
    requiresPrivacyReview: input.requiresPrivacyReview,
    requiresDeenReview: input.requiresDeenReview,
    requiresSocraticReview: input.requiresSocraticReview,
    requiresCurriculumReview: input.requiresCurriculumReview,
    requiresPause: needsPause,
    requiresRollback: needsRollback,
    metadataSafeJson: {
      ...(input.metadataSafeJson ?? {}),
      timestamp: nowISO(),
    },
  });

  const criticalSeverity = input.severity === 'critical' || input.severity === 'high';
  const pauseRollbackNote = needsPause ? ' Pause recommended.' : '';
  const rollbackNote = needsRollback ? ' Rollback recommended.' : '';

  return {
    ok: true,
    itemId: (item as any).id,
    reasonCodes: criticalSeverity ? ['critical_oversight_item'] : [],
    safeMessage: `Oversight item ${input.itemType} created.${pauseRollbackNote}${rollbackNote}`,
  };
}

export async function listOversightItems(executionRunId: string) {
  const items = await task028ExpansionExecutionRepository.listOversightItems(executionRunId);
  return items.map((i: any) => ({
    id: i.id,
    itemType: i.itemType,
    severity: i.severity,
    status: i.status,
    safeSummary: i.safeSummary,
    source: i.source,
    requiresTeacherReview: i.requiresTeacherReview,
    requiresAdminReview: i.requiresAdminReview,
    requiresPrivacyReview: i.requiresPrivacyReview,
    requiresDeenReview: i.requiresDeenReview,
    requiresSocraticReview: i.requiresSocraticReview,
    requiresCurriculumReview: i.requiresCurriculumReview,
    requiresPause: i.requiresPause,
    requiresRollback: i.requiresRollback,
    assignedRole: i.assignedRole,
    createdAt: i.createdAt,
  }));
}

export function isStudentOversightAccess(actorRole: string): boolean {
  return actorRole === 'student';
}

export { EXPANSION_OVERSIGHT_ITEM_TYPES };
