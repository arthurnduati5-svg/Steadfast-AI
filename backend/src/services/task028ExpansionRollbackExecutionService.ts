import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { transitionExecutionState } from './task028ExpansionExecutionStateMachine';
import { nowISO } from '../contracts/task028ExpansionExecutionContracts';

export interface RollbackResult {
  ok: boolean;
  rollbackId?: string;
  previousStatus?: string;
  newStatus?: string;
  studentAccessBlocked: boolean;
  dataDestructivelyDeleted: boolean;
  auditPreserved: boolean;
  affectedParticipantCount: number;
  reasonCodes: string[];
  safeMessage: string;
}

export async function executeRollback(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  rollbackReason?: string,
  requestId?: string,
): Promise<RollbackResult> {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, affectedParticipantCount: 0, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const runAny = run as any;
  const previousStatus = runAny.status;
  const previousScopeSnapshot: Record<string, unknown> = {
    status: runAny.status,
    currentStage: runAny.currentStage,
    stagePlan: runAny.stagePlan,
    approvedScopeSnapshot: runAny.approvedScopeSnapshot,
    allowedClassIds: runAny.allowedClassIds ?? [],
    allowedSubjectIds: runAny.allowedSubjectIds ?? [],
    allowedCurriculumScopes: runAny.allowedCurriculumScopes ?? [],
    timestamp: nowISO(),
  };

  const transition = await transitionExecutionState(executionRunId, 'rollback_requested', actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, affectedParticipantCount: 0, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(executionRunId);
  const affectedCount = participants.filter((p: any) => p.activationStatus === 'active' || p.activationStatus === 'pending').length;

  await task028ExpansionExecutionRepository.updateParticipantsByRun(executionRunId, {
    activationStatus: 'rolled_back',
  });

  const rollbackRecord = await task028ExpansionExecutionRepository.createRollbackRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    rollbackStatus: 'completed',
    rollbackReason: rollbackReason || 'Rollback executed by operator.',
    safeSummary: `Rollback executed by ${actorRole}. ${affectedCount} participants set to rolled_back. Previous scope preserved.`,
    previousScopeSnapshot,
    restoredScopeSnapshot: {},
    affectedParticipantCount: affectedCount,
    dataDeleted: false,
    auditPreserved: true,
    metadataSafeJson: { timestamp: nowISO() },
  });

  const transition2 = await transitionExecutionState(executionRunId, 'rolled_back', actorRole, actorIdHash, requestId);
  if (!transition2.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, affectedParticipantCount: 0, reasonCodes: transition2.reasonCodes, safeMessage: transition2.safeMessage };
  }

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    stageId: runAny.stageId ?? undefined,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'rollback_executed',
    safeSummary: `Rollback executed by ${actorRole}. ${affectedCount} participants rolled back. Learning evidence preserved.`,
    metadataSafeJson: {
      previousScopeSnapshot,
      affectedParticipantCount: affectedCount,
      dataDeleted: false,
      auditPreserved: true,
      timestamp: nowISO(),
    },
    requestId,
  });

  return {
    ok: true,
    rollbackId: (rollbackRecord as any).id,
    previousStatus,
    newStatus: 'rolled_back',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    affectedParticipantCount: affectedCount,
    reasonCodes: [],
    safeMessage: `Rollback completed. ${affectedCount} participants set to rolled_back. New sessions blocked. Learning evidence preserved. Audit trail preserved.`,
  };
}
