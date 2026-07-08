import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026LearnerAccessGateInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026LearnerAccessGateInput, Task026LearnerAccessGateResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function evaluateLearnerAccess(
  input: Task026LearnerAccessGateInput
): Promise<Task026LearnerAccessGateResult> {
  const validation = validateTask026LearnerAccessGateInput(input);
  if (!validation.valid) {
    return {
      status: 'access_denied_no_school',
      allowed: false,
      reasonCodes: validation.reasonCodes,
      safeMessage: validation.safeMessage,
    };
  }

  const { schoolId, learnerId, cohortId, pilotRunId, requestedContentType } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(pilotRunId);
  if (!run) {
    return {
      status: 'access_denied_no_school',
      allowed: false,
      reasonCodes: ['pilot_run_not_found'],
      safeMessage: 'Pilot run not found.',
    };
  }

  if (run.schoolId !== schoolId) {
    return {
      status: 'access_denied_no_school',
      allowed: false,
      reasonCodes: ['school_mismatch'],
      safeMessage: 'School mismatch: learner does not belong to this pilot run school.',
    };
  }

  if (!run.cohortIds.includes(cohortId)) {
    return {
      status: 'access_denied_not_in_cohort',
      allowed: false,
      reasonCodes: ['learner_not_in_approved_cohort'],
      safeMessage: 'Learner is not in an approved cohort for this pilot.',
    };
  }

  if (run.status !== 'active_controlled') {
    const statusMap: Record<string, Task026LearnerAccessGateResult['status']> = {
      'draft': 'access_denied_pilot_not_active',
      'preflight_pending': 'access_denied_pilot_not_active',
      'ready': 'access_denied_pilot_not_active',
      'paused': 'access_denied_pilot_paused',
      'rollback_pending': 'access_denied_pilot_rolled_back',
      'rolled_back': 'access_denied_pilot_rolled_back',
      'completed': 'access_denied_pilot_blocked',
      'blocked': 'access_denied_pilot_blocked',
      'cancelled': 'access_denied_pilot_blocked',
    };
    const status = statusMap[run.status] || 'access_denied_pilot_not_active';
    return {
      status,
      allowed: false,
      reasonCodes: ['pilot_not_active', `status_${run.status}`],
      safeMessage: `Pilot run is not active. Current status: ${run.status}.`,
    };
  }

  if (run.approvedCurriculumScopeIds.length === 0 && run.approvedSourceScopeIds.length === 0) {
    return {
      status: 'access_denied_no_curriculum',
      allowed: false,
      reasonCodes: ['no_approved_curriculum_scope'],
      safeMessage: 'No approved curriculum scope for this pilot run.',
    };
  }

  if (requestedContentType === 'answer_key' || requestedContentType === 'answer-key') {
    return {
      status: 'access_denied_answer_key_request',
      allowed: false,
      reasonCodes: ['answer_key_request_blocked'],
      safeMessage: 'Answer key requests are blocked for controlled pilot execution.',
    };
  }

  if (requestedContentType === 'teacher_only' || requestedContentType === 'teacher-only') {
    return {
      status: 'access_denied_teacher_only_request',
      allowed: false,
      reasonCodes: ['teacher_only_request_blocked'],
      safeMessage: 'Teacher-only content requests are blocked for learner access.',
    };
  }

  const safeguardingSignals = await task026PilotExecutionRepository.listSafeguardingSignals(pilotRunId);
  const activeBlocks = safeguardingSignals.filter((s: any) => s.status === 'active' || s.status === 'pending_review');
  if (activeBlocks.length > 0) {
    return {
      status: 'access_denied_safeguarding',
      allowed: false,
      reasonCodes: ['safeguarding_block_active'],
      safeMessage: 'Access denied due to active safeguarding block.',
    };
  }

  return {
    status: 'access_allowed',
    allowed: true,
    reasonCodes: [],
    safeMessage: 'Learner access granted.',
  };
}
