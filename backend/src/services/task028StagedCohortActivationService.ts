import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { loadTask027Proof } from './task028Task027ProofLoaderService';
import { transitionExecutionState } from './task028ExpansionExecutionStateMachine';
import { nowISO } from '../contracts/task028ExpansionExecutionContracts';

export interface CohortActivationInput {
  executionRunId: string;
  pilotProgramId: string;
  schoolId: string;
  stageNumber: number;
  plannedStudentCount: number;
  plannedTeacherCount: number;
  allowedClassIds: string[];
  allowedSubjectIds: string[];
  allowedCurriculumScopes: string[];
  expansionProposalId: string;
  actorRole: string;
  actorIdHash?: string;
  requestId?: string;
}

export interface CohortActivationResult {
  ok: boolean;
  stageId?: string;
  participantIds?: string[];
  reasonCodes: string[];
  safeMessage: string;
}

export async function activateExpandedCohort(input: CohortActivationInput): Promise<CohortActivationResult> {
  const { executionRunId, pilotProgramId, schoolId, stageNumber, expansionProposalId, actorRole, actorIdHash, requestId } = input;

  const proof = await loadTask027Proof();
  if (!proof.safeToExecuteExpansion) {
    return { ok: false, reasonCodes: ['task027_proof_not_accepted', ...proof.blockingIssues], safeMessage: 'Task 027 proof not accepted. Cannot activate cohort.' };
  }

  const approval = await task027PilotExpansionRepository.getApprovalByProposalId(expansionProposalId);
  if (!approval) {
    return { ok: false, reasonCodes: ['expansion_proposal_not_approved'], safeMessage: 'No approved expansion proposal found.' };
  }
  const approvalAny = approval as any;
  if (approvalAny.approvalStatus !== 'approved' || approvalAny.safeToExpand !== true) {
    return { ok: false, reasonCodes: ['expansion_proposal_not_approved'], safeMessage: 'Expansion proposal is not approved.' };
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  if (runAny.status === 'rolled_back') {
    return { ok: false, reasonCodes: ['expansion_rolled_back'], safeMessage: 'Expansion has been rolled back. Cannot activate cohort.' };
  }

  const killSwitchAudits = await task028ExpansionExecutionRepository.listAuditRecords(executionRunId);
  const hasKillSwitch = killSwitchAudits.some((a: any) => a.action === 'kill_switch_engage');
  if (hasKillSwitch) {
    return { ok: false, reasonCodes: ['kill_switch_enabled'], safeMessage: 'Kill switch is enabled. Cannot activate cohort.' };
  }

  if (input.plannedStudentCount > 500) {
    return { ok: false, reasonCodes: ['student_count_exceeds_limit'], safeMessage: 'Student count exceeds maximum allowed limit of 500.' };
  }
  if (input.plannedTeacherCount > 50) {
    return { ok: false, reasonCodes: ['teacher_count_exceeds_limit'], safeMessage: 'Teacher count exceeds maximum allowed limit of 50.' };
  }
  if (input.allowedClassIds.length > 20) {
    return { ok: false, reasonCodes: ['class_scope_exceeds_limit'], safeMessage: 'Class scope exceeds maximum of 20 classes.' };
  }
  if (input.allowedSubjectIds.length > 30) {
    return { ok: false, reasonCodes: ['subject_scope_exceeds_limit'], safeMessage: 'Subject scope exceeds maximum of 30 subjects.' };
  }
  if (input.allowedCurriculumScopes.length > 10) {
    return { ok: false, reasonCodes: ['curriculum_scope_exceeds_limit'], safeMessage: 'Curriculum scope exceeds maximum of 10 scopes.' };
  }

  const stage = await task028ExpansionExecutionRepository.createExecutionStage({
    executionRunId,
    expansionProposalId,
    schoolId,
    stageNumber,
    status: 'active',
    plannedStudentCount: input.plannedStudentCount,
    plannedTeacherCount: input.plannedTeacherCount,
    allowedClassIds: input.allowedClassIds,
    allowedSubjectIds: input.allowedSubjectIds,
    allowedCurriculumScopes: input.allowedCurriculumScopes,
    safeSummary: `Stage ${stageNumber} activated for expansion cohort.`,
    metadataSafeJson: {
      expansionProposalId,
      activatedBy: actorIdHash ? `${actorRole}_${actorIdHash.slice(0, 8)}` : actorRole,
      timestamp: nowISO(),
    },
  });
  const stageAny = stage as any;

  let targetStatus: string;
  if (stageNumber === 1) targetStatus = 'stage_1_active';
  else if (stageNumber === 2) targetStatus = 'stage_2_active';
  else if (stageNumber === 3) targetStatus = 'stage_3_active';
  else targetStatus = 'stage_1_active';

  const transition = await transitionExecutionState(executionRunId, targetStatus as any, actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    stageId: stageAny.id,
    pilotProgramId,
    schoolId,
    actorRole,
    actorIdHash,
    action: 'cohort_activated',
    safeSummary: `Stage ${stageNumber} cohort activated by ${actorRole}.`,
    metadataSafeJson: {
      stageNumber,
      plannedStudentCount: input.plannedStudentCount,
      plannedTeacherCount: input.plannedTeacherCount,
      allowedClassIds: input.allowedClassIds,
      allowedSubjectIds: input.allowedSubjectIds,
      allowedCurriculumScopes: input.allowedCurriculumScopes,
      timestamp: nowISO(),
    },
    requestId,
  });

  return {
    ok: true,
    stageId: stageAny.id,
    reasonCodes: [],
    safeMessage: `Stage ${stageNumber} cohort activated successfully.`,
  };
}
